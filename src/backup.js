// SAO LƯU VÀO THƯ MỤC DỰ ÁN (du-lieu/sao-luu.json)
// - Mỗi khi bạn chỉnh nhân viên/mẫu → tự lưu (sau 3 giây) kèm cả file model, phụ kiện.
// - Mở văn phòng ở trình duyệt/máy mới (chưa có dữ liệu) → tự nạp lại từ thư mục.
// Nhờ vậy chỉ cần chép cả thư mục VanPhongAgent sang máy khác là mang theo được hết.
import { hadSavedConfig, useOffice } from './store'
import { collectRefs, exportFiles, importFiles } from './storage'

const setBackup = (changes) => useOffice.setState((s) => ({ backup: { ...s.backup, ...changes } }))

export async function saveToFolder() {
  const { profiles, presets, simulatorOn } = useOffice.getState()
  const files = await exportFiles(collectRefs({ profiles, presets }))
  const body = JSON.stringify({ version: 1, savedAt: new Date().toISOString(), profiles, presets, simulatorOn, files })
  try {
    const res = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Lỗi ${res.status}`)
    setBackup({ at: Date.now(), error: null })
  } catch (e) {
    setBackup({ error: e.message })
    throw e
  }
}

// Trả về true nếu đã nạp, false nếu thư mục chưa có bản sao lưu
export async function loadFromFolder() {
  const res = await fetch('/api/backup')
  if (res.status === 404) return false
  if (!res.ok) throw new Error(`Lỗi ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data.profiles)) throw new Error('Bản sao lưu không hợp lệ')
  await importFiles(data.files)
  useOffice.getState().restore(data)
  setBackup({ restoredAt: Date.now() })
  return true
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export function startBackup() {
  let stopped = false
  let timer
  let unsubscribe = () => {}

  const run = async () => {
    // Trình duyệt mới → thử nạp từ thư mục (chờ server sẵn sàng, tối đa ~30 giây)
    if (!hadSavedConfig) {
      for (let i = 0; i < 15 && !stopped; i++) {
        try {
          await loadFromFolder()
          break
        } catch {
          await wait(2000) // server chưa sẵn sàng → thử lại
        }
      }
    }
    if (stopped) return

    // Từ giờ: có thay đổi → 3 giây sau lưu vào thư mục
    unsubscribe = useOffice.subscribe((s, prev) => {
      if (s.profiles === prev.profiles && s.presets === prev.presets && s.simulatorOn === prev.simulatorOn) return
      clearTimeout(timer)
      timer = setTimeout(() => saveToFolder().catch(() => {}), 3000)
    })
    // Thư mục chưa có bản sao lưu nào → tạo ngay. Nếu đã có thì KHÔNG ghi đè lúc mở
    // (có thể đó là dữ liệu mang từ máy khác sang — bấm "Nạp từ thư mục" để dùng nó).
    try {
      const res = await fetch('/api/backup', { method: 'HEAD' })
      if (res.status === 404) saveToFolder().catch(() => {})
    } catch {}
  }
  run()

  return () => {
    stopped = true
    clearTimeout(timer)
    unsubscribe()
  }
}
