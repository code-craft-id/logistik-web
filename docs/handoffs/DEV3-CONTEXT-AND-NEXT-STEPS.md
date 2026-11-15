# Konteks Dev3: pekerjaan selesai dan langkah berikutnya

**Tanggal snapshot: 15 November 2026.**
**Proyek: `code-craft-id/logistik-web` — Logistics Management System (LMS).**

Dokumen ini dibuat agar pemilik proyek atau ChatGPT dapat memahami posisi Dev3
tanpa membaca seluruh percakapan sebelumnya. Ringkasan ini mencakup fakta
implementasi, keputusan pemilik, bukti verifikasi, batas scope, dan rekomendasi
langkah berikutnya. Dokumen ini bisa dibaca sendiri; referensi repository di
bagian akhir disediakan untuk pemeriksaan lebih mendalam.

## 1. Kesimpulan utama

Implementasi Dev3 untuk scope migrasi yang sudah diadopsi mencakup ticketing v1,
laporan operasional, dashboard operasional, invoice/pembayaran, serta accounting
dan laporan keuangan. Implementasi dan verifikasi lokal sudah dikerjakan.

**Langkah berikutnya berfokus pada review gabungan dan kesiapan rilis, bukan
mengulang discovery atau membangun ulang fitur yang sudah selesai.**

Namun, implementasi lokal yang lulus tes belum berarti aplikasi sudah memperoleh
persetujuan merge, diterima di staging, atau siap dipakai di production. FIN-01
dan FIN-02 masih tercatat **PARTIAL untuk acceptance** karena gate tersebut belum
ditutup, meskipun runtime dan UI dalam kontrak yang diadopsi sudah diimplementasikan.

Tidak ada push, merge ke `main`, atau deployment dalam pekerjaan konsolidasi.

## 2. Lokasi kerja dan keadaan Git

| Item | Keadaan pada snapshot |
|---|---|
| Working copy utama | `C:/Development/logistik-web` |
| Branch Dev3 | `codex/dev3-ready-for-review` |
| Checkpoint sebelum dokumen ini | `b9d3adcff7eca2b76d2abf3607171caadbd3eb80` |
| Branch `main` lokal | `c40650299674faca3f4d5e6cb92a8675ac6c1ffc`, tidak diubah |
| Working tree sebelum penulisan dokumen | Clean |
| Worktree Git terdaftar | Satu, yaitu working copy utama |
| Commit di atas `main` sebelum dokumen ini | 55, termasuk merge dan dokumentasi |
| Status remote | Branch baru masih lokal, belum dipush; remote tidak diubah |

Seluruh tujuh tip branch Dev3 lama telah diverifikasi menjadi ancestor branch
gabungan. Riwayat discovery, SUP/RPT, FIN, serta dua riwayat harness yang isinya
setara dipertahankan dengan commit asli; tidak dilakukan squash atau rebase.
Dua linked worktree lama dan tujuh branch lokal Dev3 yang redundan sudah dirapikan.
Branch lokal lain di luar scope Dev3 tetap dipertahankan.

Perubahan minor selanjutnya dikerjakan pada branch gabungan ini. Tidak perlu
menghidupkan kembali worktree FIN/SUP lama. Commit dokumentasi setelah snapshot
di atas tidak mengubah hasil verifikasi kode aplikasi.

## 3. Peta status pekerjaan Dev3

