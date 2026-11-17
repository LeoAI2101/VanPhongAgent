// LƯU DỮ LIỆU TRONG TRÌNH DUYỆT
// - Hồ sơ nhân viên + mẫu: localStorage (nhỏ, dạng chữ)
// - File model/animation bạn tải lên: IndexedDB (kho chứa file lớn của trình duyệt)
// File đã lưu được gọi bằng mã dạng "idb:<id>.<đuôi>", ví dụ "idb:3f2a….glb".

const KEY = 'agent-office:v1'

export function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(KEY, JSON.stringify(config))
  } catch (e) {
    console.warn('Không lưu được cấu hình', e)
  }
}

// ---------- IndexedDB ----------
let dbPromise
function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('agent-office', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('files')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function withStore(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction('files', mode)
    const req = fn(t.objectStore('files'))
    t.oncomplete = () => resolve(req?.result)
    t.onerror = () => reject(t.error)
  })
}

export const isStored = (ref) => typeof ref === 'string' && ref.startsWith('idb:')

// Lưu một File, trả về mã "idb:…"
export async function saveFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const id = `${crypto.randomUUID()}.${ext}`
  await withStore('readwrite', (s) => s.put(file, id))
  return `idb:${id}`
}

// Đổi mã "idb:…" thành địa chỉ trình duyệt đọc được. Đường dẫn thường thì giữ nguyên.
const urlCache = new Map()
export async function resolveUrl(ref) {
  if (!isStored(ref)) return ref
  if (urlCache.has(ref)) return urlCache.get(ref)
  const blob = await withStore('readonly', (s) => s.get(ref.slice(4)))
  if (!blob) throw new Error('Không tìm thấy file đã lưu (có thể đã bị xóa khỏi trình duyệt)')
  const url = URL.createObjectURL(blob)
  urlCache.set(ref, url)
  return url
}

// ---------- Xuất / nhập (để sao lưu hoặc chuyển máy) ----------
const toDataUrl = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.readAsDataURL(blob)
  })

// Tìm mọi mã "idb:…" trong cấu hình
export function collectRefs(obj, out = new Set()) {
  if (isStored(obj)) out.add(obj)
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((v) => collectRefs(v, out))
  return out
}

// File đã lưu không bao giờ thay đổi nội dung → nhớ sẵn bản chuyển đổi cho lần sau
const dataUrlCache = new Map()

export async function exportFiles(refs) {
  const files = {}
  for (const ref of refs) {
    if (!dataUrlCache.has(ref)) {
      const blob = await withStore('readonly', (s) => s.get(ref.slice(4)))
      if (!blob) continue
      dataUrlCache.set(ref, await toDataUrl(blob))
    }
    files[ref] = dataUrlCache.get(ref)
  }
  return files
}

export async function importFiles(files) {
  for (const [ref, dataUrl] of Object.entries(files || {})) {
    if (!isStored(ref)) continue
    const blob = await fetch(dataUrl).then((r) => r.blob())
    await withStore('readwrite', (s) => s.put(blob, ref.slice(4)))
    urlCache.delete(ref)
  }
}
