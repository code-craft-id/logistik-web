# Serah Terima Dev 2 → Dev 3 (Booking/Transaction/Manifest/Delivery)

**Tanggal:** 2026-11-12  
**Dari:** Dev 2 (Sales, Customer Service, Operations)  
**Kepada:** Dev 3 (Accounting, Reports, Ticketing, Dashboard)  
**Branch/PR:** `devnanda` — PR #9 *fix(dev2): authorization alignment for booking/transaction/manifest/delivery* (HEAD `0d4003f`, base `main`, synced dengan `origin/main`)  
**Status PR:** OPEN, code fixes accepted pada re-review Codex terdahulu (tidak ada defect aplikasi baru pada commit dokumentasi/merge); `reviewDecision: CHANGES_REQUESTED` (butuh re-review/approval formal `z4fL` setelah evidence staging ditinjau). CI workflow tidak ditemukan di `.github/workflows/` (hasil verifikasi saat ini lokal/author-reported).

## 1) Ringkasan status

- **Cakupan Dev 2 yang diserahkan (runtime):** Booking, Transaksi/AWB, AWB lookup, riwayat status transaksi, Manifest (create/assign), Delivery outcome recording — dengan auth server-side, permission, branch scope, validasi, idempotency, dan guard konkuren/transaksional sesuai implementasi saat ini.
- **Riwayat commit relevan:** perbaikan kode aplikasi `8de8d8e` (TypeScript/test issues PR #9 review); `2c2763d`/`43a2a6d` menambah dokumen evidence/handoff; `0d4003f` merge sync `origin/main` untuk mergeability (tanpa konflik, tanpa perubahan runtime aplikasi).
- **Verifikasi lokal (pada state kode aplikasi, rerun 2026-11-12):** `npm run typecheck` lulus, `npm run lint` lulus, `npm test` lulus (**42 files, 410 tests**), `npm run build` lulus.
- **Staging smoke test:** **dilaporkan sudah dicoba dan dites oleh user/tim** (user-reported, bukan observasi otomatis di workspace ini) untuk authentication, branch authorization, AWB lookup, transaction creation, dan delivery workflows — user melaporkan tidak ada error/bug/duplikasi. Checklist & template evidence: `docs/decisions/evidence/pr-9-staging-smoke.md` dan body PR #9. **Bukti aktual (PASS/FAIL per skenario, tester, tanggal/waktu, commit SHA yang di-deploy, URL/env, screenshot/log, kasus allowed+denied) masih perlu dilampirkan** pada template/PR sebelum merge (gate review).
- **Batasan:** ini serah terima kontrak/data operasional Dev 2; **bukan** persetujuan aturan finansial/akuntansi, invoice, ledger, P&L, atau perilaku provider yang belum dikonfirmasi.

## 2) Kontrak & artefak yang relevan untuk Dev 3

### 2.1 Sumber kebenaran data (Prisma, `prisma/schema/sales.prisma`)
- **`Booking`** (opsional, D-05 TBD): relasi ke `branch`, `customer`, `createdBy`, `transactions`. Field jumlah/berat/biaya: `koli Int?`, `kilo Decimal(10,2)?`, `volume Decimal(10,3)?`, `biaya Decimal(15,2)?`. Status string default `"Open"`.
- **`Transaction`** (dokumen operasional/AWB, D-06 TBD): `idempotencyKey` unik, `awbNo`, `bookingId?`, `transactionDate`, `originBranchId?`, `destinationBranchId?`, `courierId?`, `status` default `"Open"` (VarChar 30), `koli/kilo/volume/biaya` (Decimal), `createdById`, soft-delete `deletedAt`. Unik `@@unique([originBranchId, awbNo])`. Relasi: `statusHistory`, `manifestItems`, `deliverySheetItems`.
- **`TransactionStatusHistory`** (immutable history): `transactionId`, `priorStatus`, `newStatus`, `reason`, `actorId`, `changedAt` (+ timestamps). Setiap pembuatan/perubahan status tercatat.
- **`Manifest`** (D-08 TBD): `manifestNo` unik, `manifestDate`, `type?`, `branchId`, `vehicleId?`, `courierId?`, origin/destination/transit1-5, `status` default `"Draft"`, relasi `items`, `deliverySheet?`.
- **`ManifestItem`**: relasi manifest-transaction, `assignedAt/releasedAt/assignedById`, soft-delete. **Constraint saat ini:** `@@unique([transactionId])` (global). Reassignment riwayat `releasedAt` **ditolak fail-closed** sampai D-08 dikonfirmasi (lihat §4).
- **`DeliverySheet` / `DeliverySheetItem`**: sheet per manifest (unik), item per (sheet, transaction) unik; outcome `outcome?`, `deliveredAt?`, `receivedBy?`, `notes?`, soft-delete item.

> Field uang/ukur menggunakan **Prisma Decimal / numeric** (sesuai invariant). Belum ada definisi posting, recognition, costing, invoice, ledger, atau P&L yang disetujui untuk dikonsumsi Dev 3.

### 2.2 Status & lifecycle (sumber: `src/features/bookings/status.ts`)
- Status transaksi: `Open`, `In Transit`, `Delivered`, `Cancelled`.
- Transisi diizinkan: `Open -> In Transit | Cancelled`, `In Transit -> Delivered | Cancelled`, `Delivered/Cancelled -> (terminal)`.
- Perubahan status divalidasi terhadap transisi, dicatat ke `TransactionStatusHistory`, dan dilindungi guard konkuren (conditional update) dalam transaksi DB. Delivery outcome `DELIVERED` dapat memajukan status ke `Delivered` bila transisi valid.
- **Belum ada** mesin status booking/manifest/delivery yang disepakati penuh di luar perilaku yang terimplementasi; manifest `status` default `"Draft"` dan assignment ditolak jika manifest `Closed`.

### 2.3 Auth, permission, dan branch scope
- Entry point server memvalidasi auth/permission/scope secara independen (actions/services/queries), UI bukan otorisasi.
- Resource/aksi operasional yang dipakai Dev 2: `booking`, `transaction`, `manifest`, `delivery` (`view/create/update` sesuai alur). Grant/inventory dikelola Dev 1; akses admin/global mengikuti kontrak `system_admin:manage` dan aturan inventory (bukan bypass resource tak terdaftar).
- Non-admin tanpa branch scope: **deny/empty-by-scope** (fail-closed). Actor non-admin dibatasi ke cabang yang diizinkan (`permitsBranch`); transaksi/manifest/delivery memeriksa keanggotaan scope (origin/destination/branch) dan mencegah cross-branch access/partial write.
- Konsumsi kontrak: `requirePermission`, `currentIdentity`, `permitsBranch`/actor, `IdentityError` (403/409/401) — selaras dengan pola Dev 1.

### 2.4 Server actions / query & route (entry point)
- **Bookings:** `src/features/bookings/actions.ts` (`createBookingAction`), `src/features/bookings/server/{service,queries}.ts`
- **Transactions/AWB:** `createTransactionAction`, `updateTransactionStatusAction`, `lookupTransactionAction` (`lookup-actions.ts`), service/queries; halaman `/transactions`, `/transactions/new`, `/transactions/lookup`, `/transactions/[id]`, `/bookings`, `/bookings/new`.
- **Manifest/Delivery:** `src/features/shipments/manifests-actions.ts`, `server/manifests-service.ts` (`createManifest`, `assignTransactionToManifest`, `recordDeliveryOutcome`).
- **Branch reports (sebagian preview, bukan data operasional final):** `/branch-reports/transaction-details`, `inbound-transaction-details`, `manifest-outbound`, `manifest-vendor`, `delivery` saat ini merender `PreviewScreenPage` (placeholder). `/manifest` juga preview. Dev 3 perlu mengganti/menambah implementasi report nyata berdasarkan definisi metrik yang disetujui.

### 2.5 Perilaku penting untuk integrasi/reporting Dev 3
- **AWB lookup:** scoped (origin/destination/allowed branches), mendukung multi-match & disambiguasi `originBranchId`, serta perbaikan stale/race di UI (abaikan respons usang saat input/filter berubah).
- **Idempotency transaksi:** dukungan `idempotencyKey`/AWB normalization, deteksi konflik payload/key/AWB, recovery race `P2002` (tidak membuat duplikat tidak sah).
- **Delivery outcome:** hanya untuk item valid dalam delivery sheet/manifest & in-scope; outcome final/konflik dan update konkuren ditolak; item soft-deleted dilindungi.
- **Manifest assignment:** menolak duplikat aktif, manifest closed, resource/scope tidak valid; riwayat released diblokir (D-08).

## 3) Kebutuhan/ketergantungan untuk Dev 3 (disarankan)

1. **Definisi metrik & report disetujui** sebelum implementasi P&L/financial posting: time zone, basis tanggal, filter cabang, status yang termasuk, definisi revenue/cost, dan rekonsiliasi sampel (PRD §6, ROADMAP Dev 3). Prioritaskan operational reports & ticketing; **tunda P&L** sampai aturan posting/costing disetujui.
2. **Konfirmasi sumber field finansial:** `Transaction.biaya/kilo/volume/koli` ada sebagai data operasional teramati; pemetaan ke invoice/payment/ledger, pajak, pembulatan mata uang, dan gross profit **belum disetujui**.
3. **Invoice/payment UI (kolaborasi Dev 2):** butuh kesepakatan dokumen sumber (booking/transaction/manifest/delivery), status, dan kapan/siapa boleh membuat/mengubah; hindari asumsi kardinalitas/penomoran (D-05/D-06).
4. **Dashboard/KPI:** konsumsi data via query/server layer yang menghormati permission & branch scope; hindari query tak berbatas pada data besar.

## 4) Keputusan terbuka / risiko (jangan diasumsikan CONFIRMED)

| ID | Topik | Dampak ke Dev 3 |
|---|---|---|
| D-05 | Kardinalitas/relasi booking–AWB/transaction | Jangan asumsikan 1:1/1:N tanpa konfirmasi; report/invoice harus toleran |
| D-06 | Aturan penomoran/keunikan AWB | `awbNo` input/opsional di alur saat ini; jangan hardcode format/generator bisnis |
| D-08 | Tipe/rute/handover/re-manifest manifest | Reassignment released **fail-closed** (`TRANSACTION_REASSIGNMENT_BLOCKED_D08`), `@@unique([transactionId])` belum diubah; report manifest harus sadar batas ini |
| D-10/D-18/D-24/D-25/D-21/D-26 | Sales/customer/consignee/notifikasi/privacy/accounting drafts | Model/tax/accounting customer masih draft/terbatas; bukan izin perilaku finansial |
| Finansial (PRD §6/§7) | Posting, ledger balance, recognition, costing, P&L | **BLOCKED** untuk implementasi finansial final tanpa keputusan |

## 5) Bukti, verifikasi, dan cara melanjutkan

- **PR & diskusi:** https://github.com/code-craft-id/logistik-web/pull/9 (checklist staging di body; komentar blocker staging ditambahkan).
- **Template evidence staging:** `docs/decisions/evidence/pr-9-staging-smoke.md` — **perlu diisi** dengan hasil eksekusi staging aktual (auth, branch authorization, AWB lookup, transaction creation, delivery workflows), termasuk allowed/denied.
- **Reproduksi lokal (bukan staging):**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test` (unit/UI) dan `npm run test:integration` bila DB test tersedia
  - `npm run build`
- **Gate sebelum merge:** evidence staging aktual terlampir, re-review/approval `z4fL`, dan CI hijau jika diwajibkan kebijakan.

## 6) Known non-blocking notes
- `/manifest` dan halaman branch-reports tertentu masih **preview**; halaman transaksi/booking/AWB lookup adalah implementasi operasional.
- Duplikasi kecil pola error-mapping di booking/transaction actions (non-blocking, refactor opsional bila area berubah).
- Idempotency/payload matching mengikuti implementasi saat ini (normalisasi field tertentu); gunakan kontrak service/action yang ada daripada mereplikasi logika di layer report.

---
*Serah terima ini mendeskripsikan state implementasi dan kontrak teramati/terimplementasi; keputusan bisnis TBD tetap mengikuti `docs/PRD.md` dan `docs/ROADMAP.md`.*
