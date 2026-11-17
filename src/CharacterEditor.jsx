// PHÒNG THAY ĐỒ: chỉnh mọi thứ về nhân viên ngay trên giao diện, tự động lưu.
import { useEffect, useState } from 'react'
import { DESK_SLOTS, IDLE_MODES, PALETTE } from './agents'
import { ACCESSORIES, ACCESSORY_BY_ID, SLOTS, newAccessory } from './accessoryCatalog'
import { ANIM_KEYS, ANIM_LABELS, BUILTIN_PRESETS, FALLBACK, effectiveCharacter, matchClipName } from './characters'
import { collectRefs, exportFiles, importFiles, saveFile } from './storage'
import { useOffice } from './store'
import { PreviewCanvas } from './PreviewCanvas'
import { ConnectPanel } from './ConnectPanel'
import { loadFromFolder, saveToFolder } from './backup'

// ---------- Kiểu dáng dùng chung ----------
const panel = { position: 'absolute', zIndex: 20, left: 12, top: 12, bottom: 12, width: 360, overflowY: 'auto', background: 'rgba(15,23,42,.95)', color: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 13, fontFamily: 'system-ui, sans-serif', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }
const btn = { background: '#334155', color: 'white', border: 0, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }
const primaryBtn = { ...btn, background: '#2563eb' }
const input = { background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: 6, padding: '5px 8px', fontSize: 13, width: '100%', boxSizing: 'border-box' }
const row = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }
const label = { width: 62, flexShrink: 0, opacity: 0.8 }

