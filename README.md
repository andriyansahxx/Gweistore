# Gweistore

Kerangka awal untuk sistem "Auto Order Bot" multi-tenant dengan stack Node.js, Express, Prisma, Telegraf, dan Next.js.

## Struktur

- `apps/api` — Backend Express + Prisma.
- `apps/bot-runner` — Runner Telegraf multi-tenant.
- `apps/admin` — Admin panel Next.js (App Router) dengan placeholder awal.
- `packages/shared` — Abstraksi provider pembayaran (Pakasir & Manual Transfer stub).

## Menjalankan secara lokal

1. Salin `.env.example` menjadi `.env` dan isi nilai yang diperlukan.
2. Instal dependensi di root:

```bash
npm install
```

3. Jalankan migrasi Prisma di `apps/api` setelah konfigurasi database (default menggunakan SQLite):

```bash
cd apps/api
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

4. Menjalankan API:

```bash
npm run dev --workspace api
```

5. Menjalankan bot-runner (membaca tenant dari API):

```bash
npm run dev --workspace bot-runner
```

6. Menjalankan admin panel:

```bash
npm run dev --workspace admin
```

## Menjalankan di Pterodactyl

Gunakan skrip `pterodactyl-start.sh` sebagai start command. Atur env `SERVICE_TARGET` sesuai layanan:

- `SERVICE_TARGET=api` (default) — menjalankan API Express pada `PORT` (set ke `${SERVER_PORT}` di panel).
- `SERVICE_TARGET=bot` — menjalankan bot-runner Telegraf.
- `SERVICE_TARGET=admin` — menjalankan Next.js admin panel.

Contoh konfigurasi Pterodactyl:

- Install command: `npm install`
- Start command: `bash pterodactyl-start.sh`
- Env: `SERVICE_TARGET=api`, `PORT=${SERVER_PORT}` (sesuaikan), serta variabel pada `.env.example`.

## Pengisian stok credential (akun + password)

- Admin dapat menambahkan stok akun premium pada varian produk dengan format `email+Password` dipisah spasi atau baris baru.
- Gunakan endpoint `POST /products/variants/:id/stock` dengan body `{ "payload": "akun1@gmail.com+Pass1 akun2@gmail.com+Pass2" }`.
- Bot akan mengeluarkan stok sesuai jumlah pesanan dalam bentuk file `.txt` bernomor urut dan dikirim ke pengguna ketika pembayaran diselesaikan.

## Catatan

- Skema Prisma mencakup tabel utama untuk multi-tenant, produk, order, pembayaran, dan log.
- Paket `packages/shared` menyediakan interface `PaymentProvider` beserta implementasi Pakasir (URL/API) dan stub Manual Transfer.
- Endpoint dasar (auth, tenant, produk, user, webhook) sudah disiapkan untuk memudahkan iterasi berikutnya.
