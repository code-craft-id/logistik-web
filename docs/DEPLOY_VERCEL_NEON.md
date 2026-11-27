# Deploy Logistik Web ke Vercel Preview dan Neon

## Prasyarat dan target

- Checkout `dev3/ready-for-review`. Gunakan Node.js dari `.nvmrc`, npm, Prisma dari lockfile, serta klien PostgreSQL 18.
- Verifikasi akun dan scope dengan `gh auth status`, `vercel whoami`, `vercel project inspect logistik-web --scope softdev8` dan `neon projects list`.
- Target staging adalah proyek Vercel `softdev8/logistik-web`, environment **Preview**, dan Neon `neon-crimson-lever` (`morning-flower-10225145`), cabang `logistik-web-staging`, database `logistik_web_staging`. Periksa kembali asosiasi dan perlindungan sebelum setiap restore.
- Proyek Vercel yang terhubung memakai `dev3/ready-for-review` sebagai cabang Production saat audit. Gunakan target CLI eksplisit dan hindari push yang memicu Production.

## Konfigurasi

| Variabel | Tempat dan nilai |
| --- | --- |
| `DATABASE_URL` | Secret Preview. Koneksi pooled Neon untuk database staging, dengan TLS. |
| `BETTER_AUTH_URL` | Origin HTTPS kanonis Preview, tanpa path. Alias saat ini adalah `https://logistik-web-review-preview-softdev8.vercel.app`. |
| `BETTER_AUTH_SECRET` | Secret independen dari localhost dan Production. Buat dengan `openssl rand -hex 32` dan kirim melalui stdin. |
| `DIRECT_URL` | Koneksi direct Neon dengan TLS untuk CLI Prisma dari terminal operator. Simpan di luar repo. |

Gunakan pengaturan environment Preview dan scope cabang bila tersedia. Proyek ini memiliki `DATABASE_URL` bersama untuk Preview dan Production. Deployment staging memberi override `DATABASE_URL` khusus build dan runtime Preview. Ambil nilainya melalui penyimpanan privat dan jalankan CLI dengan tracing shell dimatikan. Jangan unggah URL sumber, kata sandi fixture lokal, atau `TEST_DATABASE_URL`. Jika diperlukan, siapkan akun lingkungan uji tersendiri untuk Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) atau WhatsApp (`WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_API_KEY`). `FEATURE_AWB_SCAN` mengaktifkan fitur opsional dan tetap tunduk pada izin aplikasi.

## Backup, restore, dan riwayat

1. Audit sumber lokal `logistik_web` secara read-only. Catat versi, ekstensi, jumlah baris per tabel, indeks, FK, sequence dan status migrasi. Pastikan penanganan data pribadi disetujui dan akses Preview dilindungi sebelum menghubungkan salinan data.
2. Buat direktori privat di luar repo dengan `umask 077`. Atur parameter koneksi libpq dan `PGPASSFILE` privat. Pastikan koneksi mengarah ke sumber yang benar, lalu jalankan `pg_dump --format=custom --no-owner --no-acl --file="$backup"`. Verifikasi arsip dengan `pg_restore --list "$backup"` dan simpan checksum.
3. Verifikasi Neon menggunakan endpoint **direct** sasaran, sertifikat TLS, versi PostgreSQL 18, nama database, dan katalog database kosong. Jalankan `pg_restore --dbname=logistik_web_staging --single-transaction --exit-on-error --no-owner --no-acl "$backup"` dengan parameter libpq yang sudah diperiksa. Jangan gunakan `--clean` atau `--create`.
4. Bandingkan katalog dan hitungan per tabel, sequence dan statusnya, FK, indeks, serta `_prisma_migrations` dengan snapshot sumber. Periksa checksum file migrasi terhadap riwayat yang terapan.
5. Jalankan `npm exec -- prisma migrate status` dengan `DIRECT_URL` staging. Jika ada migrasi tertunda, tinjau SQL dan dampak data, lalu jalankan `npm exec -- prisma migrate deploy` hanya ke target yang sudah diverifikasi. Ulangi pemeriksaan status dan `npm exec -- prisma migrate diff --from-config-datasource --to-schema prisma --exit-code`. Catat drift yang ditemukan tanpa mengubah migrasi yang sudah terapan.

Restore terverifikasi untuk 83 tabel, 1.068 baris, 259 indeks, 80 sequence, dan 147 foreign key. Migrasi vendor bill diterapkan sesudah verifikasi sehingga total riwayat menjadi 37. Diff yang tersisa adalah default `updated_at` pada `delivery_sheet_items` dan `manifest_items`. Pertahankan default yang ada sampai koordinator migrasi meninjau keduanya.

## Data dan akses administrator

