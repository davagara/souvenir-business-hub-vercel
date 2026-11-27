# Souvenir Business Hub

Katalog digital + manajemen operasional untuk bisnis souvenir kustom. React + Vite + Firebase, siap deploy ke Vercel.

## Deploy ke Vercel
1. Push folder ini ke repo GitHub Anda.
2. vercel.com/new → Import repo → Framework: **Vite** (terdeteksi otomatis). Node.js Version: **22.x**.
3. Deploy. Tidak ada env var yang wajib (lihat `.env.example` untuk opsi).
4. Firebase Console → Authentication → Settings → **Authorized domains** → tambahkan domain Vercel Anda (`xxx.vercel.app` dan domain custom).
5. Pastikan `firestore.rules` sudah ter-deploy di Firebase.

## Struktur
- `src/` — aplikasi React
- `api/` — Vercel Serverless Functions (`/api/inquiries/validate`, `/api/admin/verify`)
- `vercel.json` — SPA rewrite + header

## Lokal
- `bun install` lalu `bun run dev` untuk frontend saja.
- Untuk menjalankan frontend + `/api` sekaligus: `npx vercel dev`.
