// CẤU HÌNH BAN ĐẦU — chỉ dùng ở lần chạy đầu tiên.
// Sau đó mọi chỉnh sửa làm trong "Phòng thay đồ" và được lưu trong trình duyệt.

// 8 chỗ ngồi [x, z]. Hồ sơ nhân viên lưu số thứ tự bàn (0–7).
export const DESK_SLOTS = [
  [-4.5, -3], [-1.5, -3], [1.5, -3], [4.5, -3],
  [-4.5, 0.3], [-1.5, 0.3], [1.5, 0.3], [4.5, 0.3],
]

// Bảng màu chọn nhanh
export const PALETTE = ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#f8fafc', '#334155']

// Hồ sơ: character = null nghĩa là dùng robot mặc định.
export const DEFAULT_PROFILES = [
  { id: 'researcher', name: 'Minh', role: 'Nghiên cứu',    shirt: '#3b82f6', desk: 0, character: null },
  { id: 'writer',     name: 'Lan',  role: 'Viết nội dung', shirt: '#ec4899', desk: 1, character: null },
  { id: 'coder',      name: 'Tuấn', role: 'Lập trình',     shirt: '#22c55e', desk: 2, character: null },
  { id: 'reviewer',   name: 'Hà',   role: 'Kiểm duyệt',    shirt: '#f59e0b', desk: 3, character: null },
]

// Các điểm chung trong văn phòng.
// pos: điểm giữa [x, z]. Agent xếp hàng dọc theo trục z, 4 người một hàng.
// face: hướng quay mặt khi đứng tại đó (radian).
export const PLACES = {
  coffee:    { pos: [-6, 2.5],  face: -Math.PI / 2 }, // quầy cà phê sát tường trái
  bookshelf: { pos: [6.2, 0.4], face: Math.PI / 2 },  // giá sách bên phải
}

// ---------- CÁ TÍNH KHI RẢNH ----------
// Mỗi hồ sơ có trường `idle` là một trong các kiểu dưới đây (mặc định 'coffee').
export const IDLE_MODES = {
  coffee: { label: 'Uống cà phê ☕', short: 'Rảnh rỗi ☕' },
  sofa:   { label: 'Ngồi sofa 🛋', short: 'Nghỉ ngơi 🛋' },
  dance:  { label: 'Nhảy 💃',       short: 'Quẩy 💃' },
  wander: { label: 'Đi dạo 🚶',     short: 'Đi dạo 🚶' },
  desk:   { label: 'Ở lại bàn 🪑',  short: 'Ngồi chơi 🪑' },
  random: { label: 'Ngẫu nhiên 🎲', short: 'Rảnh rỗi 🎲' },
}
const RANDOM_POOL = ['coffee', 'sofa', 'dance', 'wander', 'desk']

// Kiểu đang dùng lúc này. 'random' đổi kiểu mỗi 20 giây, mỗi agent lệch nhau.
export function resolveIdleMode(profile, now) {
  const mode = profile.idle || 'coffee'
  if (mode !== 'random') return mode
  let hash = 0
  for (const ch of profile.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return RANDOM_POOL[(Math.floor(now / 20000) + hash) % RANDOM_POOL.length]
}

// Chỗ ngồi ở phòng chờ: [x, z, hướng mặt]
export const LOUNGE_SEATS = [
  [-3.45, 5.15, Math.PI], [-2.55, 5.15, Math.PI], // sofa
  [-1.15, 4.3, -Math.PI / 2],                     // ghế bành
]
// Chỗ đứng khi hết ghế / khi nhảy: [x, z]
export const LOUNGE_SPOTS = [[-3.9, 3.2], [-2.1, 3.2], [-3, 2.7], [-4.6, 4.2], [-1.4, 2.8], [-4.3, 2.6], [-2.5, 2.4], [-3.6, 2.2]]
// Các điểm đi dạo (chỗ trống trên sàn)
export const WANDER_POINTS = [[0, 2.2], [2.5, 2.8], [-1.5, 2.2], [1, 4.8], [3.5, 4.8], [5.4, 3.2], [-6, 0.8], [6.2, -1.8], [0, -1.4], [3, -1.4]]

// TRẠNG THÁI → nơi đến, màu, chữ hiển thị, động tác.
// anim là tên động tác chung (walk idle sit wave yes no — xem src/characters.js),
// mỗi model tự ánh xạ sang tên clip thật của nó.
export const STATUS = {
  idle:      { place: 'coffee',    color: '#94a3b8', label: 'Rảnh rỗi ☕',      anim: 'idle' },
  thinking:  { place: 'desk',      color: '#a78bfa', label: 'Đang suy nghĩ…',   anim: 'idle' },
  typing:    { place: 'desk',      color: '#22c55e', label: 'Đang viết ⌨️',      anim: 'sit' },
  searching: { place: 'bookshelf', color: '#38bdf8', label: 'Đang tìm kiếm 🔍', anim: 'yes' },
  waiting:   { place: 'desk',      color: '#facc15', label: 'Chờ bạn duyệt ✋',  anim: 'wave' },
  error:     { place: 'desk',      color: '#ef4444', label: 'Gặp lỗi ⚠️',        anim: 'no' },
}
