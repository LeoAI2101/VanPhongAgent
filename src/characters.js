// NHÂN VẬT: khai báo model và cách tìm animation.
//
// Một "character" gồm:
//   model:        đường dẫn file .glb hoặc .fbx (đặt trong public/models/)
//   height:       chiều cao mong muốn (mét). Model sẽ tự co giãn theo. Mặc định 1.6
//   rotationY:    xoay thêm nếu model quay lưng lại (ví dụ Math.PI)
//   anims:        đổi tên: { walk: 'Tên clip đi bộ trong file', idle: '...', ... }
//   animFiles:    file animation riêng (ví dụ tải từ Mixamo): { walk: '/models/anim/walk.fbx' }
//   playOnce:     các động tác chỉ chạy 1 lần rồi giữ tư thế (ví dụ ['sit'])
//   tintMaterial: tên vật liệu sẽ được tô theo màu `shirt` của agent (không bắt buộc)

import { ACCESSORY_BY_ID, newAccessory } from './accessoryCatalog'

// Các động tác văn phòng cần. STATUS trong agents.js dùng các tên này.
export const ANIM_KEYS = ['walk', 'idle', 'sit', 'wave', 'yes', 'no', 'dance']

export const ANIM_LABELS = {
  walk: 'đi bộ', idle: 'đứng yên', sit: 'ngồi', wave: 'vẫy tay', yes: 'gật đầu', no: 'lắc đầu', dance: 'nhảy',
}

// Thiếu động tác nào thì dùng động tác nào thay
export const FALLBACK = { walk: null, idle: null, sit: 'idle', wave: 'idle', yes: 'idle', no: 'idle', dance: 'idle' }

// Robot mặc định (RobotExpressive, CC0, từ three.js)
export const ROBOT = {
  model: '/models/robot.glb',
  height: 1.4,
  tintMaterial: 'Main',
  anims: { walk: 'Walking', idle: 'Idle', sit: 'Sitting', wave: 'Wave', yes: 'Yes', no: 'No', dance: 'Dance' },
  playOnce: ['sit'],
}

// Nhân vật thực tế của một hồ sơ: model riêng (hoặc robot) + chiều cao/hướng chỉnh trong Phòng thay đồ
export function effectiveCharacter(profile) {
  const base = profile.character || ROBOT
  return { ...base, height: profile.height ?? base.height ?? 1.6, rotationY: profile.rotationY ?? 0 }
}

// Mẫu có sẵn (không xóa được). Mẫu bạn tự lưu nằm trong store.
export const BUILTIN_PRESETS = [
  { id: 'b-blue',  name: 'Robot xanh',     builtin: true, look: { character: null, shirt: '#3b82f6', height: 1.4 } },
  { id: 'b-pink',  name: 'Robot hồng',     builtin: true, look: { character: null, shirt: '#ec4899', height: 1.4 } },
  { id: 'b-black', name: 'Robot đen ngầu', builtin: true, look: { character: null, shirt: '#1e293b', height: 1.5 } },
  { id: 'b-giant', name: 'Khổng lồ',       builtin: true, look: { character: null, shirt: '#ef4444', height: 2.2 } },
  { id: 'b-tiny',  name: 'Tí hon',         builtin: true, look: { character: null, shirt: '#14b8a6', height: 0.9 } },
  // mẫu có phụ kiện
  { id: 'b-boss',  name: 'Sếp 🎩',         builtin: true, look: { character: null, shirt: '#334155', height: 1.5, accessories: [wear('tophat'), wear('tie', '#dc2626'), wear('sunglasses')] } },
  { id: 'b-dev',   name: 'Lập trình viên 🎧', builtin: true, look: { character: null, shirt: '#22c55e', height: 1.4, accessories: [wear('headphones', '#111827'), wear('coffee'), wear('glasses')] } },
  { id: 'b-queen', name: 'Nữ hoàng 👑',    builtin: true, look: { character: null, shirt: '#ec4899', height: 1.4, accessories: [wear('crown'), wear('bow', '#a855f7')] } },
  { id: 'b-trip',  name: 'Đi phượt 🎒',    builtin: true, look: { character: null, shirt: '#f59e0b', height: 1.4, accessories: [wear('cap', '#2563eb'), wear('backpack')] } },
]

// Món đồ cho mẫu có sẵn
function wear(id, color) {
  const item = ACCESSORY_BY_ID[id]
  return { ...newAccessory(item), color: color || item.color }
}

// Khi không khai báo `anims`, đoán theo tên clip (ví dụ "Walking", "Sitting Idle"…)
const GUESS = {
  walk: /walk/i,
  idle: /idle|breath|stand/i,
  sit: /sit|typing/i,
  wave: /wav/i,
  yes: /yes|nod|agree/i,
  no: /^no$|shak|disagree/i,
  dance: /danc|samba|hip.?hop|salsa/i,
}

// Tìm tên clip cho một động tác. Trả về null nếu không thấy.
export function matchClipName(names, key, anims) {
  if (names.includes(key)) return key // clip từ file animation riêng (animFiles) được ưu tiên nhất
  const wanted = anims?.[key]
  if (wanted && names.includes(wanted)) return wanted
  const guessed = names.find((n) => GUESS[key].test(n))
  if (guessed) return guessed
  if (key === 'idle' && names.length === 1) return names[0] // chỉ có 1 clip → coi là đứng yên
  return null
}
