# Nối agent thật vào văn phòng

Mọi thứ chạy **trên máy bạn**: không cần internet, không tốn token.

```
[Agent] ──POST /api/event──▶ [Server trong npm run dev] ──WebSocket──▶ [Văn phòng 3D]
```

## 1. Chạy văn phòng
```bash
npm run dev
```
Mở http://localhost:5173. Góc dưới bên phải phải hiện **● Server đang chạy** (màu xanh).
Cổng luôn là **5173**. Nếu cổng này đang bị chương trình khác dùng thì lệnh sẽ báo lỗi, không tự đổi sang cổng khác, để hook luôn biết gửi về đâu.

## 2. Tin nhắn agent gửi
```json
POST http://localhost:5173/api/event
{ "agentId": "researcher", "status": "searching", "detail": "Tìm giá vàng" }
```
| status | Nhân vật |
|---|---|
| `idle` | Rảnh, làm theo "Khi rảnh" (cà phê, sofa, nhảy…) |
| `thinking` | Đứng ở bàn suy nghĩ |
| `typing` | Ngồi gõ phím |
| `searching` | Đi tới giá sách, gật gù |
| `waiting` | Vẫy tay, vòng sáng vàng nhấp nháy: **cần bạn** |
| `error` | Lắc đầu, vòng sáng đỏ |

`detail` không bắt buộc, tối đa 120 ký tự. Agent im lặng quá **5 phút** thì tự về `idle`.

## 3. Claude Code trong VS Code (khuyên dùng)
1. Mở **👤 Phòng thay đồ** → chọn nhân viên → mục **🔌 Nối agent** → tab **Claude Code** → **📋 Chép**.
2. Trong dự án bạn mở bằng VS Code, tạo hoặc mở file `.claude/settings.json` rồi dán vào. Nếu file đã có nội dung, chỉ gộp phần `"hooks"`.
3. Mở lại Claude Code. Gõ `/hooks` để kiểm tra hook đã được nhận.
4. Giao việc cho Claude: nhân vật sẽ đi tới giá sách khi Claude đọc hoặc tìm file, ngồi gõ phím khi Claude sửa file hay chạy lệnh, vẫy tay khi Claude xin phép, rồi đi uống cà phê khi xong.

**Mọi dự án cùng lúc**: dùng tab **Claude Code (mọi dự án)** và dán vào `C:\Users\<tên>\.claude\settings.json`. Mỗi dự án tự có ID là **tên thư mục**. Lần đầu dự án gửi tín hiệu, ID của nó hiện ở mục **📡 Tín hiệu chưa gán**; bấm **Gán cho …** để giao dự án đó cho một nhân viên.

Hook nằm ở `hooks/claude-code-hook.js`:
- Văn phòng chưa chạy thì hook lặng lẽ bỏ qua, không làm chậm Claude Code (thoát trong khoảng 0.1 giây).
- Muốn đổi cách đổi sự kiện thành trạng thái thì sửa hàm `mapEvent`.

> ⚠️ Đoạn cấu hình chứa **đường dẫn tuyệt đối** tới file hook. Nếu bạn chuyển thư mục `agent-office` đi chỗ khác, hãy chép lại đoạn cấu hình mới.

## 4. Agent tự viết (Python / JavaScript / n8n)
Mục **🔌 Nối agent** có sẵn đoạn code đã điền ID cho từng loại. Ý tưởng chung: gọi `office("searching", "…")` ở mỗi bước của agent.

## 5. Thử nhanh
- Bấm **Gửi thử** trong mục Nối agent. Mỗi lần bấm, nhân vật đổi sang một trạng thái khác.
- Hoặc dùng PowerShell:
  ```powershell
  $body = '{"agentId":"researcher","status":"waiting","detail":"Duyệt giúp tôi"}'
  Invoke-RestMethod -Method Post -Uri http://localhost:5173/api/event -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
  ```
- Xem trạng thái server đang nhớ: http://localhost:5173/api/agents

## 6. Giả lập
Công tắc **Giả lập** ở góc dưới bên phải. Giả lập **chỉ chạy cho nhân viên chưa nối agent thật**: nhân viên nào có tín hiệu thật trong 10 phút qua thì có biểu tượng 🔌 và không bị giả lập đè lên.

## An toàn
Server **chỉ nhận kết nối từ chính máy này** (localhost). Agent ở máy khác hoặc trên cloud chưa nối được; phần đó cần thêm mật khẩu và sẽ làm ở một bước sau.

## Code liên quan
| File | Làm gì |
|---|---|
| `server/hub.js` | Nhận sự kiện, kiểm tra dữ liệu, nhớ trạng thái, phát qua WebSocket, tự về rảnh sau 5 phút |
| `vite.config.js` | Gắn server vào `npm run dev`, cố định cổng 5173 |
| `src/connection.js` | Văn phòng kết nối WebSocket, tự kết nối lại khi mất |
| `src/ConnectPanel.jsx` | Mục 🔌 Nối agent |
| `hooks/claude-code-hook.js` | Hook cho Claude Code |
| `src/simulator.js` | Giả lập, bỏ qua agent thật |
