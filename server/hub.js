// SERVER NHỎ: nhận sự kiện từ agent và đẩy xuống văn phòng 3D.
// Chạy chung với `npm run dev` (xem vite.config.js), chỉ nhận kết nối từ chính máy này.
//
//   POST /api/event   { agentId, status, detail }  ← agent gửi vào đây
//   GET  /api/agents  trạng thái gần nhất của mọi agent
//   GET  /api/info    thông tin cho mục "Nối agent" (đường dẫn file hook…)
//   WS   /api/ws      văn phòng nghe sự kiện theo thời gian thực
//   GET/POST /api/backup  bản sao lưu dữ liệu trong thư mục du-lieu/ (để mang sang máy khác)
import fs from 'node:fs/promises'
import path from 'node:path'
import { WebSocketServer } from 'ws'

const STATUSES = new Set(['idle', 'thinking', 'typing', 'searching', 'waiting', 'error'])
const ID_PATTERN = /^[\w.\-]{1,64}$/
const SILENT_LIMIT = 5 * 60 * 1000 // im lặng 5 phút → tự về "rảnh"
const LOCAL = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

const isLocal = (req) => LOCAL.has(req.socket.remoteAddress)

function readBody(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > limit) reject(new Error('Nội dung quá dài'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function sendJson(res, code, obj) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(obj))
}

// Kiểm tra và làm sạch sự kiện. Trả về { event } hoặc { error }.
export function cleanEvent(body) {
  if (!body || typeof body !== 'object') return { error: 'Cần gửi JSON dạng { agentId, status, detail }' }
  const agentId = String(body.agentId ?? '').trim()
  const status = String(body.status ?? '').trim()
  if (!ID_PATTERN.test(agentId)) return { error: 'agentId chỉ gồm chữ, số, dấu - _ . (tối đa 64 ký tự)' }
  if (!STATUSES.has(status)) return { error: `status phải là một trong: ${[...STATUSES].join(', ')}` }
  const detail = String(body.detail ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
  return { event: { agentId, status, detail, at: Date.now() } }
}

export function createHub({ root = process.cwd() } = {}) {
  const agents = new Map() // agentId → sự kiện gần nhất
  const dataDir = path.resolve(root, 'du-lieu')
  const backupFile = path.join(dataDir, 'sao-luu.json')
  const wss = new WebSocketServer({ noServer: true })

  const broadcast = (msg) => {
    const data = JSON.stringify(msg)
    for (const client of wss.clients) if (client.readyState === 1) client.send(data)
  }

  const publish = (event) => {
    agents.set(event.agentId, event)
    broadcast({ type: 'event', event })
  }

  // Văn phòng mới mở → gửi ngay trạng thái hiện tại
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'snapshot', agents: Object.fromEntries(agents) }))
  })

  // Agent im lặng quá lâu (bị tắt đột ngột) → tự về rảnh
  const timer = setInterval(() => {
    const now = Date.now()
    for (const ev of agents.values()) {
      if (ev.status !== 'idle' && now - ev.at > SILENT_LIMIT) {
        publish({ agentId: ev.agentId, status: 'idle', detail: 'Không có tín hiệu 5 phút', at: now, auto: true })
      }
    }
  }, 30_000)
  timer.unref?.()

  // Xử lý các đường dẫn /api/...
  async function middleware(req, res, next) {
    const url = new URL(req.url, 'http://localhost')
    if (!url.pathname.startsWith('/api/')) return next()
    if (!isLocal(req)) return sendJson(res, 403, { error: 'Chỉ nhận kết nối từ máy này' })

    try {
      if (url.pathname === '/api/event' && req.method === 'POST') {
        let body
        try {
          body = JSON.parse(await readBody(req))
        } catch {
          return sendJson(res, 400, { error: 'JSON không hợp lệ' })
        }
        const { event, error } = cleanEvent(body)
        if (error) return sendJson(res, 400, { error })
        publish(event)
        return sendJson(res, 200, { ok: true, event })
      }
      if (url.pathname === '/api/agents' && req.method === 'GET') {
        return sendJson(res, 200, Object.fromEntries(agents))
      }
      if (url.pathname === '/api/backup' && (req.method === 'GET' || req.method === 'HEAD')) {
        try {
          if (req.method === 'HEAD') {
            await fs.access(backupFile)
            res.statusCode = 200
            return res.end()
          }
          const text = await fs.readFile(backupFile, 'utf8')
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          return res.end(text)
        } catch {
          return sendJson(res, 404, { error: 'Chưa có bản sao lưu' })
        }
      }
      if (url.pathname === '/api/backup' && req.method === 'POST') {
        const text = await readBody(req, 300 * 1024 * 1024) // tối đa 300MB (kèm file model)
        const data = JSON.parse(text)
        if (!Array.isArray(data.profiles)) return sendJson(res, 400, { error: 'Thiếu danh sách nhân viên' })
        await fs.mkdir(dataDir, { recursive: true })
        const tmp = backupFile + '.tmp'
        await fs.writeFile(tmp, text, 'utf8')
        await fs.rename(tmp, backupFile) // ghi xong mới thay file cũ → không bao giờ hỏng giữa chừng
        return sendJson(res, 200, { ok: true, bytes: text.length, file: backupFile })
      }
      if (url.pathname === '/api/info' && req.method === 'GET') {
        return sendJson(res, 200, { hookPath: path.resolve(root, 'hooks', 'claude-code-hook.js'), statuses: [...STATUSES] })
      }
      return sendJson(res, 404, { error: 'Không có đường dẫn này' })
    } catch (e) {
      return sendJson(res, 500, { error: String(e.message || e) })
    }
  }

  // Gắn WebSocket vào server http (dùng chung cổng với văn phòng)
  function attach(httpServer) {
    httpServer?.on('upgrade', (req, socket, head) => {
      if (new URL(req.url, 'http://localhost').pathname !== '/api/ws') return // để Vite tự lo kết nối của nó
      if (!isLocal(req)) return socket.destroy()
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
    })
  }

  return { middleware, attach, publish }
}
