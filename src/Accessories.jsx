// GẮN PHỤ KIỆN VÀO XƯƠNG nhân vật để đồ chuyển động theo (gật đầu thì mũ gật theo…).
//
// Cách làm:
// 1) Tìm xương đầu / cổ / lưng / tay theo tên (robot: "Head", Mixamo: "mixamorigHead"…)
// 2) Ước lượng điểm gắn (đỉnh đầu, giữa hai mắt…) và cỡ đầu từ hình dáng model
// 3) Gắn món đồ làm "con" của xương (createPortal), bù lại xoay/co giãn của xương
//    để món đồ đứng thẳng và đúng cỡ.
import { Suspense, useMemo } from 'react'
import { createPortal } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ACCESSORY_BY_ID, SLOTS } from './accessoryCatalog'
import { LoadBoundary, useResolvedUrl } from './loading'

const BONE_PATTERNS = {
  head: [/^(mixamorig)?head$/i, /head/i],
  neck: [/^(mixamorig)?neck$/i, /neck/i],
  back: [/spine2$/i, /upperchest|chest/i, /^torso$/i, /spine1?$/i],
  hand: [/righthand$/i, /^hand[._]?r$/i, /palm2[._]r$/i, /right.?hand|hand.?right|^r[._]hand/i],
}

function findBone(bones, slot) {
  for (const re of BONE_PATTERNS[slot]) {
    const bone = bones.find((b) => re.test(b.name.replace(/:/g, '')))
    if (bone) return bone
  }
  return null
}

const UP = new THREE.Vector3(0, 1, 0)
const worldPos = (o) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld)

// Tính điểm gắn cho từng vị trí đeo. Gọi khi model vừa sao chép (đang ở tư thế gốc).
// box: khung bao model; scale: hệ số co giãn model → mét; height: chiều cao (m); rotationY: hướng xoay thêm
export function computeAnchors(model, box, scale, height, rotationY) {
  const u = 1 / scale // số đơn vị model trong 1 mét
  const bones = []
  model.traverse((o) => o.isBone && !/end$/i.test(o.name) && bones.push(o))
  const fwd = new THREE.Vector3(Math.sin(-rotationY), 0, Math.cos(-rotationY)) // phía trước mặt
  const center = box.getCenter(new THREE.Vector3())
  const top = box.max.y

  const headBone = findBone(bones, 'head')
  const hb = headBone ? worldPos(headBone) : new THREE.Vector3(center.x, top - 0.22 * height * u, center.z)
  // bán kính đầu ước lượng = nửa khoảng từ xương đầu tới đỉnh model, giới hạn cho hợp lý
  const r = THREE.MathUtils.clamp((top - hb.y) / 2, 0.05 * height * u, 0.2 * height * u)
  const headScale = r / u / 0.13 // so với đầu chuẩn 0.13m
  const bodyScale = height / 1.6

  const neckBone = findBone(bones, 'neck')
  const backBone = findBone(bones, 'back')
  const handBone = findBone(bones, 'hand')

  const make = (bone, pos, s) => {
    const parent = bone || model
    return { bone: parent, inv: parent.matrixWorld.clone().invert(), pos, scale: s }
  }
  return {
    u,
    fwd,
    head: make(headBone, new THREE.Vector3(hb.x, hb.y + 2 * r, hb.z), headScale),
    eyes: make(headBone, hb.clone().addScaledVector(UP, r).addScaledVector(fwd, r * 0.95), headScale),
    ears: make(headBone, hb.clone().addScaledVector(UP, r), headScale),
    neck: make(neckBone || headBone, (neckBone ? worldPos(neckBone) : hb.clone()).addScaledVector(fwd, r * 0.75), bodyScale),
    back: make(backBone, (backBone ? worldPos(backBone) : center.clone()).addScaledVector(fwd, -0.06 * height * u), bodyScale),
    hand: make(handBone, handBone ? worldPos(handBone) : center.clone().addScaledVector(fwd, 0.15 * height * u), bodyScale),
  }
}

// Phụ kiện từ file .glb của bạn: tự co giãn cho vừa vị trí đeo
function CustomGltf({ url, slot }) {
  const { scene } = useGLTF(url)
  const { object, s, offset } = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((o) => { if (o.isMesh) o.castShadow = true })
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const s = SLOTS[slot].size / (Math.max(size.x, size.y, size.z) || 1)
    const c = box.getCenter(new THREE.Vector3())
    // mũ: đáy đặt lên đỉnh đầu; món khác: đặt tâm vào điểm gắn
    return { object, s, offset: [-c.x * s, slot === 'head' ? -box.min.y * s : -c.y * s, -c.z * s] }
  }, [scene, slot])
  return (
    <group position={offset} scale={s}>
      <primitive object={object} />
    </group>
  )
}

function CustomAccessory({ refId, slot }) {
  const url = useResolvedUrl(refId)
  return url ? <CustomGltf url={url} slot={slot} /> : null
}

function Worn({ acc, anchors, rotationY }) {
  const anchor = anchors[acc.slot]
  const item = ACCESSORY_BY_ID[acc.item]

  const { position, quaternion, scale } = useMemo(() => {
    if (!anchor) return {}
    const { u } = anchors
    const s = anchor.scale * (acc.scale ?? 1)
    const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -rotationY, 0))
    // dịch chuyển (mét, theo hướng nhân vật: x phải, y lên, z trước) → đơn vị model
    const offset = new THREE.Vector3(...(acc.offset || [0, 0, 0])).multiplyScalar(u * anchor.scale).applyQuaternion(turn)
    const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -rotationY + (acc.rotY || 0), 0))
    const wanted = new THREE.Matrix4().compose(anchor.pos.clone().add(offset), rot, new THREE.Vector3().setScalar(s * u))
    const local = anchor.inv.clone().multiply(wanted) // đổi sang hệ tọa độ của xương
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3()
    local.decompose(p, q, sc)
    return { position: p, quaternion: q, scale: sc }
  }, [acc, anchor, anchors, rotationY])

  if (!anchor) return null
  const content = item ? (
    <item.Model color={acc.color} />
  ) : acc.model ? (
    <LoadBoundary key={acc.model}>
      <Suspense fallback={null}><CustomAccessory refId={acc.model} slot={acc.slot} /></Suspense>
    </LoadBoundary>
  ) : null

  return createPortal(
    <group position={position} quaternion={quaternion} scale={scale}>{content}</group>,
    anchor.bone
  )
}

export function WornAccessories({ accessories, anchors, rotationY }) {
  if (!accessories?.length) return null
  return accessories.map((acc) => <Worn key={acc.slot} acc={acc} anchors={anchors} rotationY={rotationY} />)
}
