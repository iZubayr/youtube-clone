# YouTube Clone Backend

Express. Baza yo'q: userlar va videolar yozuvi server xotirasida, video fayllar `uploads/` papkasida
saqlanadi. **Server o'chib-yonganda (uxlab uyg'onganda, qayta deploy) hammasi tozalanadi.**
Swagger UI: `/api-docs`

## Endpointlar

| Metod | Yo'l | Auth | Tavsif |
|---|---|---|---|
| POST | /register | - | Ro'yxatdan o'tish (`username`, `password`, avatar rasm ixtiyoriy; form-data yoki JSON) |
| POST | /login | - | Kirish (`username`, `password`), JWT token |
| GET | /users | - | Foydalanuvchilar ro'yxati (`id`, `username`, `avatarUrl`, `videosCount`) |
| POST | /files | Bearer | Video yuklash (form-data: `title`, video fayl — maydon nomi ixtiyoriy, `thumbnail` ixtiyoriy) |
| GET | /files | - | Videolar ro'yxati (`?search=&userId=&page=&limit=`) |
| PUT | /files?id=ID | Bearer | Sarlavha/tavsifni yangilash (`/files/ID` ham ishlaydi) |
| DELETE | /files?id=ID | Bearer | Videoni o'chirish (`/files/ID` ham ishlaydi) |
| GET | /files/my | Bearer | Mening videolarim |
| GET | /download/:fileName | - | Faylni yuklab olish (`?inline=1` — brauzerda ochish) |
| GET | /health | - | Server tirikligini tekshirish |

Hamma yo'l ikki xil ishlaydi: `/register` va `/api/v1/register`.

Himoyalangan endpointlarga header qo'shing: `Authorization: Bearer <token>`

## Kompyuterda ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda: http://localhost:5000/api-docs

## Render'ga qo'yish

1. Papkani GitHub'dagi yangi repo'ga push qiling.
2. Render: New → Web Service → repo'ni tanlang.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
   - (ixtiyoriy) Environment: `JWT_SECRET` — uzun tasodifiy matn
3. Deploy tugagach: `https://NOM.onrender.com/api-docs`

## Server uxlamasligi uchun (bepul)

Render bepul servisi 15 daqiqa so'rov bo'lmasa uxlaydi va ma'lumotlar tozalanadi.
https://uptimerobot.com da HTTP monitor yarating: `https://NOM.onrender.com/health`, har 5 daqiqada.
Render serverni ba'zan o'zi ham qayta ishga tushiradi, shunda ma'lumotlar baribir yo'qoladi.
Vazifani topshirishdan oldin yangi akkaunt va video bilan tekshirib oling.

## Ixtiyoriy: ma'lumotlar uzoqroq saqlansin

Videolar uchun Cloudinary (bepul) ulash mumkin: `CLOUDINARY_URL` ni Render Environment'ga qo'shing.
Userlar va sarlavhalar xotirada qoladi, shuning uchun to'liq saqlash uchun MongoDB kerak bo'ladi.
