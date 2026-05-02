# Musics

Folder này chứa nhạc nền MP3 dùng cho từng lá thư.

## Cách thêm nhạc mới

1. Copy file `.mp3` vào folder `musics/`.
2. Thêm một object mới vào `musics/tracks.json`.
3. Dùng `id` ngắn, không dấu, không khoảng trắng. Ví dụ: `soft-piano-01`.
4. `url` phải trỏ đúng tới file MP3 public, ví dụ: `musics/soft-piano-01.mp3`.

## Schema `tracks.json`

```json
{
  "schemaVersion": 1,
  "tracks": [
    {
      "id": "soft-piano-01",
      "title": "Soft Piano 01",
      "artist": "",
      "file": "soft-piano-01.mp3",
      "url": "musics/soft-piano-01.mp3"
    }
  ]
}
```

## Lưu ý

- Trình duyệt thường chặn autoplay, nên các bước sau sẽ dùng nút Play/Pause trong trang xem thư.
- Nếu số lượng file MP3 nhiều hoặc dung lượng lớn, nên chuyển sang storage riêng như Vercel Blob, Cloudinary, Supabase Storage hoặc S3.
- Không nên đổi `id` sau khi thư đã lưu nhạc bằng `musicId`, vì thư cũ sẽ không tìm được bài nhạc tương ứng.
