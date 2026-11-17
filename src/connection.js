// KẾT NỐI TỚI SERVER (server/hub.js) qua WebSocket để nhận sự kiện từ agent thật.
// Mất kết nối thì tự thử lại mỗi 2 giây.
import { useOffice } from './store'

export const API_EVENT = '/api/event'

export function startConnection() {
  let ws
  let retry
  let stopped = false

  const connect = () => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    ws = new WebSocket(`${protocol}://${location.host}/api/ws`)

    ws.onopen = () => useOffice.setState({ server: 'online' })

    ws.onmessage = (e) => {
      let msg
      try { msg = JSON.parse(e.data) } catch { return }
      const { applyEvent } = useOffice.getState()
      if (msg.type === 'snapshot') {
        // trạng thái gần nhất của các agent (khi vừa mở trang)
        Object.values(msg.agents || {}).forEach((ev) => applyEvent(ev, { real: true, silent: true }))
      } else if (msg.type === 'event') {
        applyEvent(msg.event, { real: true })
      }
    }

    ws.onclose = () => {
      useOffice.setState({ server: 'offline' })
      if (!stopped) retry = setTimeout(connect, 2000)
    }
  }

  connect()
  return () => {
    stopped = true
    clearTimeout(retry)
    ws?.close()
  }
}

// Gửi một sự kiện lên server (dùng cho nút "Gửi thử")
export async function sendEvent(event) {
  const res = await fetch(API_EVENT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`)
  return data
}