| Pekerjaan | Status | Arti status dan batasnya |
|---|---|---|
| DISC-04 | **DONE WITH NOTES**, diterima pemilik | Discovery yang tersedia diterima. Catatan ketidakpastian tetap dibawa ke fitur yang mengonsumsinya; jangan membuka ulang discovery secara umum. |
| SUP-01 | **DONE untuk v1 yang diterima** | Create, list, dan detail tiket sesuai hak akses dan scope yang disepakati. Bukan helpdesk lifecycle lengkap. |
| RPT-01 | **DONE untuk v1 yang diterima** | Transaction Detail Report sembilan kolom nyata; ekstensi filter/sort/export sudah ditangani dalam follow-up. |
| RPT-02 | **DONE untuk source-backed v1** | Laporan manifest, existing delivery sheets/items, dan dashboard hitungan operasional nyata. |
| RPT-03 | **IMPLEMENTED + VERIFIED** untuk sumber yang disetujui | Filter asal/tujuan terpisah dan sorting sembilan kolom. Lima kolom tanpa mapping ditutup dengan catatan. |
| RPT-04 | **IMPLEMENTED + VERIFIED** | Export CSV sembilan kolom dengan permission, scope, batas ukuran, dan proteksi formula. |
| DEV3-HARD-01 terkait SUP/RPT | **IMPLEMENTED + VERIFIED** untuk temuan runtime yang relevan | Shared policy lock, posisi resource permission, snapshot list/count, serta regression akses dan concurrency. Review final tetap terpisah. |
| SUP-02, SUP-03 | **NOT NEEDED untuk scope migrasi saat ini** | Lifecycle lanjutan, attachment, dan ekstensi relasi tiket tidak diklaim sudah dibuat. |
| RPT-05 | **NOT NEEDED untuk scope migrasi saat ini** | Vendor attribution/report tidak diimplementasikan; tidak ada mapping vendor yang ditebak. |
| FIN-01 | **Implementasi + verifikasi lokal selesai; acceptance PARTIAL** | Invoice/receipt end-to-end tersedia. Human review, koordinasi migrasi, dan staging acceptance masih menunggu. |
| FIN-02 | **Implementasi + verifikasi lokal selesai; acceptance PARTIAL** | Accounting, actual cost, cashflow, P&L, GP dan recap tersedia dalam target yang diadopsi. Gate acceptance sama masih menunggu. |
| Dev3 REL-01 | **Handoff disiapkan; release NOT READY** | Bahan review dan rollout sudah tersedia. Belum ada persetujuan rilis atau bukti staging/UAT/backup-restore. |

`NOT NEEDED` adalah keputusan scope pemilik, bukan pernyataan bahwa fitur tersebut
ada atau bahwa legacy sama sekali tidak memilikinya. Acceptance SUP/RPT v1 juga
tidak mengklaim seluruh parity provider sudah terpenuhi.

## 4. Apa yang sudah berfungsi

### 4.1 Ticketing — SUP-01 dan hardening

- Membuat, melihat daftar, dan membuka detail tiket yang tersimpan di database.
- Pengguna biasa melihat tiket buatannya sendiri dalam cabang yang saat ini
  diizinkan. Administrator mengikuti override eksplisit yang sudah terdaftar.
- Pembuatan memeriksa cabang/hierarki aktif, validasi input, hak akses, dan retry
  idempotent; tidak menduplikasi tiket karena pengiriman ulang yang sama.
- Creator memakai shared policy lock sehingga create yang independen bisa berjalan
  bersama, sementara perubahan identity/organisasi tetap melindungi pengecekan hak.
- Actor, rows, dan count daftar dibaca dalam snapshot transaksi yang konsisten.
- UI memiliki form, list/detail, serta state loading, kosong, invalid, ditolak,
  dan error yang relevan.

Assignment, resolved/reopened, komentar/history workflow lanjutan, attachment,
serta relasi category/AWB/customer tambahan bukan implementasi SUP-01 v1.
Pemilik sudah menerima penghilangan scope tersebut untuk migrasi saat ini.

### 4.2 Reports dan dashboard — RPT-01 sampai RPT-04

**Transaction Detail Report** menggunakan satu baris per Transaction dengan
sembilan field nyata: AWB, tanggal transaksi UTC, cabang asal, cabang tujuan,
pengirim, penerima, koli, kilo, dan status pengiriman yang tersimpan.

Periode dibatasi maksimal 31 hari inklusif; filter cabang/AWB, pagination,
filter asal/tujuan terpisah, dan sorting sembilan kolom tersedia. Nilai Decimal
dan null tidak diubah menjadi angka perkiraan atau nol. Status pengiriman tidak
ditafsirkan sebagai status pembayaran.

Export CSV memakai filter/sorting/scope yang sama, memerlukan hak view **dan**
export, menolak hasil di atas 5.000 baris, serta menangani quoting dan risiko
spreadsheet formula. Ini target UTF-8 CSV yang disetujui, bukan klaim parity
format Excel milik provider.

