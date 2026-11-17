# Văn phòng Agent 3D — Lộ trình tự học cùng AI

## Chạy dự án
```bash
npm install
npm run dev
```
Mở http://localhost:5173. Kéo chuột để xoay, cuộn để phóng to/thu nhỏ.

## Bản đồ code (đọc theo thứ tự này)
| File | Vai trò |
|---|---|
| `src/agents.js` | Hồ sơ nhân viên, các địa điểm, bảng TRẠNG THÁI → hành vi. **Sửa ở đây để cá nhân hóa.** |
| `src/store.js` | Kho trạng thái (Zustand). Mọi sự kiện đi vào `applyEvent()`. |
| `src/simulator.js` | Tạo sự kiện ngẫu nhiên. Sau này thay bằng WebSocket. |
| `src/Office.jsx` | Căn phòng dựng từ khối hộp. |
| `src/Agent.jsx` | Nhân vật: đọc trạng thái → đi tới đích trong `useFrame` (chạy 60 lần/giây). |
| `src/App.jsx` | Ghép tất cả: Canvas, ánh sáng, camera, bảng nhật ký. |

Luồng dữ liệu: **sự kiện → store → Agent đọc store → di chuyển/đổi màu**.

---

## Các bước tiếp theo (tự làm cùng AI)

Mỗi bước: (1) đọc phần "Hiểu trước", (2) đưa prompt cho AI, (3) chạy thử, (4) **tự giải thích lại** đoạn code AI viết. Nếu không giải thích được thì hỏi AI "giải thích từng dòng".

### Bước 2 — Cá nhân hóa ✅ (đã có Phòng thay đồ — xem TAO-NHAN-VAT.md)
Bấm **👤 Phòng thay đồ** hoặc bấm vào nhân vật: đổi tên, vai trò, bàn, màu, chiều cao, model, động tác, mẫu; thêm/xóa nhân viên; hoàn tác (Ctrl+Z); xuất/nhập file. Tất cả tự lưu trong trình duyệt.
Phần dưới là ghi chú cũ khi còn sửa bằng code:
Hiểu trước: mọi thứ về nhân vật nằm trong `agents.js`.
- Tự làm không cần AI: đổi tên, màu áo, thêm nhân viên thứ 5.
- Prompt: *"Trong src/Agent.jsx, thêm tóc (một nửa hình cầu) và kính cho nhân vật. Thêm trường `hair` và `glasses: true/false` vào hồ sơ trong src/agents.js."*
- Prompt: *"Khi bấm vào một nhân vật, hiện bảng chi tiết gồm tên, vai trò, trạng thái và 5 sự kiện gần nhất của người đó."*

### Bước 3 — Nối agent thật ✅ (đã làm — xem NOI-AGENT.md)
Server nhỏ chạy chung với `npm run dev`. Mục **🔌 Nối agent** trong Phòng thay đồ có sẵn đoạn code cho Claude Code, Python, JavaScript, n8n.
Phần dưới là ghi chú cũ:

### (cũ) Bước 3 — Nối agent thật qua WebSocket
Hiểu trước: server nhận `POST /event` từ agent rồi phát lại cho trình duyệt qua WebSocket. Trình duyệt chỉ cần gọi `applyEvent()`.
- Prompt: *"Tạo thư mục server/ với Node.js dùng thư viện ws và http có sẵn. Endpoint POST /event nhận JSON {agentId, status, detail} rồi gửi cho mọi client WebSocket. Trong src/, tạo src/socket.js kết nối ws://localhost:8787 và gọi useOffice.getState().applyEvent(). Giữ simulator để bật/tắt bằng biến môi trường."*
- Thử bằng tay:
  ```bash
  curl -X POST localhost:8787/event -H "Content-Type: application/json" -d "{\"agentId\":\"coder\",\"status\":\"typing\",\"detail\":\"test\"}"
  ```
- Nếu dùng Claude Code: prompt *"Viết hook PreToolUse/PostToolUse/Stop cho Claude Code, gửi sự kiện tới http://localhost:8787/event. Ánh xạ tool WebSearch/WebFetch → searching, Edit/Write → typing, Stop → idle."*
- Nếu tự viết agent (Python/JS): gọi `requests.post(...)` ở mỗi bước của agent.

### Bước 4 — Nhân vật và nội thất đẹp ✅ (đã có bản đầu)
Đang dùng:
- `public/models/robot.glb`: robot RobotExpressive (CC0, từ ví dụ của three.js) với 14 animation. `src/Agent.jsx` tô lại vật liệu "Main" theo màu `shirt` trong hồ sơ.
- `public/furniture/*.glb`: 27 món trong Kenney Furniture Kit (CC0, kenney.nl). Bộ đầy đủ có 140 món. `src/Furniture.jsx` nạp và phóng to ×2.
- Đổi animation cho từng trạng thái: sửa trường `anim` trong `STATUS` ở `src/agents.js`.

Thử trong Console (F12) khi đang chạy `npm run dev`:
```js
office.setState({ paused: true })   // dừng giả lập
office.getState().applyEvent({ agentId: 'coder', status: 'waiting', detail: 'Duyệt giúp' })
office.setState({ paused: false })  // chạy lại
```

Nâng cấp tiếp:
Hiểu trước: file `.glb`/`.vrm` là model 3D. `useGLTF` trong drei để nạp, `useAnimations` để chạy animation.
- Tạo nhân vật: VRoid Studio (xuất .vrm) hoặc nhân vật của Kenney/Quaternius (.glb). Animation lấy từ Mixamo.
- Prompt: *"Thay khối hộp/viên nang trong Agent.jsx bằng model public/models/minh.glb dùng useGLTF. Dùng useAnimations: chạy 'Walk' khi đang di chuyển, 'Typing' khi status là typing, 'Idle' còn lại. Mỗi hồ sơ trong agents.js có trường model."*
- Prompt: *"Thay bàn ghế hộp trong Office.jsx bằng model nội thất .glb trong public/furniture/."*

### Bước 5 — Nâng cao
- Tìm đường A* để nhân vật đi vòng qua bàn thay vì đi xuyên qua.
- Đồng hồ thời gian làm việc và số token tiêu tốn của từng agent (lấy từ log, không gọi AI).
- Phát lại lịch sử: lưu sự kiện vào file, tua lại một ngày làm việc.
- Agent con: sự kiện `spawn` → nhân viên mới đi vào từ cửa.

---

## Mẹo dùng AI để học nhanh
1. **Mỗi lần chỉ xin một việc nhỏ.** Prompt càng cụ thể (tên file, tên hàm) thì kết quả càng đúng.
2. **Gửi kèm lỗi nguyên văn.** Mở F12 → Console, chép cả lỗi cho AI.
3. **Bắt AI giải thích**: "Giải thích vì sao dùng useFrame thay vì useEffect ở đây."
4. **Tự sửa trước khi hỏi**: thử đổi `SPEED`, màu, vị trí để thấy mỗi con số ảnh hưởng gì.
5. **Lưu từng mốc**: dùng git, `git commit` sau mỗi bước chạy được để có thể quay lại.

## Tài liệu
- React Three Fiber: https://r3f.docs.pmnd.rs
- Drei (bộ tiện ích): https://drei.docs.pmnd.rs
- Zustand: https://zustand.docs.pmnd.rs
- Three.js: https://threejs.org/docs
