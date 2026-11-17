// KHO PHỤ KIỆN: mỗi món dựng từ khối hình đơn giản (low-poly), không cần file.
// Kích thước tính bằng mét, thiết kế cho đầu bán kính ~0.13m (người cao 1.6m).
// Gốc tọa độ của mỗi món = điểm gắn của vị trí đeo (xem SLOTS). Trục z+ là phía trước mặt.

// VỊ TRÍ ĐEO — mỗi vị trí chỉ đeo được 1 món
export const SLOTS = {
  head:  { label: 'Đầu',  size: 0.3 },  // gốc: đỉnh đầu
  eyes:  { label: 'Mắt',  size: 0.16 }, // gốc: giữa hai mắt
  ears:  { label: 'Tai',  size: 0.35 }, // gốc: tâm đầu
  neck:  { label: 'Cổ',   size: 0.15 }, // gốc: cổ, phía trước
  back:  { label: 'Lưng', size: 0.35 }, // gốc: giữa lưng
  hand:  { label: 'Tay',  size: 0.12 }, // gốc: lòng bàn tay phải
}

const PI = Math.PI
const Mat = ({ color, metal = 0 }) => <meshStandardMaterial color={color} flatShading roughness={metal ? 0.3 : 0.7} metalness={metal} />

function Cap({ color }) {
  return (
    <group>
      <mesh position={[0, -0.085, 0]} castShadow><sphereGeometry args={[0.148, 10, 6, 0, PI * 2, 0, PI / 2]} /><Mat color={color} /></mesh>
      <mesh position={[0, -0.08, 0.13]} castShadow><boxGeometry args={[0.2, 0.015, 0.13]} /><Mat color={color} /></mesh>
      <mesh position={[0, 0.065, 0]}><sphereGeometry args={[0.018, 6, 4]} /><Mat color="#ffffff" /></mesh>
    </group>
  )
}

function TopHat({ color }) {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} castShadow><cylinderGeometry args={[0.18, 0.18, 0.015, 16]} /><Mat color={color} /></mesh>
      <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.105, 0.1, 0.23, 16]} /><Mat color={color} /></mesh>
      <mesh position={[0, 0.015, 0]}><cylinderGeometry args={[0.103, 0.103, 0.035, 16]} /><Mat color="#ef4444" /></mesh>
    </group>
  )
}

function Beanie({ color }) {
  return (
    <group>
      <mesh position={[0, -0.09, 0]} scale={[1, 1.15, 1]} castShadow><sphereGeometry args={[0.15, 10, 6, 0, PI * 2, 0, PI / 2]} /><Mat color={color} /></mesh>
      <mesh position={[0, -0.085, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.148, 0.025, 6, 16]} /><Mat color="#f8fafc" /></mesh>
      <mesh position={[0, 0.095, 0]} castShadow><sphereGeometry args={[0.045, 8, 6]} /><Mat color="#f8fafc" /></mesh>
    </group>
  )
}

function Crown({ color }) {
  const spikes = [0, 1, 2, 3, 4, 5]
  return (
    <group position={[0, -0.03, 0]}>
      <mesh castShadow><cylinderGeometry args={[0.115, 0.11, 0.06, 12, 1, true]} /><meshStandardMaterial color={color} metalness={0.7} roughness={0.25} side={2} flatShading /></mesh>
      {spikes.map((i) => {
        const a = (i / spikes.length) * PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.11, 0.06, Math.cos(a) * 0.11]} castShadow>
            <coneGeometry args={[0.025, 0.07, 4]} /><Mat color={color} metal={0.7} />
          </mesh>
        )
      })}
      <mesh position={[0, 0, 0.115]}><sphereGeometry args={[0.018, 6, 4]} /><Mat color="#ef4444" metal={0.3} /></mesh>
    </group>
  )
}

function Glasses({ color }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.055, 0, 0]}><torusGeometry args={[0.04, 0.008, 6, 16]} /><Mat color={color} /></mesh>
          <mesh position={[s * 0.1, 0, -0.07]}><boxGeometry args={[0.008, 0.008, 0.14]} /><Mat color={color} /></mesh>
        </group>
      ))}
      <mesh><boxGeometry args={[0.03, 0.008, 0.008]} /><Mat color={color} /></mesh>
    </group>
  )
}

function Sunglasses({ color }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.052, 0, 0]}><boxGeometry args={[0.085, 0.045, 0.012]} /><meshStandardMaterial color="#0b0f19" metalness={0.6} roughness={0.15} /></mesh>
          <mesh position={[s * 0.1, 0.012, -0.07]}><boxGeometry args={[0.008, 0.008, 0.14]} /><Mat color={color} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.012, 0]}><boxGeometry args={[0.03, 0.01, 0.01]} /><Mat color={color} /></mesh>
    </group>
  )
}

