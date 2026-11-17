// KHO TRẠNG THÁI (Zustand) — nơi duy nhất lưu dữ liệu của văn phòng.
//   profiles: hồ sơ nhân viên (tên, màu, model…) — được lưu lại trong trình duyệt
//   agents:   agent nào đang làm gì (từ giả lập, sau này từ agent thật)
import { create } from 'zustand'
import { DEFAULT_PROFILES, DESK_SLOTS, PALETTE } from './agents'
import { ROBOT } from './characters'
import { loadConfig, saveConfig } from './storage'

const saved = loadConfig()
// true = trình duyệt này đã từng dùng văn phòng; false = máy/trình duyệt mới → thử nạp từ thư mục du-lieu/
export const hadSavedConfig = Boolean(saved)
const IDLE = { status: 'idle', detail: '', updatedAt: 0 }

// Trạng thái hiện tại của một agent (chưa có sự kiện nào thì coi là rảnh)
export const runtimeOf = (s, id) => s.agents[id] || IDLE

// Gộp các lần sửa liên tiếp cùng một ô (ví dụ gõ tên) thành 1 bước hoàn tác
let lastEdit = { key: null, time: 0 }

export const useOffice = create((set, get) => {
  // Ghi hồ sơ mới và lưu bản cũ vào lịch sử để hoàn tác
  const commit = (profiles, coalesceKey) => {
    const now = Date.now()
    const merge = coalesceKey && coalesceKey === lastEdit.key && now - lastEdit.time < 1000
    lastEdit = { key: coalesceKey, time: now }
    set((s) => ({ profiles, history: merge ? s.history : [...s.history.slice(-49), s.profiles] }))
  }
  const mapProfile = (id, fn) => get().profiles.map((p) => (p.id === id ? fn(p) : p))

  return {
    profiles: saved?.profiles || DEFAULT_PROFILES,
    presets: saved?.presets || [],
    history: [],

    agents: {},
    log: [],
    paused: false, // true = tạm dừng giả lập

    clipNames: {},     // agentId → tên các clip animation có trong model
    materialNames: {}, // agentId → tên các vật liệu có trong model
    errors: {},        // agentId → lỗi khi nạp model

    editor: { open: false, selectedId: null },

    // ---------- Kết nối agent thật ----------
    server: 'connecting',        // 'connecting' | 'online' | 'offline'
    simulatorOn: saved?.simulatorOn ?? true,
    lastSeen: {},                // agentId → thời điểm nhận tín hiệu thật gần nhất
    unknown: {},                 // ID gửi tới nhưng chưa gán cho nhân viên nào → { at, status, detail }

    // ---------- Sự kiện từ agent ----------
    // event = { agentId, status, detail, at? }
    // opts.real: đến từ agent thật (qua server); opts.silent: không ghi nhật ký (khi nạp lại trạng thái cũ)
    applyEvent: (event, opts = {}) => {
      const at = event.at || Date.now()
      const known = get().profiles.some((p) => p.id === event.agentId)
      if (!known) {
        if (opts.real) set((s) => ({ unknown: { ...s.unknown, [event.agentId]: { at, status: event.status, detail: event.detail } } }))
        return
      }
      set((s) => ({
        agents: { ...s.agents, [event.agentId]: { status: event.status, detail: event.detail || '', updatedAt: at } },
        lastSeen: opts.real ? { ...s.lastSeen, [event.agentId]: at } : s.lastSeen,
        log: opts.silent ? s.log : [{ ...event, real: !!opts.real, time: new Date(at).toLocaleTimeString() }, ...s.log].slice(0, 30),
      }))
    },

    setSimulator: (on) => set({ simulatorOn: on }),

    // Đổi ID của nhân viên (để khớp với tên agent). Trả về lỗi dạng chữ, hoặc null nếu thành công.
    renameId: (oldId, newId) => {
      newId = newId.trim()
      if (newId === oldId) return null
      if (!/^[\w.\-]{1,64}$/.test(newId)) return 'ID chỉ gồm chữ không dấu, số, dấu - _ . (tối đa 64 ký tự)'
      if (get().profiles.some((p) => p.id === newId)) return 'ID này đã có nhân viên khác dùng'
      commit(mapProfile(oldId, (p) => ({ ...p, id: newId })))
      set((s) => {
        const move = (obj) => {
          const next = { ...obj }
          if (oldId in next) { next[newId] = next[oldId]; delete next[oldId] }
          return next
        }
        const unknown = { ...s.unknown }
        const pending = unknown[newId]
        delete unknown[newId]
        const agents = move(s.agents)
        const lastSeen = move(s.lastSeen)
        if (pending) { // ID này đã gửi tín hiệu từ trước → nhận luôn trạng thái đó
          agents[newId] = { status: pending.status, detail: pending.detail || '', updatedAt: pending.at }
          lastSeen[newId] = pending.at
        }
        return { agents, lastSeen, unknown, editor: { ...s.editor, selectedId: newId } }
      })
      return null
    },

    // ---------- Sửa hồ sơ ----------
    updateProfile: (id, changes, coalesceKey) => commit(mapProfile(id, (p) => ({ ...p, ...changes })), coalesceKey),

    // Sửa phần nhân vật. Nếu đang dùng robot thì sao chép robot ra để sửa.
    updateCharacter: (id, changes) =>
      commit(mapProfile(id, (p) => ({ ...p, character: { ...(p.character || ROBOT), ...changes } }))),

    setModel: (id, ref, fileName) => {
      commit(mapProfile(id, (p) => ({ ...p, character: { model: ref, fileName }, height: 1.6 })))
      set((s) => ({ errors: { ...s.errors, [id]: null } }))
    },
    setRobot: (id) => {
      commit(mapProfile(id, (p) => ({ ...p, character: null, height: undefined })))
      set((s) => ({ errors: { ...s.errors, [id]: null } }))
    },

    // ---------- Phụ kiện (mỗi vị trí đeo 1 món) ----------
    wearAccessory: (id, acc) =>
      commit(mapProfile(id, (p) => ({ ...p, accessories: [...(p.accessories || []).filter((a) => a.slot !== acc.slot), acc] }))),
    updateAccessory: (id, slot, changes, coalesceKey) =>
      commit(mapProfile(id, (p) => ({ ...p, accessories: (p.accessories || []).map((a) => (a.slot === slot ? { ...a, ...changes } : a)) })), coalesceKey),
    removeAccessory: (id, slot) =>
      commit(mapProfile(id, (p) => ({ ...p, accessories: (p.accessories || []).filter((a) => a.slot !== slot) }))),

    addProfile: () => {
      const { profiles } = get()
      const used = new Set(profiles.map((p) => p.desk))
      const desk = DESK_SLOTS.findIndex((_, i) => !used.has(i))
      if (desk < 0) return null
      const id = 'agent-' + Date.now().toString(36)
      const profile = {
        id, name: `Nhân viên ${profiles.length + 1}`, role: 'Trợ lý',
        shirt: PALETTE[profiles.length % PALETTE.length], desk, character: null,
      }
      commit([...profiles, profile])
      set({ editor: { open: true, selectedId: id } })
      return id
    },

    removeProfile: (id) => {
      const rest = get().profiles.filter((p) => p.id !== id)
      commit(rest)
      set((s) => ({ editor: { ...s.editor, selectedId: rest[0]?.id ?? null } }))
    },

    undo: () => {
      const { history, editor } = get()
      if (!history.length) return
      const profiles = history[history.length - 1]
      lastEdit = { key: null, time: 0 }
      const selectedId = profiles.some((p) => p.id === editor.selectedId) ? editor.selectedId : profiles[0]?.id
      set({ profiles, history: history.slice(0, -1), editor: { ...editor, selectedId } })
    },

    // ---------- Mẫu (preset) ----------
    savePreset: (id, name) => {
      const p = get().profiles.find((x) => x.id === id)
      if (!p) return
      const look = { character: p.character, shirt: p.shirt, height: p.height, rotationY: p.rotationY, accessories: p.accessories || [] }
      set((s) => ({ presets: [...s.presets, { id: 'u-' + Date.now().toString(36), name, look }] }))
    },
    applyPreset: (id, preset) => get().updateProfile(id, preset.look),
    deletePreset: (presetId) => set((s) => ({ presets: s.presets.filter((x) => x.id !== presetId) })),

    // ---------- Nhập / đặt lại ----------
    replaceAll: ({ profiles, presets }) => {
      commit(profiles)
      set({ presets: presets || [], editor: { open: true, selectedId: profiles[0]?.id ?? null } })
    },
    // Nạp từ bản sao lưu trong thư mục (không mở Phòng thay đồ)
    restore: ({ profiles, presets, simulatorOn }) => {
      commit(profiles)
      set((s) => ({ presets: presets || [], simulatorOn: simulatorOn ?? s.simulatorOn }))
    },
    backup: { at: null, error: null, restoredAt: null }, // trạng thái sao lưu vào thư mục

    resetAll: () => {
      commit(DEFAULT_PROFILES)
      set({ presets: [], editor: { open: true, selectedId: DEFAULT_PROFILES[0].id } })
    },

    // ---------- Phòng thay đồ ----------
    openEditor: (id) => set((s) => ({ editor: { open: true, selectedId: id ?? s.editor.selectedId ?? s.profiles[0]?.id } })),
    closeEditor: () => set((s) => ({ editor: { ...s.editor, open: false } })),
    selectAgent: (id) => set((s) => ({ editor: { ...s.editor, selectedId: id } })),

    // ---------- Thông tin model (Character.jsx báo về) ----------
    setClipNames: (id, names) => set((s) => ({ clipNames: { ...s.clipNames, [id]: names } })),
    setMaterialNames: (id, names) => set((s) => ({ materialNames: { ...s.materialNames, [id]: names } })),
    setError: (id, message) => set((s) => ({ errors: { ...s.errors, [id]: message } })),
  }
})

// Tự lưu mỗi khi hồ sơ hoặc mẫu thay đổi
useOffice.subscribe((s, prev) => {
  if (s.profiles !== prev.profiles || s.presets !== prev.presets || s.simulatorOn !== prev.simulatorOn) {
    saveConfig({ version: 1, profiles: s.profiles, presets: s.presets, simulatorOn: s.simulatorOn })
  }
})

// Gỡ lỗi: mở F12 → Console và gõ, ví dụ:
//   office.setState({ paused: true })
//   office.getState().applyEvent({ agentId: 'coder', status: 'waiting' })
if (import.meta.env.DEV) window.office = useOffice
