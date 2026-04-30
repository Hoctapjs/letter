# Roadmap Chuyen App Sang Vercel + Database

Danh sach duoi day chia nho viec trien khai theo tung buoc. Khi muon lam phan nao, co the nhap: `trien khai buoc X`.

## Buoc 1: Chuan hoa du lieu thu - Done

- Them schema du lieu thong nhat cho `Letter`.
- Bo sung `id`, `createdAt`, `updatedAt`.
- Chuan hoa cach doc/ghi thu hien tai trong `app.js`.
- Giu tuong thich voi du lieu `localStorage` va `letters.json` cu.

## Buoc 2: Them routing cho app - Done

- Them hash route:
  - `#/compose`
  - `#/wall`
  - `#/letter/:id`
  - `#/letter/:id/edit`
- Khi doi route, app tu render dung man hinh.
- Refresh trang van mo dung thu neu du lieu co san.

## Buoc 3: Them che do xem thu rieng - Done

- Tao man hinh `View Letter`.
- Moi thu trong `Letters Wall` co nut/view link rieng.
- Link dang `#/letter/{id}`.
- Co nut `Back`, `Edit`, `Copy Link`, `Download Image`.

## Buoc 4: Them che do sua thu - Done

- Bam `Edit` se mo form voi du lieu thu cu.
- Submit o che do edit se cap nhat thu thay vi tao thu moi.
- Them `Cancel Edit`.
- Cap nhat `updatedAt`.
- Sau khi sua xong quay ve trang xem thu.

## Buoc 5: Toi uu Letters Wall - Done

- Card thu co cac nut `View`, `Edit`, `Delete`.
- Them confirm truoc khi xoa.
- Hien thi trang thai `Edited` neu thu da sua.
- Empty state dep hon.
- Tim kiem/loc nhe neu can.

## Buoc 6: Chuan bi cau truc Vercel - Done

- Them `package.json`.
- Them `vercel.json`.
- Sap xep lai file neu can cho static hosting.
- Dam bao chay local duoc bang Vercel/dev server.
- Giu app van chay duoc tren IIS/static server.

## Buoc 7: Chon va cau hinh database

- Chon Neon Postgres/Vercel Postgres/Supabase.
- Them bien moi truong:
  - `DATABASE_URL`
  - `TOKEN_SECRET`
- Tao migration/table `letters`.
- Viet tai lieu cau hinh `.env.example`.

## Buoc 8: Tao API backend

- Tao API:
  - `POST /api/letters`
  - `GET /api/letters`
  - `GET /api/letters/:id`
  - `PATCH /api/letters/:id`
  - `DELETE /api/letters/:id`
- Validate du lieu gui len.
- Tra loi ro rang cho frontend.

## Buoc 9: Them edit token

- Khi tao thu, sinh `editToken`.
- Database chi luu hash token.
- Link xem cong khai: `/letter/:id`.
- Link sua rieng tu: `/letter/:id/edit?token=...`.
- `PATCH` va `DELETE` bat buoc token hop le.

## Buoc 10: Ket noi frontend voi API

- `Post` goi API tao thu.
- `Wall` goi API lay danh sach thu.
- `View` goi API lay thu theo `id`.
- `Edit` goi API cap nhat thu.
- `Delete` goi API xoa thu.
- `localStorage` chi con dung cho draft va token vua tao.

## Buoc 11: Link chia se va UX sau khi tao thu

- Sau khi tao thu, hien thi modal/khu ket qua:
  - Link xem thu.
  - Link sua rieng tu.
  - Nut copy tung link.
- Canh bao nhe rang link sua can giu rieng.
- Co nut mo thu vua tao.

## Buoc 12: Kiem thu toan bo

- Test tao/xem/sua/xoa.
- Test mo link o browser khac.
- Test sai token khong sua/xoa duoc.
- Test export anh voi thu dai.
- Test mobile/responsive.
- Test deploy preview tren Vercel.

## Buoc 13: Deploy Vercel

- Push project len GitHub hoac deploy truc tiep.
- Cau hinh env vars tren Vercel.
- Chay migration database.
- Kiem tra production URL.
- Ghi lai huong dan van hanh ngan.