function Section({ title, children }) {
  return (
    <div style={{ borderTop: '1px solid #334155', paddingTop: 10, marginTop: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

// Nút chọn file ẩn ô input xấu xí đi
function FileButton({ accept, onFile, children, style }) {
  return (
    <label style={{ ...btn, display: 'inline-block', ...style }}>
      {children}
      <input type="file" accept={accept} style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onFile(f) }} />
    </label>
  )
}

// Thanh trượt nhỏ có nhãn
function Slider({ name, min, max, step, value, onChange, format = (v) => v.toFixed(2) }) {
  return (
    <div style={{ ...row, marginBottom: 4 }}>
      <span style={{ ...label, fontSize: 11 }}>{name}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span style={{ width: 40, fontSize: 11, textAlign: 'right' }}>{format(value)}</span>
    </div>
  )
}

// Một món đang đeo: đổi màu, chỉnh vị trí/cỡ/góc, tháo
function WornRow({ id, acc, act }) {
  const item = ACCESSORY_BY_ID[acc.item]
  const key = (field) => `${id}:acc:${acc.slot}:${field}`
  const off = acc.offset || [0, 0, 0]
  const setOff = (i, v, field) => {
    const next = [...off]
    next[i] = v
    act.updateAccessory(id, acc.slot, { offset: next }, key(field))
  }
  return (
    <div style={{ background: '#0f172a', borderRadius: 8, padding: 8, marginBottom: 6 }}>
      <div style={{ ...row, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{item?.icon || '📦'}</span>
        <b style={{ flex: 1 }}>{item?.name || acc.fileName} <span style={{ opacity: 0.5, fontWeight: 400 }}>· {SLOTS[acc.slot].label}</span></b>
        {item && <input type="color" value={acc.color} onChange={(e) => act.updateAccessory(id, acc.slot, { color: e.target.value }, key('color'))} style={{ width: 26, height: 22, border: 0, background: 'none', cursor: 'pointer' }} title="Đổi màu" />}
        <button style={btn} title="Tháo ra" onClick={() => act.removeAccessory(id, acc.slot)}>✕</button>
      </div>
      <Slider name="Lên/xuống" min={-0.3} max={0.3} step={0.005} value={off[1]} onChange={(v) => setOff(1, v, 'y')} />
      <Slider name="Trước/sau" min={-0.3} max={0.3} step={0.005} value={off[2]} onChange={(v) => setOff(2, v, 'z')} />
      <Slider name="Trái/phải" min={-0.3} max={0.3} step={0.005} value={off[0]} onChange={(v) => setOff(0, v, 'x')} />
      <Slider name="Cỡ" min={0.3} max={3} step={0.05} value={acc.scale ?? 1} onChange={(v) => act.updateAccessory(id, acc.slot, { scale: v }, key('scale'))} format={(v) => `×${v.toFixed(2)}`} />
      <Slider name="Xoay" min={-Math.PI} max={Math.PI} step={0.05} value={acc.rotY || 0} onChange={(v) => act.updateAccessory(id, acc.slot, { rotY: v }, key('rot'))} format={(v) => `${Math.round((v * 180) / Math.PI)}°`} />
    </div>
  )
}

// KHO PHỤ KIỆN: bấm để đeo, bấm lần nữa để tháo. Mỗi vị trí 1 món.
function AccessoryShop({ profile, act, storeFile }) {
  const [customSlot, setCustomSlot] = useState('head')
  const id = profile.id
  const worn = profile.accessories || []

  const uploadCustom = (file) => {
    if (!file.name.toLowerCase().endsWith('.glb')) return alert('Phụ kiện chỉ nhận file .glb')
    storeFile(file, (ref) => act.wearAccessory(id, { slot: customSlot, item: null, model: ref, fileName: file.name, offset: [0, 0, 0], scale: 1, rotY: 0 }))
  }

  return (
    <Section title="🎒 Kho phụ kiện">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 8 }}>
        {ACCESSORIES.map((item) => {
          const on = worn.some((a) => a.item === item.id)
          return (
            <button key={item.id} title={`${item.name} — đeo ở ${SLOTS[item.slot].label}`}
              style={{ ...btn, whiteSpace: 'normal', background: on ? '#2563eb' : '#334155', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 2px' }}
              onClick={() => (on ? act.removeAccessory(id, item.slot) : act.wearAccessory(id, newAccessory(item)))}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, lineHeight: 1.1 }}>{item.name}</span>
            </button>
          )
        })}
      </div>
      <div style={row}>
        <FileButton accept=".glb" onFile={uploadCustom}>＋ Tải phụ kiện của tôi</FileButton>
        <span style={{ fontSize: 12, opacity: 0.7 }}>đeo ở</span>
        <select style={{ ...input, width: 80 }} value={customSlot} onChange={(e) => setCustomSlot(e.target.value)}>
          {Object.entries(SLOTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </div>
      {worn.length > 0 && <div style={{ fontWeight: 600, margin: '8px 0 6px' }}>Đang đeo</div>}
      {worn.map((acc) => <WornRow key={acc.slot} id={id} acc={acc} act={act} />)}
    </Section>
  )
}

export function CharacterEditor() {
  const editor = useOffice((s) => s.editor)
  const profiles = useOffice((s) => s.profiles)
  const presets = useOffice((s) => s.presets)
  const canUndo = useOffice((s) => s.history.length > 0)
  const clipNames = useOffice((s) => s.clipNames[editor.selectedId]) || []
  const materialNames = useOffice((s) => s.materialNames[editor.selectedId]) || []
  const error = useOffice((s) => s.errors[editor.selectedId])
  const backup = useOffice((s) => s.backup)
  const act = useOffice.getState() // các hàm hành động (không đổi theo thời gian)
  const [previewAnim, setPreviewAnim] = useState('idle')
  const [busy, setBusy] = useState('')

  // Ctrl+Z để hoàn tác (khi không đang gõ chữ)
  useEffect(() => {
    if (!editor.open) return
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        useOffice.getState().undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor.open])

  if (!editor.open) {
    return <button style={{ ...primaryBtn, position: 'absolute', left: 12, bottom: 12, padding: '8px 12px', fontSize: 14 }} onClick={() => act.openEditor()}>👤 Phòng thay đồ</button>
  }

  const profile = profiles.find((p) => p.id === editor.selectedId)
  const id = profile?.id
  const character = profile ? effectiveCharacter(profile) : null
  const update = (field, value) => act.updateProfile(id, { [field]: value }, `${id}:${field}`)

  // Lưu file vào trình duyệt rồi gọi tiếp
  const storeFile = async (file, then) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['glb', 'fbx'].includes(ext)) return alert('Chỉ nhận file .glb hoặc .fbx')
    setBusy('Đang lưu file…')
    try {
      then(await saveFile(file))
    } catch (e) {
      alert('Không lưu được file: ' + e.message)
    } finally {
      setBusy('')
    }
  }

  const exportConfig = async () => {
    setBusy('Đang xuất…')
    const { profiles, presets } = useOffice.getState()
    const files = await exportFiles(collectRefs({ profiles, presets }))
    const blob = new Blob([JSON.stringify({ version: 1, profiles, presets, files })], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'van-phong-agent.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    setBusy('')
  }

  const importConfig = async (file) => {
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data.profiles)) throw new Error('File không đúng định dạng')
      setBusy('Đang nhập…')
      await importFiles(data.files)
      act.replaceAll(data)
    } catch (e) {
      alert('Không nhập được: ' + e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div style={panel}>
      {/* ---------- Đầu: chọn nhân viên ---------- */}
      <div style={{ ...row, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 15 }}>👤 Phòng thay đồ</b>
        <span style={{ display: 'flex', gap: 6 }}>
          <button style={{ ...btn, opacity: canUndo ? 1 : 0.4 }} disabled={!canUndo} onClick={act.undo} title="Ctrl+Z">↶ Hoàn tác</button>
          <button style={btn} onClick={act.closeEditor}>✕</button>
        </span>
      </div>
      <div style={row}>
        <select style={input} value={id || ''} onChange={(e) => act.selectAgent(e.target.value)}>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}
        </select>
        <button style={{ ...btn, opacity: profiles.length >= DESK_SLOTS.length ? 0.4 : 1 }} disabled={profiles.length >= DESK_SLOTS.length}
          title={profiles.length >= DESK_SLOTS.length ? 'Đã đủ 8 bàn' : ''} onClick={act.addProfile}>＋ Thêm</button>
        {profile && <button style={{ ...btn, background: '#7f1d1d' }} onClick={() => confirm(`Xóa ${profile.name}? (Có thể hoàn tác)`) && act.removeProfile(id)}>Xóa</button>}
      </div>
      {busy && <div style={{ color: '#7dd3fc', marginBottom: 6 }}>⏳ {busy}</div>}

      {!profile ? (
        <div style={{ opacity: 0.7, padding: 20, textAlign: 'center' }}>Chưa có nhân viên. Bấm “＋ Thêm”.</div>
      ) : (
        <>
          {/* ---------- Xem trước ---------- */}
          <PreviewCanvas profile={profile} anim={previewAnim} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0' }}>
            {ANIM_KEYS.map((k) => (
              <button key={k} style={{ ...btn, background: previewAnim === k ? '#2563eb' : '#334155' }} onClick={() => setPreviewAnim(k)}>{ANIM_LABELS[k]}</button>
            ))}
          </div>

          {/* ---------- Thông tin ---------- */}
          <Section title="Thông tin">
            <div style={row}><span style={label}>Tên</span><input style={input} value={profile.name} onChange={(e) => update('name', e.target.value)} /></div>
            <div style={row}><span style={label}>Vai trò</span><input style={input} value={profile.role} onChange={(e) => update('role', e.target.value)} /></div>
            <div style={row}>
              <span style={label}>Bàn</span>
              <select style={input} value={profile.desk} onChange={(e) => act.updateProfile(id, { desk: Number(e.target.value) })}>
                {DESK_SLOTS.map((_, i) => {
                  const owner = profiles.find((p) => p.desk === i)
                  return <option key={i} value={i} disabled={owner && owner.id !== id}>Bàn {i + 1}{owner ? ` — ${owner.name}` : ' (trống)'}</option>
                })}
              </select>
            </div>
            <div style={row}>
              <span style={label}>Khi rảnh</span>
              <select style={input} value={profile.idle || 'coffee'} onChange={(e) => act.updateProfile(id, { idle: e.target.value })}>
                {Object.entries(IDLE_MODES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
            </div>
          </Section>

          {/* ---------- Nối agent ---------- */}
          <Section title="🔌 Nối agent">
            <ConnectPanel profile={profile} />
          </Section>

          {/* ---------- Ngoại hình ---------- */}
          <Section title="Ngoại hình">
            <div style={row}>
              <span style={label}>Màu</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                {PALETTE.map((c) => (
                  <span key={c} onClick={() => act.updateProfile(id, { shirt: c })}
                    style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', outline: profile.shirt === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
                ))}
                <input type="color" value={profile.shirt} onChange={(e) => update('shirt', e.target.value)} style={{ width: 28, height: 24, border: 0, background: 'none', cursor: 'pointer' }} title="Chọn màu bất kỳ" />
              </span>
            </div>
            <div style={row}>
              <span style={label}>Cao</span>
              <input type="range" min="0.6" max="2.6" step="0.05" value={character.height} onChange={(e) => update('height', Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ width: 42 }}>{character.height.toFixed(2)}m</span>
            </div>
            <div style={row}>
              <span style={label}>Hướng</span>
              <button style={btn} onClick={() => act.updateProfile(id, { rotationY: ((profile.rotationY || 0) + Math.PI) % (2 * Math.PI) })}>Xoay 180°</button>
              <span style={{ fontSize: 11, opacity: 0.6 }}>dùng khi nhân vật quay lưng</span>
            </div>
            <div style={row}>
              <span style={label}>Tô màu</span>
              <select style={input} value={character.tintMaterial || ''} onChange={(e) => act.updateCharacter(id, { tintMaterial: e.target.value || undefined })}>
                <option value="">(không tô — giữ màu gốc)</option>
                {materialNames.map((m) => <option key={m} value={m}>vật liệu “{m}”</option>)}
              </select>
            </div>
          </Section>

          {/* ---------- Phụ kiện ---------- */}
          <AccessoryShop profile={profile} act={act} storeFile={storeFile} />

          {/* ---------- Model ---------- */}
          <Section title="Model 3D">
            <div style={{ marginBottom: 8 }}>Đang dùng: <b>{profile.character?.fileName || (profile.character ? 'Robot (đã chỉnh)' : 'Robot mặc định')}</b></div>
            <div style={row}>
              <FileButton accept=".glb,.fbx" onFile={(f) => storeFile(f, (ref) => act.setModel(id, ref, f.name))} style={primaryBtn}>📂 Tải model của tôi</FileButton>
              {profile.character && <button style={btn} onClick={() => act.setRobot(id)}>🤖 Dùng robot</button>}
            </div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Nhận .glb hoặc .fbx (Meshy, Tripo, Mixamo…). Xem TAO-NHAN-VAT.md</div>
            {error && <div style={{ color: '#fca5a5', marginTop: 6 }}>⚠️ Không nạp được model, đang dùng robot thay thế: {error}</div>}
          </Section>

          {/* ---------- Animation ---------- */}
          <Section title="Động tác">
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>Chọn clip cho từng động tác, hoặc tải file animation riêng (Mixamo: FBX, Without Skin).</div>
            {ANIM_KEYS.map((key) => {
              const chosen = character.anims?.[key] || ''
              const fileRef = character.animFiles?.[key]
              const auto = matchClipName(clipNames, key, undefined)
              const fb = FALLBACK[key]
              const autoText = auto ? `Tự động (${auto})` : `Tự động (${fb ? `dùng “${ANIM_LABELS[fb]}”` : key === 'walk' ? 'nhún nhảy' : 'đứng im'})`
              return (
                <div key={key} style={row}>
                  <span style={label}>{ANIM_LABELS[key]}</span>
                  {fileRef ? (
                    <span style={{ flex: 1, color: '#86efac' }}>📄 file riêng</span>
                  ) : (
                    <select style={input} value={chosen} onChange={(e) => act.updateCharacter(id, { anims: { ...(character.anims || {}), [key]: e.target.value || undefined } })}>
                      <option value="">{autoText}</option>
                      {clipNames.filter((n) => !ANIM_KEYS.includes(n)).map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                  {fileRef ? (
                    <button style={btn} title="Bỏ file riêng" onClick={() => act.updateCharacter(id, { animFiles: { ...character.animFiles, [key]: undefined } })}>✕</button>
                  ) : (
                    <FileButton accept=".glb,.fbx" onFile={(f) => storeFile(f, (ref) => act.updateCharacter(id, { animFiles: { ...(character.animFiles || {}), [key]: ref } }))}>📂</FileButton>
                  )}
                </div>
              )
            })}
          </Section>

          {/* ---------- Mẫu ---------- */}
          <Section title="Mẫu trang phục">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {[...BUILTIN_PRESETS, ...presets].map((p) => (
                <span key={p.id} style={{ ...btn, display: 'inline-flex', gap: 6, alignItems: 'center', borderLeft: `4px solid ${p.look.shirt}` }}>
                  <span onClick={() => act.applyPreset(id, p)}>{p.name}</span>
                  {!p.builtin && <span title="Xóa mẫu" style={{ opacity: 0.6 }} onClick={() => confirm(`Xóa mẫu “${p.name}”?`) && act.deletePreset(p.id)}>✕</span>}
                </span>
              ))}
            </div>
            <button style={btn} onClick={() => { const name = prompt('Đặt tên cho mẫu:', profile.name); if (name) act.savePreset(id, name) }}>💾 Lưu ngoại hình này thành mẫu</button>
          </Section>
        </>
      )}

      {/* ---------- Sao lưu ---------- */}
      <Section title="Sao lưu">
        <div style={{ ...row, flexWrap: 'wrap' }}>
          <button style={primaryBtn} onClick={() => saveToFolder().then(() => setBusy(''), (e) => alert('Không lưu được: ' + e.message))}>💾 Lưu vào thư mục dự án</button>
          <button style={btn} onClick={async () => {
            if (!confirm('Nạp dữ liệu từ thư mục du-lieu/? Dữ liệu hiện tại sẽ được thay thế (có thể hoàn tác).')) return
            try { if (!(await loadFromFolder())) alert('Thư mục chưa có bản sao lưu') } catch (e) { alert('Không nạp được: ' + e.message) }
          }}>📂 Nạp từ thư mục</button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>
          {backup.error ? `⚠️ Chưa lưu được vào thư mục: ${backup.error}`
            : backup.at ? `✅ Đã tự lưu vào du-lieu/sao-luu.json lúc ${new Date(backup.at).toLocaleTimeString()}`
            : 'Tự lưu vào du-lieu/sao-luu.json mỗi khi bạn chỉnh sửa — chép cả thư mục là mang được sang máy khác.'}
        </div>
        <div style={{ ...row, flexWrap: 'wrap' }}>
          <button style={btn} onClick={exportConfig}>⬇ Xuất file</button>
          <FileButton accept=".json" onFile={importConfig}>⬆ Nhập file</FileButton>
          <button style={btn} onClick={() => confirm('Đặt lại toàn bộ về ban đầu? (Có thể hoàn tác)') && act.resetAll()}>Đặt lại tất cả</button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Mọi thay đổi tự lưu trong trình duyệt này. Xuất file để sao lưu hoặc chuyển sang máy khác (kèm cả model).</div>
      </Section>
    </div>
  )
}