**RPT-02** membaca manifest beserta sumber operasionalnya dan delivery
sheets/items yang memang sudah ada. Pembaca laporan tidak membuat delivery
sheet dan tidak membuktikan generator OPS-03 telah selesai.

**Dashboard operasional** menampilkan hitungan sumber nyata dalam scope dan
periode yang dipilih. Hitungan tersebut bukan KPI keuangan, SLA, success rate,
atau status bucket legacy yang formulanya belum terbukti.

Kolom Moda, Servis, Deskripsi, Komentar, dan Diterima Oleh pada report transaksi
tidak diberi nilai hasil tebakan. Vendor report juga tidak dibuat dengan join
berdasarkan nama, kendaraan, kurir, atau lokasi yang tidak memiliki kontrak sumber.

### 4.3 Billing dan receipts — FIN-01

Pemilik secara eksplisit menjawab **“Adopt A+B as written”** pada paket kontrak
finance tanggal 15 November 2026. Itu mengadopsi P1–P5 FIN-01 dan target FIN-02;
bukan sekadar izin menyiapkan proposal.

Perilaku FIN-01 yang tersedia:

- Satu invoice dimiliki satu cabang dan satu customer, dengan satu atau lebih
  referensi Transaction/AWB yang divalidasi.
- Satu charge positif per Transaction unik. Satu Transaction hanya boleh
  dicadangkan oleh satu invoice non-VOID, termasuk saat masih draft.
- Tagihan akhir customer diinput secara eksplisit oleh aktor berwenang dalam
  **IDR**, menggunakan Decimal/numeric dengan dua digit pecahan. Precision
  berlebih dan overflow ditolak; total authoritative dihitung di server.
- Nilai `Transaction.biaya` tidak otomatis dijadikan piutang atau vendor cost.
- Draft dapat diubah; lifecycle adalah DRAFT → ISSUED → VOID atau DRAFT → VOID.
- Issue membekukan snapshot customer, cabang, AWB, tanggal dan nominal;
  nomor invoice memakai `INV-{id}` tanpa janji urutan gapless.
- Pembayaran parsial diperbolehkan; overpayment ditolak. Outstanding dan status
  UNPAID/PARTIAL/PAID diturunkan dari receipt, bukan diedit sebagai status bebas.
- Koreksi receipt memakai reversal penuh yang tertaut ke receipt asli;
  bukan menimpa nominal/history. Satu receipt hanya bisa dibalik satu kali.
- Void membutuhkan alasan dan net receipt nol. Sumber dilepas untuk invoice
  berikutnya, tetapi dokumen dan snapshot lama tetap dipertahankan.
- Hak invoice/payment dan cabang diperiksa ulang di server, termasuk dalam
  critical write dan pada replay idempotency key.
- Race create/reservation, edit/issue/void, pembayaran, reversal, dan perubahan
  permission ditangani secara atomik dengan transaksi dan constraint database.

Actor yang memiliki hak dan scope dapat bertindak tanpa harus menjadi creator
invoice. Tidak ada mandatory second approver dalam v1 yang diadopsi. Hak finance
baru tidak otomatis diberikan kepada grup biasa.

### 4.4 Accounting dan financial reports — FIN-02

Target yang diadopsi adalah **manual source-backed accrual accounting** untuk
dokumen LMS baru, menggunakan IDR. Bukan cash-basis accounting atau import saldo
historis yang diasumsikan sudah tersedia.

Implementasi mencakup:

- Chart of Accounts, account/category management, kategori arus kas, dan versi
  mapping akun per cabang. Mapping wajib valid sebelum posting.
- Draft jurnal manual dan balanced debit/credit posting; akun kontrol tidak
  dapat dilewati melalui jurnal manual biasa.
- Workflow beban kas/bank dan transfer internal dengan otorisasi yang sesuai.
- Source-linked posting, idempotency, audit, immutable posted history, dan
  compensating reversal. Klasifikasi dan versi mapping historis dipertahankan.
- Pencatatan biaya aktual dari dokumen pemasok, tertaut ke Transaction dan cabang.
  Finance harus menyatakan kelengkapan biaya secara eksplisit.
