# Tự tạo nhân vật 3D và đưa vào văn phòng

Quy trình: **Meshy/Tripo (tạo model) → Mixamo (gắn xương + animation) → thử bằng kéo-thả → lưu vào dự án**

---

## 1. Tạo model bằng AI

**Meshy** (meshy.ai) hoặc **Tripo** (tripo3d.ai), cả hai đều có gói miễn phí:
1. Chọn *Image to 3D* (khuyên dùng, giống ý hơn) hoặc *Text to 3D*.
2. Mẹo để Mixamo gắn xương tốt:
   - Nhân vật **đứng thẳng, dang tay chữ T hoặc chữ A**, nhìn thẳng.
   - Tách rõ tay và chân, không cầm đồ vật, không mặc váy dài hoặc áo choàng.
   - Ví dụ prompt: *"cute chibi office worker, T-pose, full body, front view, stylized low poly, white background"*.
3. Nếu có tùy chọn, giảm số đa giác (*low poly*, khoảng 10–30 nghìn) để văn phòng chạy mượt.
4. Tải về dạng **FBX** (để đưa sang Mixamo) hoặc **GLB** (nếu chỉ cần model đứng yên hoặc model đã có sẵn animation).

> Meshy và Tripo có sẵn tính năng gắn xương và animation. Bạn có thể dùng luôn và tải GLB về, bỏ qua bước Mixamo.

## 2. Gắn xương và thêm animation bằng Mixamo

mixamo.com (miễn phí, đăng nhập bằng tài khoản Adobe):
1. **Upload Character** → chọn file FBX vừa tải (hoặc OBJ).
2. Đặt các điểm cằm, cổ tay, khuỷu tay, đầu gối, háng → **Next** → chờ gắn xương.
3. Chọn animation cho từng động tác. Gợi ý từ khóa tìm kiếm:

| Động tác | Tìm trên Mixamo | Ghi chú |
|---|---|---|
| walk (đi bộ) | "Walking" | **Bắt buộc tick "In Place"**, không thì nhân vật trượt khỏi chỗ |
| idle (đứng yên) | "Idle", "Breathing Idle" | |
| sit (ngồi gõ phím) | "Typing", "Sitting Idle" | |
| wave (vẫy tay) | "Waving" | |
| yes (gật đầu) | "Head Nod Yes" | |
| no (lắc đầu) | "Shaking Head No" | |

4. Tải về:
   - **Lần đầu (có nhân vật):** Format *FBX Binary*, Skin *With Skin*. Đây là file model chính, ví dụ `tuan.fbx`.
   - **Các animation còn lại:** Skin *Without Skin* (file nhẹ hơn), ví dụ `walk.fbx`, `typing.fbx`, `wave.fbx`…

## 3. Đưa vào văn phòng bằng Phòng thay đồ (không cần sửa code)

1. `npm run dev` → mở http://localhost:5173
2. Bấm **👤 Phòng thay đồ** ở góc dưới bên trái, hoặc **bấm thẳng vào nhân vật** trong văn phòng.
3. Mục **Model 3D** → **📂 Tải model của tôi** → chọn file `.glb` hoặc `.fbx`.
4. Mục **Động tác**: với mỗi động tác, chọn clip trong menu, hoặc bấm **📂** để tải file animation riêng từ Mixamo.
5. Chỉnh **Cao** nếu nhân vật to hoặc nhỏ quá, bấm **Xoay 180°** nếu nhân vật quay lưng.
6. **Tô màu**: chọn vật liệu sẽ được tô theo màu bạn chọn (ví dụ vật liệu áo).
7. Bấm các nút **đi bộ / ngồi / vẫy tay…** dưới ô xem trước để kiểm tra từng động tác.

Mọi thứ **tự động lưu** trong trình duyệt, kể cả file model. Dùng **⬇ Xuất file** để sao lưu hoặc chuyển sang máy khác.

## 3b. Phụ kiện và cá tính

**🎒 Kho phụ kiện** (trong Phòng thay đồ):
- Bấm vào món để đeo, bấm lần nữa để tháo. Có 6 vị trí đeo: Đầu, Mắt, Tai, Cổ, Lưng, Tay. Mỗi vị trí 1 món.
- **Đang đeo**: đổi màu, kéo thanh trượt Lên/xuống, Trước/sau, Trái/phải, Cỡ, Xoay cho vừa model.
- **＋ Tải phụ kiện của tôi**: chọn file `.glb` (làm bằng Meshy hoặc Tripo, ví dụ prompt *"low poly cowboy hat"*), rồi chọn vị trí đeo. Code tự co giãn cho vừa.
- Phụ kiện được gắn vào **xương** nên chuyển động theo nhân vật. Code tự nhận xương của robot và của Mixamo (`mixamorigHead`, `mixamorigSpine2`, `mixamorigRightHand`…). Nếu model không có xương thì đồ được gắn theo chiều cao.
- Mẫu có sẵn kèm đồ: **Sếp 🎩, Lập trình viên 🎧, Nữ hoàng 👑, Đi phượt 🎒**. Khi bạn **Lưu thành mẫu**, phụ kiện được lưu kèm.

