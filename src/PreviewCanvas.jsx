// Ô XEM TRƯỚC 3D trong Phòng thay đồ: một sân khấu nhỏ, nhân vật tự xoay, kéo chuột để xoay tay.
import { Suspense, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { effectiveCharacter } from './characters'
import { Character, CharacterBoundary } from './Character'

export function PreviewCanvas({ profile, anim }) {
  const animRef = useRef(anim)
  animRef.current = anim
  const character = useMemo(() => effectiveCharacter(profile), [profile])

  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4.2], fov: 40 }} style={{ height: 230, borderRadius: 8, background: '#0b1220' }}>
      <hemisphereLight args={['#fff4e0', '#334155', 1.2]} />
      <directionalLight position={[2, 5, 3]} intensity={1.6} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.3, 48]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <CharacterBoundary key={character.model} fallback={null}>
        <Suspense fallback={null}>
          <Character character={character} tint={profile.shirt} animRef={animRef} agentId={profile.id} accessories={profile.accessories} />
        </Suspense>
      </CharacterBoundary>
      <OrbitControls target={[0, 0.9, 0]} enablePan={false} autoRotate autoRotateSpeed={1.5} minDistance={1.5} maxDistance={8} />
    </Canvas>
  )
}