- Biaya yang tidak diketahui tidak dianggap nol. Deklarasi biaya nol harus
  disengaja dan disertai bukti/keterangan, bukan fallback untuk data kosong.
- Monthly period close per cabang. Backdating ke periode tertutup ditolak;
  koreksi memakai reversal pada periode terbuka, tanpa membuka ulang v1.
- P&L, Gross Profit per Transaction, recap per bulan untuk cabang terpilih,
  ledger movement dan cashflow yang bisa direkonsiliasi ke sumber posting.

Posting sumber dan perubahan dokumennya berada dalam transaksi yang sama:

| Kejadian | Debit | Kredit |
|---|---|---|
| Issue invoice, tanggal invoice | Piutang | Pendapatan pengiriman |
| Receipt, tanggal diterima | Kas/bank terpilih | Piutang |
| Biaya langsung aktual | Beban pengiriman langsung | Kewajiban pemasok accrued |
| Reversal | Kebalikan posting sumber | Kebalikan posting sumber |

**Receipt tidak menciptakan revenue baru. Void invoice tidak membatalkan
kewajiban pemasok.** Biaya/kewajiban hanya berkurang melalui koreksinya sendiri
yang memiliki alasan dan jejak sumber.

P&L dan GP adalah **pergerakan berdasarkan tanggal akuntansi**. GP bukan margin
invoice-cohort yang diam-diam memasukkan seluruh biaya dari periode lain.
Gross Profit = net source-linked shipment revenue − net source-linked direct
cost; P&L juga memasukkan pendapatan/beban lain. Transfer kas internal tidak
dianggap cashflow eksternal. Missing/unfinalized/foreign-branch costs mencegah
klaim GP final dan menandai P&L belum final.

Contoh rekonsiliasi sintetis yang diadopsi dan dites:

| Komponen | IDR |
|---|---:|
| Invoice dua sumber | 150000.00 |
| Biaya langsung aktual | 90000.00 |
| Gross Profit | 60000.00 |
| Beban kantor lain | 10000.00 |
| Laba P&L | 50000.00 |
| Receipt parsial | 100000.00; piutang tersisa 50000.00, revenue tetap 150000.00 |

Jika receipt dibalik lalu invoice di-void, revenue menjadi nol tetapi biaya
langsung 90000.00 tetap ada sampai dibalik dengan alasan yang sah. Jika biaya
belum lengkap, GP 60000.00 tidak boleh dipresentasikan sebagai angka final.

## 5. Keputusan dan batas scope yang harus dipertahankan

| Keputusan | Keadaan saat ini |
|---|---|
| D-11 | PARTIAL: manual final IDR billing, sumber langsung, dan deklarasi biaya aktual diadopsi; aturan tariff/tax/COD/vendor settlement yang lebih luas belum diadopsi. |
| D-12 | CONFIRMED untuk bounded FIN-01 P1–P5 dan rekonsiliasinya. |
| D-13 | CONFIRMED untuk target FIN-02 B mengenai akun/mapping/posting/biaya/cashflow/periode. |
| D-14 | CONFIRMED untuk target FIN-02 B mengenai recognition date, completeness dan rekonsiliasi P&L/GP/recap. |
| D-21 | PARTIAL: hak finance dan same-actor issue/post/reverse/close diadopsi; approval operasional di luar subset ini belum otomatis disetujui. |
| D-15/D-16/D-19/D-22 | Scope SUP/RPT tertentu sudah diterima; keputusan global yang lebih luas tidak otomatis berubah menjadi CONFIRMED. |

Hal penting untuk pembaca berikutnya:

1. DISC-04 tidak perlu dibuka ulang dan persetujuan A+B tidak perlu ditanyakan lagi.
2. `ShipmentBillingEvent` OPS-04 masih berupa proposed type, bukan producer atau
   pipeline berjalan. FIN menggunakan direct Transaction sources yang diadopsi.
3. Model accounting lama yang berstatus DRAFT tetap tidak dipakai untuk runtime.
   Finance baru memakai model `Fin*` dalam `prisma/schema/finance.prisma`.