**🎭 Khi rảnh** (mục Thông tin): Uống cà phê, Ngồi sofa (3 chỗ; hết chỗ thì đứng cạnh), Nhảy, Đi dạo, Ở lại bàn, hoặc Ngẫu nhiên (đổi kiểu mỗi 20 giây).
Động tác **nhảy** của model tự làm: tải clip "Dancing" từ Mixamo ở mục Động tác.

Muốn thêm món vào kho? Mở `src/accessoryCatalog.jsx`, viết một hàm dựng hình như các món có sẵn, rồi thêm một dòng vào `ACCESSORIES`.

## 4. (Tùy chọn) Đặt sẵn trong code

Cách này dành cho khi muốn nhân vật có sẵn ngay từ đầu, ví dụ để chia sẻ dự án cho người khác. Lưu ý: `agents.js` chỉ được dùng ở **lần chạy đầu tiên**, hoặc sau khi bấm **Đặt lại tất cả**.
1. Chép file vào thư mục `public/models/`, ví dụ:
   ```
   public/models/tuan.fbx
   public/models/anim/walk.fbx
   public/models/anim/typing.fbx
   public/models/anim/wave.fbx
   ```
2. Mở `src/agents.js` và thêm `character` vào hồ sơ agent:
   ```js
   { id: 'coder', name: 'Tuấn', role: 'Lập trình', shirt: '#22c55e', desk: 2, height: 1.6,
     character: {
       model: '/models/tuan.fbx',
       animFiles: {
         walk: '/models/anim/walk.fbx',
         sit:  '/models/anim/typing.fbx',
         wave: '/models/anim/wave.fbx',
       },
     },
   },
   ```
3. Nếu model GLB đã có sẵn animation nhưng tên lạ, ví dụ "Armature|Run_01", thì đổi tên bằng `anims`:
   ```js
   character: { model: '/models/minh.glb', anims: { walk: 'Armature|Run_01', idle: 'Armature|Idle' } }
   ```
   Menu ở mục Động tác trong Phòng thay đồ liệt kê đúng các tên clip có trong file.

## Code xử lý thế nào (để bạn tự đọc)

| File | Làm gì |
|---|---|
| `src/characters.js` | Danh sách động tác, robot mặc định, cách đoán tên clip (`matchClipName`), động tác thay thế (`FALLBACK`) |
| `src/Character.jsx` | Nạp `.glb` hoặc `.fbx` → sao chép → đo kích thước → co giãn → ghép animation riêng → chuyển động tác mượt |
| `src/Agent.jsx` | Di chuyển và chọn động tác theo trạng thái và cá tính khi rảnh (`computeGoal`). Nếu model lỗi thì quay về robot (`CharacterBoundary`). Bấm vào để mở Phòng thay đồ |
| `src/CharacterEditor.jsx` | Phòng thay đồ (kể cả Kho phụ kiện) |
| `src/accessoryCatalog.jsx` | Danh mục 11 phụ kiện dựng bằng code + các vị trí đeo |
| `src/Accessories.jsx` | Tìm xương, tính điểm gắn, gắn phụ kiện vào xương |
| `src/loading.jsx` | Đọc file đã lưu + chặn lỗi khi file hỏng |
| `src/PreviewCanvas.jsx` | Ô xem trước 3D trong Phòng thay đồ |
| `src/store.js` | Hồ sơ nhân viên, hoàn tác, mẫu, tự động lưu |
| `src/storage.js` | Lưu vào trình duyệt: hồ sơ vào localStorage, file model vào IndexedDB; xuất/nhập |

Thứ tự tìm clip cho một động tác: tên trong `anims` → clip từ `animFiles` → đoán theo tên (walk, idle, sit…). Nếu vẫn không thấy thì dùng động tác thay thế, ví dụ thiếu "ngồi" thì dùng "đứng yên", còn thiếu "đi bộ" thì nhân vật nhún nhảy khi di chuyển.

## Gặp lỗi?
- **Nhân vật khổng lồ hoặc tí hon:** chỉnh `height`.
- **Đi trượt, đi xong bị giật về chỗ cũ:** chưa tick "In Place" trên Mixamo.
- **Model xám, mất màu:** file FBX để ảnh texture ở ngoài. Hãy dùng GLB (texture nằm luôn trong file) hoặc tải lại với tùy chọn nhúng texture.
- **Animation từ Mixamo không chạy trên model GLB từ Meshy:** tên xương không khớp. Animation Mixamo chỉ chạy với model cũng được gắn xương bằng Mixamo, nên hãy tải nhân vật từ Mixamo (bước 2.4), đừng dùng file gốc từ Meshy.
- **Không hiện gì:** mở F12 → Console, chép lỗi gửi cho AI.
