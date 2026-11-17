// Tiện ích nạp file dùng chung cho nhân vật và phụ kiện.
import { Component, useEffect, useState } from 'react'
import { resolveUrl } from './storage'

// Lấy đuôi file từ đường dẫn hoặc mã "idb:….glb"
export const extOf = (ref) => ref.split('?')[0].split('.').pop().toLowerCase()

// Đổi mã file đã lưu ("idb:…") thành địa chỉ nạp được. Trả về null khi đang tìm.
export function useResolvedUrl(ref) {
  const [state, setState] = useState({ ref: null })
  useEffect(() => {
    let alive = true
    resolveUrl(ref)
      .then((url) => alive && setState({ ref, url }))
      .catch((error) => alive && setState({ ref, error }))
    return () => { alive = false }
  }, [ref])
  if (state.ref !== ref) return null
  if (state.error) throw state.error // LoadBoundary sẽ bắt lỗi này
  return state.url
}

// Nếu file lỗi (hỏng, sai định dạng…) thì hiện phương án dự phòng thay vì làm sập cả văn phòng
export class LoadBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    this.props.onError?.(String(error?.message || error))
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
