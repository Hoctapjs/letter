# Icon assets needed

Tất cả icon trong app hiện đã trỏ về file PNG. Các file trong `images/icons/` đang là placeholder được copy từ `images/writing.png`.

Khi có icon thật, chỉ cần ghi đè đúng tên file bên dưới. Nên dùng PNG nền trong suốt, kích thước đề xuất `64x64` hoặc `128x128`, cùng một phong cách màu với theme `#FFFDF6`, `#FAF6E9`, `#DDEB9D`, `#A0C878`.

| File | Dùng ở đâu | Gợi ý hình |
| --- | --- | --- |
| `images/writing.png` | Logo header, favicon | Phong bì/lá thư kèm bút, icon chính của app |
| `images/icons/home.png` | Nút Home, route lỗi về Home | Nhà đơn giản |
| `images/icons/wall.png` | Nút Letters Wall, route lỗi về Letters Wall | Bảng/tường ghim thư |
| `images/icons/post.png` | Nút Post to Letters Wall | Gửi thư/đăng thư |
| `images/icons/save.png` | Nút Save Changes, Save JSON | Lưu nội dung |
| `images/icons/new.png` | Nút New, New Letter | Tạo thư mới, dấu cộng hoặc tờ giấy mới |
| `images/icons/cancel.png` | Nút Cancel Edit | Hủy/chấm x nhẹ |
| `images/icons/open.png` | Nút Open JSON | Mở file/thư mục |
| `images/icons/export.png` | Nút Export JSON | Xuất file, mũi tên đi ra |
| `images/icons/download.png` | Download Letter, Download Image | Tải xuống |
| `images/icons/back.png` | Back to wall | Mũi tên quay lại |
| `images/icons/compose.png` | Compose, Open compose | Viết thư/bút |
| `images/icons/edit.png` | Edit letter | Bút sửa |
| `images/icons/link.png` | Copy Link | Mắt xích/liên kết |
| `images/icons/copy.png` | Copy view/edit link trong modal | Hai tờ giấy/copy |
| `images/icons/close.png` | Đóng modal | Dấu x |
| `images/icons/view.png` | View, Open Letter | Mắt hoặc lá thư mở |
| `images/icons/delete.png` | Delete | Thùng rác |
| `images/icons/check.png` | Done | Dấu tick |

Lưu ý triển khai:
- Không đổi tên file nếu không sửa lại đường dẫn trong `index.html` hoặc `app.js`.
- Nên giữ tất cả icon cùng kích thước canvas để nút không bị lệch.
- Nếu dùng icon nhiều màu, nên tránh quá rực để không phá palette nhẹ hiện tại.
