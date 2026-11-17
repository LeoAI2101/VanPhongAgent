import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Office } from './Office'
import { Agent } from './Agent'
import { STATUS } from './agents'
import { useOffice } from './store'
import { startSimulator } from './simulator'
import { startConnection } from './connection'
import { startBackup } from './backup'
import { CharacterEditor } from './CharacterEditor'

// Bảng bên phải: nhật ký sự kiện mới nhất
function LogPanel() {
  const log = useOffice((s) => s.log)
  const profiles = useOffice((s) => s.profiles)
  const names = Object.fromEntries(profiles.map((p) => [p.id, p.name]))
  return (
    <div style={{ position: 'absolute', zIndex: 10, top: 12, right: 12, width: 260, maxHeight: '40vh', overflow: 'auto', background: 'rgba(15,23,42,.85)', color: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 Nhật ký hoạt động</div>
      {log.map((e, i) => (
        <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #334155' }}>
          <span style={{ opacity: 0.5 }}>{e.time}</span> {e.real ? '🔌' : ''}<b>{names[e.agentId] || e.agentId}</b>: {STATUS[e.status]?.label || e.status}
          {e.real && e.detail && <span style={{ opacity: 0.6 }}> — {e.detail}</span>}
        </div>
      ))}
    </div>
  )
}

// Thanh trạng thái góc dưới bên phải: server + công tắc giả lập
function StatusBar() {
  const server = useOffice((s) => s.server)
  const simulatorOn = useOffice((s) => s.simulatorOn)
  const setSimulator = useOffice((s) => s.setSimulator)
  const dot = { online: ['#22c55e', 'Server đang chạy'], offline: ['#ef4444', 'Mất kết nối server'], connecting: ['#facc15', 'Đang kết nối…'] }[server]
  return (
    <div style={{ position: 'absolute', zIndex: 10, right: 12, bottom: 12, display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(15,23,42,.85)', color: '#e2e8f0', borderRadius: 10, padding: '6px 10px', fontSize: 12 }}>
      <span><span style={{ color: dot[0] }}>●</span> {dot[1]}</span>
      <label style={{ cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center' }} title="Giả lập chỉ chạy cho nhân viên chưa nối agent thật">
        <input type="checkbox" checked={simulatorOn} onChange={(e) => setSimulator(e.target.checked)} /> Giả lập
      </label>
    </div>
  )
}

export default function App() {
  const profiles = useOffice((s) => s.profiles)
  useEffect(() => startSimulator(), [])
  useEffect(() => startConnection(), [])
  useEffect(() => startBackup(), [])

  return (
    <>
      <Canvas shadows camera={{ position: [0, 15, 15], fov: 50 }}>
        <color attach="background" args={['#1e2330']} />
        {/* ánh sáng: trời ấm phía trên + mặt trời chiếu xiên tạo bóng */}
        <hemisphereLight args={['#fff4e0', '#6b5a48', 0.9]} />
        <directionalLight position={[6, 12, 8]} intensity={1.8} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0005} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
        {/* model nạp từ file nên cần Suspense để chờ */}
        <Suspense fallback={null}>
          <Office />
        </Suspense>
        {profiles.map((p, i) => (
          <Agent key={p.id} profile={p} index={i} />
        ))}
        <OrbitControls maxPolarAngle={Math.PI / 2.2} target={[0, 0, 0]} />
      </Canvas>
      <LogPanel />
      <StatusBar />
      <CharacterEditor />
    </>
  )
}
