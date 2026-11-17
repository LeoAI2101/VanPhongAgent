# Cài đặt Văn phòng Agent 3D

## Cài trên máy mới (Windows)
1. Chép cả thư mục **VanPhongAgent** sang máy mới (hoặc giải nén file `.zip` tạo bởi `SAO-LUU.bat`).
2. Bấm đúp **`CAI-DAT.bat`**. Script sẽ tự làm 4 việc:
   - Kiểm tra **Node.js**. Nếu chưa có, hỏi để cài tự động bằng `winget` (bấm **Y**). Nếu cài xong mà script báo cần mở lại, hãy đóng cửa sổ rồi bấm đúp `CAI-DAT.bat` lần nữa.
   - Tải thư viện (**cần internet**, khoảng 1–3 phút).
   - Tạo biểu tượng **"Van phong Agent"** trên Desktop.
   - Mở văn phòng trong trình duyệt.
3. Nhân viên, trang phục, model và phụ kiện **tự được nạp lại** từ thư mục `du-lieu/`.

## Dùng hằng ngày
- Bấm đúp **"Van phong Agent"** trên Desktop, hoặc `CHAY.bat` trong thư mục.
- **Đóng cửa sổ đen** là tắt văn phòng.
- Nếu văn phòng đang chạy sẵn, bấm lại chỉ mở thêm trình duyệt chứ không chạy lần hai.

## Sao lưu / chuyển máy
- Văn phòng **tự lưu** vào `du-lieu/sao-luu.json` mỗi khi bạn chỉnh sửa (khi văn phòng đang chạy).
- Bấm đúp **`SAO-LUU.bat`** để tạo file `ban-sao-luu\VanPhongAgent-<ngày>.zip`, vài trăm KB. Chép file đó sang máy khác là đủ.
- Trong Phòng thay đồ, mục **Sao lưu**, có thêm các nút:
  - **💾 Lưu vào thư mục dự án**: lưu ngay
  - **📂 Nạp từ thư mục**: dùng khi trình duyệt trên máy mới đã có dữ liệu cũ, và bạn muốn thay bằng dữ liệu mang từ máy khác sang
  - **⬇ Xuất file / ⬆ Nhập file**: một file `.json` duy nhất

## Sau khi chuyển máy: nối lại Claude Code
Đường dẫn tới hook trên mỗi máy một khác. Sau khi cài: **Phòng thay đồ → 🔌 Nối agent → tab Claude Code → 📋 Chép**, rồi dán lại vào `.claude/settings.json` của dự án. `CAI-DAT.bat` cũng in đường dẫn mới ra màn hình.

## macOS / Linux
```bash
bash cai-dat.sh   # lần đầu
bash chay.sh      # các lần sau (Ctrl+C để tắt)
```

## Gặp lỗi?
| Lỗi | Cách sửa |
|---|---|
| `Port 5173 is in use` | Một chương trình khác đang dùng cổng 5173. Tắt nó, hoặc đóng cửa sổ văn phòng cũ |
| Không tải được thư viện | Kiểm tra internet, chạy lại `CAI-DAT.bat` |
| Máy không có `winget` | Tự cài Node.js LTS ở https://nodejs.org rồi chạy lại `CAI-DAT.bat` |
| Mở ra trống, không có nhân viên | Phòng thay đồ → Sao lưu → **📂 Nạp từ thư mục** |
| Góc phải báo "Mất kết nối server" | Cửa sổ đen đã bị đóng. Mở lại `CHAY.bat` |

## Trong thư mục có gì
| Mục | Là gì |
|---|---|
| `CAI-DAT.bat`, `CHAY.bat`, `SAO-LUU.bat` | Các nút bấm đúp |
| `du-lieu/` | Dữ liệu của bạn (đừng xóa) |
| `ban-sao-luu/` | Các file zip đã tạo |
| `src/`, `server/`, `hooks/`, `public/` | Code, server, hook, model 3D |
| `node_modules/` | Thư viện tải về khi cài, **không cần chép** sang máy khác |
| `HUONG-DAN.md`, `TAO-NHAN-VAT.md`, `NOI-AGENT.md` | Hướng dẫn học, tạo nhân vật, nối agent |
