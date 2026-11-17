#!/usr/bin/env node
// HOOK CHO CLAUDE CODE (terminal hoặc VS Code): báo cho Văn phòng Agent biết Claude đang làm gì.
//
// Cách dùng (trong settings.json của Claude Code):
//   node "<đường dẫn>/claude-code-hook.js" <agentId>
// Không ghi agentId → dùng tên thư mục dự án mà Claude Code đang mở (ví dụ "my-shop").
//
// Claude Code gửi thông tin sự kiện qua stdin dạng JSON. Script đổi nó thành trạng thái
// của nhân vật rồi gửi tới http://localhost:5173/api/event.
// Script KHÔNG BAO GIỜ làm Claude Code chậm hay lỗi: văn phòng chưa chạy thì lặng lẽ bỏ qua.

const URL_EVENT = process.env.OFFICE_URL || 'http://localhost:5173/api/event'

const SEARCH_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS', 'WebSearch', 'WebFetch', 'NotebookRead'])
const WRITE_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])

const base = (p) => String(p || '').split(/[\\/]/).filter(Boolean).pop() || ''
const short = (s, n = 60) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

// Thông tin ngắn gọn về tool đang dùng
function toolDetail(name, input = {}) {
  switch (name) {
    case 'Read': case 'Edit': case 'MultiEdit': case 'Write': case 'NotebookEdit': case 'NotebookRead':
      return `${name}: ${base(input.file_path || input.notebook_path)}`
    case 'Grep': return `Grep: ${short(input.pattern, 40)}`
    case 'Glob': return `Glob: ${short(input.pattern, 40)}`
    case 'WebSearch': return `Tìm web: ${short(input.query, 45)}`
    case 'WebFetch': return `Đọc web: ${short(input.url, 45)}`
    case 'Bash': return `Lệnh: ${short(input.command, 50)}`
    default: return name
  }
}

// Sự kiện Claude Code → { status, detail }. Trả về null nếu không cần báo.
function mapEvent(e) {
  const tool = e.tool_name || ''
  switch (e.hook_event_name) {
    case 'SessionStart':
      return { status: 'idle', detail: 'Mở phiên làm việc' }
    case 'UserPromptSubmit':
      return { status: 'thinking', detail: 'Nhận việc: ' + short(e.prompt, 50) }
    case 'PreToolUse':
      if (SEARCH_TOOLS.has(tool)) return { status: 'searching', detail: toolDetail(tool, e.tool_input) }
      if (WRITE_TOOLS.has(tool) || tool === 'Bash') return { status: 'typing', detail: toolDetail(tool, e.tool_input) }
      if (tool === 'Task' || tool === 'Agent') return { status: 'thinking', detail: 'Giao việc cho agent con' }
      if (tool === 'TodoWrite') return { status: 'thinking', detail: 'Lập kế hoạch' }
      if (tool.startsWith('mcp__')) return { status: 'searching', detail: 'Công cụ: ' + tool.split('__').slice(1).join(' ') }
      return { status: 'thinking', detail: tool }
    case 'PostToolUse': {
      const r = e.tool_response
      const failed = r && typeof r === 'object' && (r.is_error === true || r.success === false || typeof r.error === 'string')
      return failed ? { status: 'error', detail: `${tool} bị lỗi` } : null // thành công thì chờ bước tiếp theo
    }
    case 'Notification':
      return { status: 'waiting', detail: short(e.message || 'Cần bạn xác nhận', 60) }
    case 'Stop':
      return { status: 'idle', detail: 'Xong việc ✅' }
    case 'SessionEnd':
      return { status: 'idle', detail: 'Đóng phiên' }
    default:
      return null
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (data += c))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
    setTimeout(() => resolve(data), 1500) // không bao giờ chờ quá lâu
  })
}

async function main() {
  let input = {}
  try {
    input = JSON.parse((await readStdin()) || '{}')
  } catch {
    return
  }
  const mapped = mapEvent(input)
  if (!mapped) return

  // ID: tham số dòng lệnh → biến môi trường → tên thư mục dự án
  const raw = process.argv[2] || process.env.OFFICE_AGENT_ID || base(input.cwd || process.cwd()) || 'claude-code'
  const agentId = raw.replace(/[^\w.\-]/g, '-').slice(0, 64)

  try {
    await fetch(URL_EVENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, ...mapped }),
      signal: AbortSignal.timeout(800),
    })
  } catch {
    // văn phòng chưa chạy → bỏ qua
  }
}

// Luôn thoát với mã 0 và không in gì ra, để không ảnh hưởng tới Claude Code
main().finally(() => process.exit(0))
