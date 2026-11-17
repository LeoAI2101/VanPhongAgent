// NHÂN VIÊN: mỗi khung hình tìm "mục tiêu" (đi đâu, quay hướng nào, làm động tác gì)
// theo trạng thái + cá tính khi rảnh → bước tới → báo động tác cho Character.
// Bấm vào nhân vật để mở Phòng thay đồ.
import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import { runtimeOf, useOffice } from './store'
import { DESK_SLOTS, IDLE_MODES, LOUNGE_SEATS, LOUNGE_SPOTS, PLACES, STATUS, WANDER_POINTS, resolveIdleMode } from './agents'
import { ROBOT, effectiveCharacter } from './characters'
import { Character, CharacterBoundary } from './Character'

const SPEED = 2.2    // mét mỗi giây
const TURN_SPEED = 8 // tốc độ xoay người
const WANDER_PAUSE = 2500 // đi dạo: dừng lại bao lâu (ms) trước khi đi tiếp

// Xoay góc a về phía b theo đường ngắn nhất
function turnTowards(a, b, t) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a))
  return a + diff * Math.min(1, t)
}

// Vị trí trong một điểm chung (quầy cà phê, giá sách): 4 người một hàng
function placeSpot(place, index) {
  const p = PLACES[place]
  const row = Math.floor(index / 4)
  const awayFromWall = p.face < 0 ? 1 : -1
  return { pos: [p.pos[0] + row * 0.9 * awayFromWall, p.pos[1] + ((index % 4) - 1.5) * 0.9], face: p.face }
}

// Thứ tự của agent này trong số những agent đang rảnh theo cùng một kiểu (để chia ghế/chỗ đứng)
function orderAmongIdlers(profileId, mode, now) {
  const s = useOffice.getState()
  return s.profiles
    .filter((p) => runtimeOf(s, p.id).status === 'idle' && resolveIdleMode(p, now) === mode)
    .findIndex((p) => p.id === profileId)
}

// MỤC TIÊU: { pos: [x, z], face: góc hoặc null (giữ nguyên), anim }
function computeGoal({ profile, status, index, desk, now, wander, position }) {
  const info = STATUS[status]
  if (status !== 'idle') {
    if (info.place === 'desk') return { pos: desk, face: Math.PI, anim: info.anim }
    return { ...placeSpot(info.place, index), anim: info.anim }
  }

  const mode = resolveIdleMode(profile, now)
  if (mode !== 'wander') wander.point = null

  switch (mode) {
    case 'desk':
      return { pos: desk, face: Math.PI, anim: 'sit' }
    case 'sofa': {
      const k = Math.max(0, orderAmongIdlers(profile.id, 'sofa', now))
      if (k < LOUNGE_SEATS.length) {
        const [x, z, face] = LOUNGE_SEATS[k]
        return { pos: [x, z], face, anim: 'sit' }
      }
      return { pos: LOUNGE_SPOTS[(k - LOUNGE_SEATS.length) % LOUNGE_SPOTS.length], face: Math.PI, anim: 'idle' }
    }
    case 'dance': {
      const k = Math.max(0, orderAmongIdlers(profile.id, 'dance', now))
      return { pos: LOUNGE_SPOTS[k % LOUNGE_SPOTS.length], face: 0, anim: 'dance' } // quay ra phía camera
    }
    case 'wander': {
      const arrived = wander.point && Math.hypot(wander.point[0] - position.x, wander.point[1] - position.z) < 0.05
      if (arrived && !wander.arrivedAt) wander.arrivedAt = now
      if (!wander.point || (arrived && now - wander.arrivedAt > WANDER_PAUSE)) {
        wander.point = WANDER_POINTS[Math.floor(Math.random() * WANDER_POINTS.length)]
        wander.arrivedAt = 0
      }
      return { pos: wander.point, face: null, anim: 'idle' }
    }
    default: // coffee
      return { ...placeSpot('coffee', index), anim: 'idle' }
  }
}

export function Agent({ profile, index }) {
  const root = useRef()
  const ring = useRef()
  const animRef = useRef('idle') // động tác hiện tại, Character đọc mỗi khung hình
  const wander = useRef({ point: null, arrivedAt: 0 })
  const state = useOffice((s) => runtimeOf(s, profile.id))
  const selected = useOffice((s) => s.editor.open && s.editor.selectedId === profile.id)
  const live = useOffice((s) => Boolean(s.lastSeen[profile.id])) // đã nối agent thật
  const setError = useOffice((s) => s.setError)
  const openEditor = useOffice((s) => s.openEditor)
  const info = STATUS[state.status]

  const character = useMemo(() => effectiveCharacter(profile), [profile])
  const desk = DESK_SLOTS[profile.desk] || DESK_SLOTS[0]
  const label = state.status === 'idle' ? IDLE_MODES[profile.idle || 'coffee'].short : info.label

  useFrame((_, delta) => {
    const g = root.current
    const now = performance.now()
    const goal = computeGoal({ profile, status: state.status, index, desk, now, wander: wander.current, position: g.position })

    const dx = goal.pos[0] - g.position.x
    const dz = goal.pos[1] - g.position.z
    const dist = Math.hypot(dx, dz)
    const walking = dist > 0.05

    if (walking) {
      const step = Math.min(dist, SPEED * delta)
      g.position.x += (dx / dist) * step
      g.position.z += (dz / dist) * step
      g.rotation.y = turnTowards(g.rotation.y, Math.atan2(dx, dz), TURN_SPEED * delta)
    } else if (goal.face !== null) {
      g.rotation.y = turnTowards(g.rotation.y, goal.face, TURN_SPEED * delta)
    }
    animRef.current = walking ? 'walk' : goal.anim

    // Vòng sáng dưới chân nhấp nháy khi cần bạn chú ý
    const urgent = state.status === 'waiting' || state.status === 'error'
    ring.current.scale.setScalar(urgent ? 1 + Math.sin(now / 150) * 0.15 : 1)
  })

  const common = { tint: profile.shirt, animRef, agentId: profile.id, accessories: profile.accessories }
  const robot = <Character character={{ ...ROBOT, height: character.height }} {...common} />

  return (
    <group
      ref={root}
      position={[desk[0], 0, desk[1]]}
      onClick={(e) => { e.stopPropagation(); openEditor(profile.id) }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      <CharacterBoundary key={character.model} fallback={robot} onError={(msg) => setError(profile.id, msg)}>
        <Suspense fallback={null}>
          <Character character={character} {...common} />
        </Suspense>
      </CharacterBoundary>

      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.42, 0.55, 40]} />
        <meshBasicMaterial color={info.color} transparent opacity={0.85} />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.62, 0.7, 40]} />
          <meshBasicMaterial color="white" />
        </mesh>
      )}

      {/* zIndexRange thấp để nhãn không đè lên các bảng điều khiển */}
      <Html position={[0, character.height + 0.5, 0]} center distanceFactor={9} zIndexRange={[5, 0]}>
        <div style={{ background: 'rgba(15,23,42,.85)', color: 'white', padding: '4px 8px', borderRadius: 8, whiteSpace: 'nowrap', fontSize: 13, borderLeft: `4px solid ${profile.shirt}`, pointerEvents: 'none' }}>
          {live && '🔌 '}<b>{profile.name}</b> · {label}
          {state.detail && <div style={{ opacity: 0.7, fontSize: 11 }}>{state.detail}</div>}
        </div>
      </Html>
    </group>
  )
}

useGLTF.preload(ROBOT.model)
