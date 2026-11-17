// MỤC "NỐI AGENT" trong Phòng thay đồ: ID, đèn tín hiệu, gửi thử, đoạn code mẫu để chép.
import { useEffect, useState } from 'react'
import { useOffice } from './store'
import { sendEvent } from './connection'

const btn = { background: '#334155', color: 'white', border: 0, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }
const input = { background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: 6, padding: '5px 8px', fontSize: 13, flex: 1, minWidth: 0 }
const codeBox = { background: '#020617', color: '#e2e8f0', borderRadius: 6, padding: 8, fontSize: 11, lineHeight: 1.45, whiteSpace: 'pre', overflowX: 'auto', margin: 0, maxHeight: 260 }

const TEST_CYCLE = ['thinking', 'typing', 'searching', 'waiting', 'idle']
const EVENT_URL = `${location.origin}/api/event`

// Đoạn cấu hình hook cho Claude Code (id = null → tự lấy tên thư mục dự án)
function claudeSettings(hookPath, id) {
  const command = `node "${hookPath}"${id ? ' ' + id : ''}`
  const entry = (matcher) => [{ ...(matcher ? { matcher } : {}), hooks: [{ type: 'command', command }] }]
  return JSON.stringify({
    hooks: {
      SessionStart: entry(), UserPromptSubmit: entry(), PreToolUse: entry('*'), PostToolUse: entry('*'),
      Notification: entry(), Stop: entry(), SessionEnd: entry(),
    },
  }, null, 2)
}

function snippets(id, hookPath) {
  const hp = (hookPath || '<đường-dẫn-tới>/agent-office/hooks/claude-code-hook.js').replace(/\\/g, '/')
  const body = `{"agentId":"${id}","status":"typing","detail":"Thử từ máy"}`
  return {
    claude: {
      label: 'Claude Code',
      note: 'Dán vào file .claude/settings.json trong thư mục dự án mà bạn mở bằng VS Code. Nếu file đã có nội dung, chỉ thêm phần "hooks". Sau đó mở lại Claude Code (hoặc gõ /hooks để xem).',
      code: claudeSettings(hp, id),
    },
    claudeAuto: {
      label: 'Claude Code (mọi dự án)',
      note: 'Dán vào ~/.claude/settings.json (C:\\Users\\<tên>\\.claude\\settings.json) để mọi dự án đều báo về văn phòng. ID = tên thư mục dự án; ID lạ sẽ hiện ở mục "Tín hiệu chưa gán" để bạn gán cho nhân viên.',
      code: claudeSettings(hp, null),
    },
    python: {
      label: 'Python',
      note: 'Gọi office(...) ở mỗi bước của agent. Văn phòng chưa chạy thì lệnh tự bỏ qua.',
      code: `import requests

def office(status, detail=""):
    # status: idle | thinking | typing | searching | waiting | error
    try:
        requests.post("${EVENT_URL}",
                      json={"agentId": "${id}", "status": status, "detail": detail},
                      timeout=1)
    except Exception:
        pass

office("thinking", "Bắt đầu nhiệm vụ")
office("searching", "Tìm tài liệu")
office("typing", "Viết báo cáo")
office("idle", "Xong việc")`,
    },
    js: {
      label: 'JavaScript',
      note: 'Node.js 18+ hoặc trình duyệt. Gọi office(...) ở mỗi bước.',
      code: `async function office(status, detail = '') {
  // status: idle | thinking | typing | searching | waiting | error
  try {
    await fetch('${EVENT_URL}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: '${id}', status, detail }),
      signal: AbortSignal.timeout(1000),
    })
  } catch {}
}

await office('thinking', 'Bắt đầu nhiệm vụ')`,
    },
    n8n: {
      label: 'n8n / khác',
      note: 'Thêm node "HTTP Request" ở mỗi bước. n8n phải chạy trên cùng máy này.',
      code: `Method:  POST
URL:     ${EVENT_URL}
Body:    JSON
{
  "agentId": "${id}",
  "status": "searching",
  "detail": "Đang đọc email"
}`,
    },
    test: {
      label: 'Lệnh thử',
      note: 'Chạy trong PowerShell hoặc Terminal của VS Code khi văn phòng đang mở.',
      code: `# PowerShell (gửi đúng chữ có dấu)
$body = '${body}'
Invoke-RestMethod -Method Post -Uri ${EVENT_URL} -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))

# Git Bash / macOS / Linux (trên Windows nên viết không dấu)
curl -X POST ${EVENT_URL} -H "Content-Type: application/json" -d '{"agentId":"${id}","status":"typing","detail":"Thu tu may"}'`,
    },
  }
}