4. Tidak ada automatic vendor settlement, bank integration, tax engine, import
   historical balances, atau automatic cross-branch cost ownership transfer.
5. Batas v1: catalogue akun/kategori 500; laporan finance maksimal 10.000 posting
   lines dan 366 hari. Overflow ditolak. Short finance writes diserialisasi global.
6. Observasi legacy adalah `OBSERVED`, bukan persetujuan aturan bisnis. View
   invoice yang kosong dalam pemeriksaan terbatas bukan bukti global tidak ada data.

## 6. Bukti verifikasi dan cara membacanya

Verifikasi penuh finance berlaku untuk source yang dicatat pada **7997505**.
Final finance documentation berada pada **c087243**. Saat konsolidasi, `src/`,
`prisma/`, application tests, package/lockfile, serta konfigurasi Next/Vitest
diverifikasi identik terhadap c087243. Konsolidasi tidak mengubah perilaku aplikasi.

| Pemeriksaan | Hasil yang benar-benar tercatat |
|---|---|
| Full lint pada source finance | PASS, 412 file |
| Typecheck source finance | PASS |
| Unit/UI tests | PASS, 65 file / 664 tes |
| Guarded PostgreSQL integration | PASS, 15 file / 138 tes; termasuk 11 tes finance |
| Production build | PASS |
| Prisma schema validation | PASS |
| Dua migrasi finance pada guarded test DB | PASS |
| UI lokal | Critical flows, keyboard tabs/table scroll, dan delapan loaded routes pada 375/768/1440px; tidak ada page overflow/clipped controls |
| Setelah konsolidasi di working copy utama | Lint 416 file dan typecheck PASS; enam tes offline harness PASS |
| DB → schema diff | Exit 2 karena dua default kolom Dev2 yang sudah ada; tidak ada perbedaan finance |

Tes finance mencakup keunikan sumber, duplicate lines, race issue/edit/void,
overpayment dan reversal races, retry/idempotency conflicts, branch isolation,
hak yang dicabut termasuk saat critical write, inactive-branch receipt denial,
balanced persistence, immutable snapshots/journals, retained supplier liabilities,
cost completeness lintas cabang, internal transfer, dan closed-period corrections.

Migrasi hanya dijalankan pada **`logistik_web_test` loopback dengan target guard**,
bukan pada database development, staging atau production. UI menggunakan fake
fixtures lokal; fixture/session dan server pengujian milik task sudah dibersihkan.
PostgreSQL lokal yang dinyalakan untuk pengujian tetap berjalan.

Tes penuh tidak diulang ketika konsolidasi karena application tree tidak berubah;
yang diperiksa ulang adalah lint/typecheck checkout utama dan harness tambahan.
Jangan menyamakan bukti lokal ini dengan UAT, pengujian staging, browser/device
matrix lengkap, atau penerimaan manusia yang belum dilakukan.

## 7. Pekerjaan yang masih harus ditutup

### A. Review akhir gabungan

Dev1 meninjau auth/RBAC/branch scope/shared contracts; Dev2 meninjau relasi dan
semantik sumber operasional; finance/project owner meninjau hasil terhadap
kontrak yang sudah diadopsi. Review implementasi ini masih wajib. Persetujuan
kontrak tidak menggantikan code review atau staging acceptance.

Temuan shared lock, permission inventory order, dan ticket rows/count snapshot
yang dulu diminta reviewer sudah ditangani. Jangan menganggap seluruh isi
review queue lama masih belum dikerjakan tanpa membaca disposition terbaru.
Saran opsional seperti nama cabang/creator dan FK index perlu ditriase sesuai
bukti, bukan otomatis memperluas scope.

### B. Schema drift Dev2 — perlu disposition migration coordinator

Dua kolom berikut memiliki `DEFAULT CURRENT_TIMESTAMP` di migration history,
tetapi schema mendeklarasikan `@updatedAt` tanpa default:

- `manifest_items.updated_at`
- `delivery_sheet_items.updated_at`

Sumbernya adalah migration yang sudah ada:
`20261031000100_add_timestamps_manifest_delivery_items`.

