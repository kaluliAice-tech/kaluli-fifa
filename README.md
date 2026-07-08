# Kaluli FIFA World Cup 2026 Prediction Game

Mobile-first prediction game untuk campaign Kaluli Ice Cream. React + Vite + Tailwind CSS di frontend, Supabase sebagai database, siap deploy ke Netlify.

## Fitur

- Landing page, register sederhana (nama, WhatsApp, email/IG opsional)
- Dashboard prediksi: 1 pick per ronde aktif (Round of 16 → Final)
- Bracket eliminasi vertikal dengan badge "Your Pick" / "Correct" / "Wrong"
- Sistem poin dengan multiplier untuk streak benar berturut-turut
- Leaderboard dengan tie-breaker (streak, correct pick, waktu submit)
- Admin panel (`/admin`) dengan password sederhana: tambah/edit match, update score & winner, set ronde aktif, trigger hitung poin
- **Preview mode**: jika env var Supabase belum di-set, app otomatis jalan pakai dummy data (localStorage) — jadi `npm install && npm run dev` langsung bisa dicoba tanpa setup backend dulu.

## 1. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Tanpa env var Supabase, app berjalan di **preview mode** memakai dummy data (lihat `src/lib/dummyData.js`) dan simulasi login/prediksi disimpan di `localStorage` browser kamu.

## 2. Setting environment variable

Copy `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi variabel berikut:

| Variable | Keterangan |
|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase kamu (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key project Supabase kamu |
| `VITE_ADMIN_PASSWORD` | Password untuk masuk ke halaman `/admin` |
| `VITE_SPORTS_API_KEY` | Opsional — API key untuk integrasi sports data provider |
| `SPORTS_API_PROVIDER` | Opsional — nama provider sports API (mis. `api-football`, `sportradar`, dst) |

> Selama `VITE_SPORTS_API_KEY` kosong, semua update score/winner dilakukan manual lewat halaman `/admin`.

## 3. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan seluruh isi file `supabase/schema.sql` di repo ini. File ini membuat tabel `users`, `matches`, `predictions`, `leaderboard`, `settings`, trigger auto-update leaderboard, dan RLS policy dasar.
3. Ambil **Project URL** dan **anon public key** dari Project Settings → API, masukkan ke `.env`.
4. (Opsional tapi disarankan untuk produksi) Ganti admin panel agar menulis match/score lewat Supabase Auth + role admin, bukan hanya password di frontend — lihat komentar di bagian bawah `supabase/schema.sql` untuk opsi "quick-launch" vs opsi yang lebih aman.
5. Isi data match awal lewat tab **Table Editor → matches**, atau lewat halaman `/admin` setelah policy quick-launch diaktifkan.

## 4. Integrasi data resmi (API-Football)

Website ini bisa narik jadwal & score Round of 16 s/d Final secara otomatis dari [API-Football](https://www.api-football.com/) (provider `api-sports.io`), lewat Netlify Function supaya API key tidak bocor ke browser.

1. Daftar gratis di [dashboard.api-football.com/register](https://dashboard.api-football.com/register) (tanpa kartu kredit, free tier 100 request/hari — lebih dari cukup untuk sync manual beberapa kali sehari).
2. Ambil API key dari dashboard.
3. Di Supabase, ambil **service_role key** dari Project Settings → API (beda dengan anon key — key ini rahasia, cuma dipakai server-side).
4. Isi 4 env var berikut (di `.env` untuk lokal, dan di Netlify dashboard untuk production):
   - `SUPABASE_URL` (sama seperti `VITE_SUPABASE_URL`, tanpa prefix `VITE_`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SPORTS_API_KEY`
   - `SPORTS_API_PROVIDER=api-football`
5. Deploy ke Netlify (langkah di bawah). Fungsi sync **tidak bisa dites di `npm run dev` lokal** karena butuh Netlify Functions runtime — coba pakai `netlify dev` (dari Netlify CLI) kalau mau tes lokal, atau langsung tes setelah deploy.
6. Di halaman `/admin`, klik tombol **"🔄 Sync dari API"**. Ini akan menarik semua match Round of 16 – Final dari API-Football dan otomatis mengisi/mengupdate tabel `matches` di Supabase (termasuk score & winner begitu pertandingan selesai).
7. Ulangi klik tombol ini secara berkala saat match berlangsung (atau setup cron eksternal gratis seperti [cron-job.org](https://cron-job.org) untuk hit `https://situs-kamu.netlify.app/api/sync-scores` tiap beberapa menit).

Match yang di-sync dari API akan punya id berformat `af-<nomor>` (berbeda dari id manual seperti `m1`). Kamu tetap bisa edit manual lewat `/admin` kalau ada data yang perlu dikoreksi.

Kalau belum sempat setup API key, tidak masalah — semua fitur tetap jalan normal pakai update manual lewat `/admin` seperti sebelumnya.

## 5. Deploy ke Netlify

### Opsi A — lewat Netlify UI (drag & drop / Git)

1. Push project ini ke GitHub/GitLab/Bitbucket.
2. Di Netlify, klik **Add new site → Import an existing project**, pilih repo ini.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Di **Site settings → Environment variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
   - `SUPABASE_URL` (opsional, untuk fitur Sync dari API — lihat bagian 4)
   - `SUPABASE_SERVICE_ROLE_KEY` (opsional, untuk fitur Sync dari API)
   - `SPORTS_API_KEY` (opsional, untuk fitur Sync dari API)
   - `SPORTS_API_PROVIDER` (opsional, isi `api-football`)
6. Deploy. `netlify.toml` di repo ini sudah menangani SPA redirect (`/*` → `/index.html`) supaya routing React Router tidak 404 saat di-refresh.

### Opsi B — Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Pastikan environment variable sudah di-set di Netlify dashboard sebelum build production, karena Vite meng-inline `VITE_*` env var saat build.

## 6. Struktur project

```
src/
  components/       MatchCard, FlagIcon, Header, BottomNav
  lib/
    supabaseClient.js   Supabase client + deteksi preview mode
    AppState.jsx        Context: auth, matches, predictions, leaderboard, admin actions
    points.js            Logika sistem poin & multiplier
    dummyData.js          Dummy data untuk preview mode
  pages/
    Landing.jsx, Register.jsx, Dashboard.jsx, Bracket.jsx,
    Leaderboard.jsx, Rules.jsx, Admin.jsx
supabase/
  schema.sql          SQL schema + trigger + RLS policy
```

## 7. Catatan keamanan

- Admin panel di brief ini memakai **password sederhana di sisi frontend** (`VITE_ADMIN_PASSWORD`) — cukup untuk campaign internal skala kecil, tapi bukan proteksi tingkat produksi karena password ter-bundle di JS. Untuk campaign dengan hadiah bernilai tinggi, ganti ke Supabase Auth dengan role admin dan RLS policy yang membatasi write hanya untuk role tersebut.
- User/score tidak pernah bisa diubah langsung oleh peserta — hanya field `predictions` milik peserta sendiri yang bisa di-insert; update `is_correct`/`points_earned` dilakukan lewat aksi admin "Calculate Points".
- Tidak ada sistem taruhan, undian, atau pembelian wajib di dalam game ini.
