// GIẢ LẬP: tạo sự kiện ngẫu nhiên cho các nhân viên CHƯA nối agent thật,
// để văn phòng không bị trống. Bật/tắt bằng công tắc ở góc màn hình.
import { useOffice } from './store'
import { STATUS } from './agents'

const DETAILS = {
  thinking: ['Lập kế hoạch', 'Phân tích yêu cầu'],
  typing: ['Viết báo cáo.md', 'Sửa App.jsx', 'Soạn email'],
  searching: ['web_search: "giá vàng"', 'Đọc tài liệu API'],
  waiting: ['Cần bạn duyệt bản nháp'],
  error: ['Hết thời gian chờ API'],
  idle: [''],
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const REAL_RECENT = 10 * 60 * 1000 // có tín hiệu thật trong 10 phút qua → coi là đã nối

export function startSimulator() {
  const statuses = Object.keys(STATUS)
  const timer = setInterval(() => {
    const { paused, simulatorOn, profiles, lastSeen, applyEvent } = useOffice.getState()
    if (paused || !simulatorOn) return
    const now = Date.now()
    const fake = profiles.filter((p) => !(now - (lastSeen[p.id] || 0) < REAL_RECENT))
    if (!fake.length) return
    const status = pick(statuses)
    applyEvent({ agentId: pick(fake).id, status, detail: pick(DETAILS[status]) })
  }, 1800)
  return () => clearInterval(timer)
}
