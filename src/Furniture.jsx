// NẠP MỘT MÓN NỘI THẤT từ public/furniture/<name>.glb (bộ Kenney Furniture Kit, CC0).
// Model Kenney có gốc tọa độ ở góc, nên ở đây ta dời cho tâm đáy nằm đúng `position`.
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Model Kenney nhỏ (bàn rộng 0.73), nhân 2 cho đúng tỉ lệ người thật.
export const FURNITURE_SCALE = 2

export function Furniture({ name, position = [0, 0, 0], rotation = 0, scale = FURNITURE_SCALE }) {
  const { scene } = useGLTF(`/furniture/${name}.glb`)

  const { object, offset } = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    return { object, offset: [-center.x, -box.min.y, -center.z] }
  }, [scene])

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <primitive object={object} position={offset} />
    </group>
  )
}