function Headphones({ color }) {
  return (
    <group>
      <mesh><torusGeometry args={[0.16, 0.016, 6, 20, PI]} /><Mat color={color} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.16, -0.01, 0]} rotation={[0, 0, PI / 2]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.045, 12]} /><Mat color={color} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'p' + s} position={[s * 0.14, -0.01, 0]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} /><Mat color="#111827" />
        </mesh>
      ))}
    </group>
  )
}

function Bow({ color }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.04, 0, 0]} rotation={[0, 0, s * (PI / 2)]} castShadow>
          <coneGeometry args={[0.035, 0.07, 4]} /><Mat color={color} />
        </mesh>
      ))}
      <mesh><sphereGeometry args={[0.02, 6, 4]} /><Mat color={color} /></mesh>
    </group>
  )
}

function Tie({ color }) {
  return (
    <group>
      <mesh castShadow><boxGeometry args={[0.04, 0.035, 0.02]} /><Mat color={color} /></mesh>
      <mesh position={[0, -0.14, 0]} scale={[1, 1, 0.35]} castShadow><cylinderGeometry args={[0.04, 0.025, 0.24, 4]} /><Mat color={color} /></mesh>
      <mesh position={[0, -0.27, 0]} rotation={[0, PI / 4, 0]} scale={[1, 1, 0.35]}><coneGeometry args={[0.04, 0.04, 4]} /><Mat color={color} /></mesh>
    </group>
  )
}

function Backpack({ color }) {
  return (
    <group position={[0, 0, -0.09]}>
      <mesh castShadow><boxGeometry args={[0.3, 0.36, 0.15]} /><Mat color={color} /></mesh>
      <mesh position={[0, -0.07, -0.085]} castShadow><boxGeometry args={[0.22, 0.15, 0.04]} /><Mat color={color} /></mesh>
      <mesh position={[0, 0.19, 0]}><boxGeometry args={[0.12, 0.03, 0.05]} /><Mat color="#1f2937" /></mesh>
    </group>
  )
}

function CoffeeCup({ color }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow><cylinderGeometry args={[0.04, 0.033, 0.1, 12]} /><Mat color={color} /></mesh>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.037, 0.037, 0.004, 12]} /><Mat color="#5b3a1e" /></mesh>
      <mesh position={[0.045, 0.055, 0]}><torusGeometry args={[0.022, 0.007, 6, 12]} /><Mat color={color} /></mesh>
    </group>
  )
}

// DANH MỤC — thêm món mới: viết một hàm như trên rồi thêm một dòng vào đây
export const ACCESSORIES = [
  { id: 'cap',        name: 'Mũ lưỡi trai', icon: '🧢', slot: 'head', color: '#ef4444', Model: Cap },
  { id: 'tophat',     name: 'Mũ chóp',      icon: '🎩', slot: 'head', color: '#1e293b', Model: TopHat },
  { id: 'beanie',     name: 'Mũ len',       icon: '🧶', slot: 'head', color: '#f97316', Model: Beanie },
  { id: 'crown',      name: 'Vương miện',   icon: '👑', slot: 'head', color: '#facc15', Model: Crown },
  { id: 'glasses',    name: 'Kính tròn',    icon: '👓', slot: 'eyes', color: '#111827', Model: Glasses },
  { id: 'sunglasses', name: 'Kính râm',     icon: '🕶️', slot: 'eyes', color: '#111827', Model: Sunglasses },
  { id: 'headphones', name: 'Tai nghe',     icon: '🎧', slot: 'ears', color: '#e5e7eb', Model: Headphones },
  { id: 'bow',        name: 'Nơ',           icon: '🎀', slot: 'neck', color: '#ec4899', Model: Bow },
  { id: 'tie',        name: 'Cà vạt',       icon: '👔', slot: 'neck', color: '#2563eb', Model: Tie },
  { id: 'backpack',   name: 'Ba lô',        icon: '🎒', slot: 'back', color: '#16a34a', Model: Backpack },
  { id: 'coffee',     name: 'Cốc cà phê',   icon: '☕', slot: 'hand', color: '#f8fafc', Model: CoffeeCup },
]

export const ACCESSORY_BY_ID = Object.fromEntries(ACCESSORIES.map((a) => [a.id, a]))

// Tạo một món đồ đang đeo (lưu trong hồ sơ)
export const newAccessory = (item) => ({ slot: item.slot, item: item.id, color: item.color, offset: [0, 0, 0], scale: 1, rotY: 0 })