Ini bukan drift model finance dan tidak diperbaiki diam-diam dalam pekerjaan
Dev3. Coordinator perlu memilih disposition teknis yang tepat. Jika perlu
perubahan, gunakan forward migration yang direview; jangan mengedit applied
migration atau menjalankan `db push` untuk menyembunyikan perbedaan.

### C. Setup dan rollout finance

Dua additive migration baru tersedia:

1. `20261115090000_fin01_invoices`
2. `20261115100000_fin02_accounting`

Keduanya belum diterapkan di development/staging/production oleh task ini.
Sebelum smoke test di lingkungan lain, review migration dan pastikan target DB
secara eksplisit. Hentikan finance writers saat rollout kedua migrasi.

FIN-02 menolak aktivasi jika sudah ada issued FIN-01 invoice/receipt history
yang memerlukan catch-up. Jangan menjalankan binary FIN-01 lama terhadap schema
FIN-02 yang aktif. Jika ada data finansial lama, diperlukan rencana catch-up atau
opening journal yang secara khusus direview; data tidak boleh dilewati diam-diam.

Finance juga perlu mengonfigurasi akun/kategori dan branch mappings yang nyata,
serta memberikan hak finance secara eksplisit kepada grup yang sesuai. Tidak ada
default grant ke ordinary groups dan tidak ada account mapping yang boleh ditebak.

### D. Staging, UAT dan release

Masih diperlukan staging smoke/end-to-end, skenario allowed/denied lintas role
dan cabang, rekonsiliasi yang diterima finance, UAT, backup/restore, serta
persetujuan merge/deployment. Dev3 REL-01 baru memiliki handoff, belum release approval.

Peringatan deprecation `pg` yang pernah terlihat tidak menyebabkan kegagalan
tes; producer tepatnya belum dibuktikan. Tidak ada alasan untuk melakukan
upgrade dependency spekulatif sebagai bagian dari cleanup Git.

## 8. Urutan langkah berikutnya yang direkomendasikan

Urutan ini adalah rekomendasi analisis, bukan pekerjaan yang sudah dijalankan
atau izin baru untuk push/migrasi/deploy.

1. **Review packet lokal** pada branch gabungan: pastikan scope akhir, kontrak,
   source ownership dan bukti sudah cukup untuk satu review Dev3 terpadu.
2. **Triase temuan konkret** yang relevan, terutama finance correctness,
   authorization/concurrency, serta disposition schema drift Dev2. Perbaikan minor
   dikerjakan pada branch yang sama dengan tes regresi yang sesuai.
3. **Setelah ada izin push**, push branch gabungan dan siapkan focused combined PR
   untuk review Dev1/Dev2/finance owner. Belum ada izin push dari task cleanup ini.
4. **Review rencana migration/aktivasi dan konfigurasi environment** sebelum
   menjalankan finance smoke test di development/staging. Validasi apakah ada
   historical data; jangan seed/reset database sebagai jalan pintas.
5. **Jalankan staging/UAT dan rekonsiliasi**, lalu catat acceptance yang nyata,
   risiko yang tersisa, serta hasil backup/restore.
6. **Tutup gate FIN/REL berdasarkan bukti**, baru minta/ikuti persetujuan merge
   dan release. Jangan mengubah status hanya agar seluruh tiket terlihat DONE.

Tidak perlu memulai fitur ERP baru, memperluas ticket lifecycle/vendor report
yang sudah dinyatakan NOT NEEDED, atau mengulang seluruh tes/discovery tanpa
perubahan maupun ketidakpastian material yang membenarkannya.

## 9. Peta source dan bukti untuk reviewer

Semua path berikut relatif terhadap `C:/Development/logistik-web`.