function ago(ms) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} giây trước`
  if (s < 3600) return `${Math.round(s / 60)} phút trước`
  return `${Math.round(s / 3600)} giờ trước`
}

export function ConnectPanel({ profile }) {
  const id = profile.id
  const lastSeen = useOffice((s) => s.lastSeen[id])
  const server = useOffice((s) => s.server)
  const unknown = useOffice((s) => s.unknown)
  const renameId = useOffice((s) => s.renameId)
  const [draft, setDraft] = useState(id)
  const [idError, setIdError] = useState('')
  const [tab, setTab] = useState('claude')
  const [hookPath, setHookPath] = useState('')
  const [copied, setCopied] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [step, setStep] = useState(0)
  const [, tick] = useState(0)

  useEffect(() => { setDraft(id); setIdError('') }, [id])
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    fetch('/api/info').then((r) => r.json()).then((d) => setHookPath(d.hookPath)).catch(() => {})
  }, [server])

  const saveId = () => setIdError(renameId(id, draft) || '')

  const sendTest = async () => {
    const status = TEST_CYCLE[step % TEST_CYCLE.length]
    setStep((n) => n + 1)
    try {
      await sendEvent({ agentId: id, status, detail: 'Gửi thử từ Phòng thay đồ' })
      setTestMsg(`✅ Đã gửi "${status}"`)
    } catch (e) {
      setTestMsg('⚠️ ' + e.message)
    }
  }

  const sn = snippets(id, hookPath)[tab]
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sn.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      alert('Không chép được, hãy bôi đen rồi Ctrl+C')
    }
  }

  const age = lastSeen ? Date.now() - lastSeen : null
  const light = age === null ? ['⚪', 'Chưa kết nối'] : age < 60_000 ? ['🟢', `Đang hoạt động (${ago(age)})`] : ['🟡', `Tín hiệu cuối: ${ago(age)}`]
  const unknownIds = Object.entries(unknown).sort((a, b) => b[1].at - a[1].at)

  return (
    <div>
      {server !== 'online' && (
        <div style={{ background: '#7f1d1d', borderRadius: 6, padding: 6, marginBottom: 8, fontSize: 12 }}>
          ⚠️ Chưa kết nối được server. Hãy chạy <code>npm run dev</code> trong thư mục agent-office.
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
        <span style={{ width: 62, opacity: 0.8 }}>ID</span>
        <input style={input} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveId()} />
        {draft !== id && <button style={{ ...btn, background: '#2563eb' }} onClick={saveId}>Lưu ID</button>}
      </div>
      {idError && <div style={{ color: '#fca5a5', fontSize: 12, marginBottom: 4 }}>{idError}</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0 8px' }}>
        <span>{light[0]} {light[1]}</span>
        <button style={btn} onClick={sendTest} disabled={server !== 'online'}>Gửi thử</button>
      </div>
      {testMsg && <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6 }}>{testMsg}</div>}

      {unknownIds.length > 0 && (
        <div style={{ background: '#0f172a', borderRadius: 6, padding: 8, marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>📡 Tín hiệu chưa gán</div>
          {unknownIds.map(([uid, info]) => (
            <div key={uid} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, fontSize: 12 }}>
              <code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{uid}</code>
              <span style={{ opacity: 0.6 }}>{ago(Date.now() - info.at)}</span>
              <button style={btn} onClick={() => { const err = renameId(id, uid); if (err) setIdError(err) }}>Gán cho {profile.name}</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {Object.entries(snippets(id, hookPath)).map(([k, s]) => (
          <button key={k} style={{ ...btn, background: tab === k ? '#2563eb' : '#334155' }} onClick={() => setTab(k)}>{s.label}</button>
        ))}
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{sn.note}</div>
      <div style={{ position: 'relative' }}>
        <pre style={codeBox}>{sn.code}</pre>
        <button style={{ ...btn, position: 'absolute', top: 4, right: 4 }} onClick={copy}>{copied ? '✅ Đã chép' : '📋 Chép'}</button>
      </div>
    </div>
  )
}
