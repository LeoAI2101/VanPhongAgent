// NẠP NHÂN VẬT BẤT KỲ (.glb hoặc .fbx), tự co giãn, tự tìm animation.
// Agent.jsx ghi động tác muốn chạy vào animRef (ví dụ 'walk', 'sit'), file này lo phần còn lại.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { ANIM_KEYS, FALLBACK, matchClipName } from './characters'
import { resolveUrl } from './storage'
import { useOffice } from './store'
import { extOf, LoadBoundary, useResolvedUrl } from './loading'
import { computeAnchors, WornAccessories } from './Accessories'

export { LoadBoundary as CharacterBoundary }

export function Character(props) {
  const ref = props.character.model
  const url = useResolvedUrl(ref)
  if (!url) return null
  return extOf(ref) === 'fbx' ? <FbxCharacter {...props} url={url} /> : <GltfCharacter {...props} url={url} />
}

function GltfCharacter(props) {
  const gltf = useGLTF(props.url)
  return <Body {...props} source={gltf.scene} clips={gltf.animations} />
}

function FbxCharacter(props) {
  const fbx = useLoader(FBXLoader, props.url)
  return <Body {...props} source={fbx} clips={fbx.animations} />
}

// Nạp các file animation riêng (Mixamo). Mỗi file lấy clip đầu tiên, đặt tên theo động tác.
function useExtraClips(animFiles) {
  const [clips, setClips] = useState([])
  useEffect(() => {
    let alive = true
    const entries = Object.entries(animFiles || {}).filter(([, ref]) => ref)
    Promise.all(
      entries.map(async ([key, ref]) => {
        try {
          const url = await resolveUrl(ref)
          const loader = extOf(ref) === 'fbx' ? new FBXLoader() : new GLTFLoader()
          const result = await loader.loadAsync(url)
          const clip = result.animations?.[0]
          if (!clip) return null
          const named = clip.clone()
          named.name = key
          return named
        } catch (e) {
          console.warn(`Không nạp được animation "${key}"`, e)
          return null
        }
      })
    ).then((list) => alive && setClips(list.filter(Boolean)))
    return () => { alive = false }
  }, [animFiles])
  return clips
}

function Body({ character, source, clips, tint, animRef, agentId, accessories }) {
  const height = character.height ?? 1.6
  const extra = useExtraClips(character.animFiles)
  const setClipNames = useOffice((s) => s.setClipNames)
  const setMaterialNames = useOffice((s) => s.setMaterialNames)
  const inner = useRef()
  const current = useRef(null)

  // 1) Sao chép model (mỗi agent cần bộ xương riêng), tô màu, đo kích thước để co giãn
  const rotationY = character.rotationY || 0
  const { model, scale, offset, materials, anchors } = useMemo(() => {
    const model = clone(source)
    const materials = new Set()
    model.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      const list = Array.isArray(o.material) ? o.material : [o.material]
      list.forEach((m) => m?.name && materials.add(m.name))
      if (tint && character.tintMaterial && !Array.isArray(o.material) && o.material?.name === character.tintMaterial) {
        o.material = o.material.clone()
        o.material.color?.set(tint)
      }
    })
    model.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = size.y > 0 ? height / size.y : 1
    // điểm gắn phụ kiện (tính lúc model còn ở tư thế gốc)
    const anchors = computeAnchors(model, box, scale, height, rotationY)
    // dời để tâm đáy (chân) nằm đúng gốc tọa độ
    return { model, scale, offset: [-center.x * scale, -box.min.y * scale, -center.z * scale], materials: [...materials], anchors }
  }, [source, tint, character.tintMaterial, height, rotationY])

  // 2) Gom clip có sẵn + clip từ file riêng, rồi ánh xạ sang các động tác
  const allClips = useMemo(() => [...clips, ...extra], [clips, extra])
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model])
  const actions = useMemo(() => {
    const names = allClips.map((c) => c.name)
    const map = {}
    for (const key of ANIM_KEYS) {
      const name = matchClipName(names, key, character.anims)
      if (name) map[key] = mixer.clipAction(allClips.find((c) => c.name === name))
    }
    return map
  }, [mixer, allClips, character.anims])

  useEffect(() => setClipNames(agentId, allClips.map((c) => c.name)), [agentId, allClips, setClipNames])
  useEffect(() => setMaterialNames(agentId, materials), [agentId, materials, setMaterialNames])
  useEffect(() => () => mixer.stopAllAction(), [mixer])

  // 3) Mỗi khung hình: chọn động tác, chuyển mượt, cập nhật animation
  useFrame((_, delta) => {
    let key = animRef.current
    while (key && !actions[key]) key = FALLBACK[key] // thiếu thì dùng động tác thay thế
    const next = key ? actions[key] : null

    if (next !== current.current) {
      if (next) {
        next.reset()
        if (character.playOnce?.includes(key)) {
          next.setLoop(THREE.LoopOnce, 1)
          next.clampWhenFinished = true
        } else {
          next.setLoop(THREE.LoopRepeat, Infinity)
        }
        next.fadeIn(0.3).play()
      }
      current.current?.fadeOut(0.3)
      current.current = next
    }
    mixer.update(delta)

    // Model không có clip đi bộ → nhún nhảy cho có cảm giác đang đi
    const t = performance.now() / 1000
    inner.current.position.y = animRef.current === 'walk' && !actions.walk ? Math.abs(Math.sin(t * 10)) * 0.12 : 0
  })

  return (
    <group ref={inner}>
      <group rotation={[0, rotationY, 0]}>
        <group position={offset} scale={scale}>
          <primitive object={model} />
        </group>
      </group>
      {/* phụ kiện được gắn thẳng vào xương bên trong model */}
      <WornAccessories accessories={accessories} anchors={anchors} rotationY={rotationY} />
    </group>
  )
}