Gunakan data restore bila referensi dan akun masih valid. Verifikasi pengguna aktif, grup aktif dan izin `system_admin:manage`, lalu uji username/password melalui Better Auth. Salurkan kata sandi uji melalui penyimpanan rahasia dan gunakan secret penandatangan sesi baru di Preview. `prisma/seed.mjs`, `prisma/seed-demo.mjs`, dan skrip admin lokal hanya untuk database lokal. Demo seed dapat menghapus fixture terdahulu. Untuk database staging kosong, gunakan salinan fixture fiktif yang sudah ditinjau atau seeder staging khusus yang memverifikasi target, mendeteksi konflik dan memakai transaksi. Audit ini menemukan akun admin sumber sehingga bootstrap baru tidak diperlukan.

## Deploy dan verifikasi

1. Jalankan `npm ci`, `npm exec -- prisma validate`, `npm exec -- prisma generate`, `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build`. Jalankan `npm run test:integration` dengan database loopback terpisah `logistik_web_test`.
2. Siapkan salinan privat yang hanya memuat sumber yang sudah ditinjau. Kecualikan semua file env lokal, dump SQL, cookie, dan dokumen pribadi. Pertahankan `docs/experiments/legacy-ui-inventory.json` dan `docs/experiments/legacy-ui-screen-map.json` untuk pemeriksaan TypeScript. Tautkan salinan ke proyek yang diverifikasi. Periksa `vercel deploy --dry` dan gunakan `vercel deploy --environment=preview` dengan metadata cabang `githubCommitRef=dev3/ready-for-review`. `vercel.json` menentukan framework, instalasi dan pembuatan Prisma Client. `engines.node` memilih Node 24.x.
3. Catat revisi sumber, metadata cabang, status **Ready**, dan URL HTTPS dari Vercel. Pastikan host kanonis sesuai `BETTER_AUTH_URL`, deployment terdaftar sebagai Preview, dan permintaan tanpa izin menerima respons proteksi Vercel. Verifikasi ulang sebelum menggunakan alias baru.
4. Melalui akses Preview yang disetujui, uji halaman awal/login, aset, login, refresh sesi, dashboard, dan navigasi terproteksi. Uji admin dan pengguna terbatas untuk RBAC dan cabang. Periksa data master, booking, AWB, manifest, delivery, laporan, akuntansi dan tiket yang tersedia. Batasi CRUD pada fixture produksi-nol atau database uji terisolasi. Tinjau log error aplikasi.

Untuk pemulihan, arahkan alias Preview yang dilindungi ke deployment Preview terakhir yang kompatibel, atau buat deployment Preview dari sumber yang diketahui baik. Bila restore perlu diulang, buat database staging kosong yang terpisah dan validasi ulang sebelum mengubah konfigurasi. Simpan backup lama secara privat. Jangan gunakan promosi/rollback Production atau reset database.

Referensi resmi [Vercel CLI](https://vercel.com/docs/cli/deploy), [Node.js di Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Deployment Protection](https://vercel.com/docs/deployment-protection), [Prisma Config](https://docs.prisma.io/docs/orm/reference/prisma-config-reference), [Better Auth Security](https://better-auth.com/docs/reference/security).

## Migrasi otomatis saat deploy Production (2026-11-24)

`vercel.json` memanggil `scripts/vercel-build.sh`, yang menjalankan `prisma migrate deploy` hanya bila `VERCEL_ENV=production`, sebelum `next build`. URL yang dipakai: `DIRECT_URL`, lalu `DATABASE_NEON_DATABASE_URL_UNPOOLED`, lalu `DATABASE_URL`. Deploy Preview tidak memigrasi. Bila migrasi gagal, build gagal dan deployment lama tetap aktif. Seed tidak pernah dijalankan otomatis.

## Admin pertama di database Production kosong (2026-11-24)

`scripts/bootstrap-production-admin.mjs` (Node 24) membuat 1 perusahaan, Kantor Pusat, 2 cabang, grup `ADMINISTRATOR` (`system_admin:manage`) dan 1 akun admin dalam satu transaksi. Script menolak bila database sudah punya user. Variabel: `CONFIRM_EMPTY_DATABASE=yes`, `TARGET_DATABASE_URL` (URL direct), `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `COMPANY_NAME`, `BRANCH_1`, `BRANCH_2`. Ganti password segera setelah login pertama.

Alternatif tanpa menyalin URL database: isi env Production `BOOTSTRAP_ADMIN=yes` beserta variabel admin/perusahaan/cabang di Vercel, lalu Redeploy. Build Production menjalankan script setelah migrasi memakai URL database build. Bila database sudah punya user, langkah ini dilewati. Hapus `BOOTSTRAP_ADMIN` dan `ADMIN_PASSWORD` setelah login pertama.