| Area | Sumber utama |
|---|---|
| Scope dan urutan kerja | `AGENTS.md`, `docs/PRD.md`, `docs/ROADMAP.md` |
| Ticketing | `src/features/ticketing/`, `prisma/schema/ticketing.prisma` |
| Operational reports/dashboard | `src/features/reports/` |
| Finance | `src/features/finance/`, `src/app/(dashboard)/finance/`, `prisma/schema/finance.prisma` |
| Shared rights/navigation | `src/features/identity/permissions.ts`, `src/components/shell/` |
| Keputusan SUP/RPT terbaru | `docs/decisions/DEV3-SUP-RPT-FOLLOWUPS.md` |
| Review queue historis + disposition | `docs/decisions/DEV3-FINAL-REVIEW.md` |
| Kontrak finance yang diadopsi | `docs/decisions/FIN-01-contract.md`, `docs/decisions/FIN-02-contract.md` |
| Desain/implementasi finance | `docs/decisions/FIN-implementation.md` |
| Handoff release dan recovery | `docs/handoffs/DEV3-REL-01-finance.md` |
| Bukti finance | `docs/decisions/evidence/finance/verification.json`, `schema-diff.txt`, `viewports.json`, screenshots |
| Bukti SUP/RPT follow-up | `docs/decisions/evidence/dev3-sup-rpt-followups/verification.md` |
| Tes finance | `tests/integration/finance.test.ts`, `tests/unit/finance.test.ts`, `tests/unit/finance-pages.test.ts` |
| Current checkpoint | `docs/agent-state/dev3/STATE.md`, `HANDOFF.md`, `DECISIONS.md`, `RUN_LOG.md` |

Commit penting: `08042c1` SUP core; `723dce6` RPT-01; `d90b993` RPT-02;
`7245649` shared-lock hardening; `0130181` CSV; `8d25df1` snapshot hardening;
`b2808bf` FIN-01; `7997505` FIN-02; `92098c0`/`c6706ca` consolidation;
`b9d3adc` catatan lokasi/recovery branch gabungan.

Dokumen lama dapat memuat status sebelum implementasi atau sebelum approval.
Gunakan kronologi dan disposition terbaru: proposal FIN yang dulu belum disetujui
sudah diadopsi melalui A+B; follow-up RPT-03/RPT-04 yang dulu direncanakan sudah
diimplementasikan. Bukti historis tetap disimpan, tetapi bukan status aktif baru.

## 10. Recovery pekerjaan lokal yang tidak ikut branch siap push

Backup tersedia di:
`C:/Users/Administrator/.codex/backups/dev3-consolidation-20261115-120804`.

Isinya mencakup verified Git bundles, patch/raw copies/hash manifest WIP, paket
handoff MD/ZIP lama, metadata dan ignored environment/log/cache yang dipertahankan.
Data backup berada di luar repository dan bukan bagian yang akan dipush.

Enam file WIP lama juga dipertahankan dalam stash dan backup ref
`refs/backups/dev3-consolidation-wip-20261115` pada `676ecab`. Lima perubahan
ignore/policy yang relevan sudah diintegrasikan. Perubahan seed yang menampilkan
raw error tetap disimpan terpisah dan tidak masuk branch siap push.

**Jangan langsung `stash pop` seluruh WIP lama.** Jika suatu perubahan benar-benar
dibutuhkan, pulihkan file tertentu setelah menilai relevansi dan keamanannya.
File `.env`, credentials, session, dan data provider pribadi tidak boleh ikut PR
atau dibagikan ke ChatGPT sebagai lampiran analisis.

## 11. Permintaan analisis yang bisa digunakan bersama dokumen ini

> Berdasarkan konteks Dev3 ini, bantu susun langkah selanjutnya yang paling
> penting menuju combined PR dan REL-01. Pisahkan implementation gap yang benar-benar
> terbukti, gate human/staging yang masih terbuka, dan usulan enhancement di luar
> scope. Prioritaskan financial correctness, RBAC/branch isolation, concurrency,
> migration/activation dan rekonsiliasi. Jangan membuka ulang scope yang sudah
> diterima, meminta ulang adopsi A+B, atau menganggap fitur NOT NEEDED sudah dibuat.
> Jika diperlukan code review aktual, sebutkan file/diff tambahan paling kecil
> yang perlu diperiksa. Jangan mengklaim sudah mengaudit kode, mengecek remote,
> atau menjalankan staging hanya berdasarkan ringkasan ini.

Analisis awal dapat dilakukan dari file ini. Validasi bug spesifik dan acceptance
rilis tetap membutuhkan source/diff, environment, serta evidence terkait yang nyata.
