// CĂN PHÒNG: tường, bàn làm việc, góc cà phê, phòng chờ, giá sách — dựng từ model Kenney.
import { Furniture as F } from './Furniture'
import { DESK_SLOTS } from './agents'

const PI = Math.PI
const DESK_TOP = 0.76 // chiều cao mặt bàn sau khi phóng to

function Workstation({ x, z }) {
  return (
    <group>
      <F name="desk" position={[x, 0, z - 0.85]} />
      <F name="computerScreen" position={[x, DESK_TOP, z - 1.05]} />
      <F name="computerKeyboard" position={[x, DESK_TOP, z - 0.7]} />
      <F name="computerMouse" position={[x + 0.4, DESK_TOP, z - 0.7]} />
      <F name="plantSmall1" position={[x - 0.55, DESK_TOP, z - 1.0]} />
      <F name="chairDesk" position={[x, 0, z + 0.05]} rotation={PI} />
    </group>
  )
}

export function Office() {
  return (
    <group>
      {/* sàn gỗ */}
      <mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#c8a27c" roughness={0.8} />
      </mesh>

      {/* tường sau (xen kẽ cửa sổ) và tường trái */}
      {Array.from({ length: 8 }, (_, i) => (
        <F key={'b' + i} name={i % 2 ? 'wallWindow' : 'wall'} position={[-7 + 2 * i, 0, -6]} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <F key={'l' + i} name="wall" position={[-8, 0, -5 + 2 * i]} rotation={PI / 2} />
      ))}

      {/* 8 bàn làm việc */}
      {DESK_SLOTS.map(([x, z], i) => (
        <Workstation key={i} x={x} z={z} />
      ))}

      {/* góc cà phê sát tường trái */}
      <F name="kitchenBar" position={[-7.45, 0, 1.9]} rotation={PI / 2} />
      <F name="kitchenBar" position={[-7.45, 0, 2.8]} rotation={PI / 2} />
      <F name="kitchenCoffeeMachine" position={[-7.45, 0.84, 2.35]} rotation={PI / 2} />
      <F name="kitchenFridgeSmall" position={[-7.45, 0, 3.9]} rotation={PI / 2} />

      {/* phòng chờ */}
      <F name="rugRound" position={[-3, 0, 4.4]} scale={3.6} />
      <F name="loungeSofa" position={[-3, 0, 5.3]} rotation={PI} />
      <F name="tableCoffee" position={[-3, 0, 4.2]} />
      <F name="loungeChair" position={[-1.2, 0, 4.3]} rotation={-PI / 2} />

      {/* giá sách bên phải */}
      {[-0.8, 0, 0.8, 1.6].map((z) => (
        <F key={z} name="bookcaseOpen" position={[7.5, 0, z]} rotation={-PI / 2} />
      ))}

      {/* đồ trang trí */}
      <F name="pottedPlant" position={[-7.4, 0, -5.4]} />
      <F name="pottedPlant" position={[7.4, 0, -5.4]} />
      <F name="pottedPlant" position={[7.4, 0, 3]} />
      <F name="lampSquareFloor" position={[-7.4, 0, -1]} />
      <F name="speaker" position={[-7.4, 0, -2.2]} rotation={PI / 2} />
      <F name="trashcan" position={[6.3, 0, -3.3]} />
    </group>
  )
}
