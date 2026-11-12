# PR #9 — Staging Smoke Test Evidence (Dev 2)

**PR:** #9 `fix(dev2): authorization alignment for booking/transaction/manifest/delivery`  
**Branch:** `devnanda` → `main`  
**HEAD (commit):** `8de8d8ec71e274e2c9d50fc56df7b8022fb2d7c7` (`8de8d8e`)  
**Tanggal eksekusi:** _isi_  
**Tester:** _isi_  
**Environment / URL staging:** _isi_  
**Database/seed context (jika relevan):** _isi_  
**Catatan umum:** _isi_

> `npm run build` bukan pengganti staging smoke test. Isi `PASS/FAIL/BLOCKED/SKIP` + bukti (screenshot/log/catatan singkat). Uji jalur **allowed** dan **denied** (cross-branch/unauthorized) sesuai scope.

## Ringkasan hasil

| Area | Status | Catatan singkat |
|---|---|---|
| Authentication | ⏳ |  |
| Branch authorization | ⏳ |  |
| AWB lookup | ⏳ |  |
| Transaction creation | ⏳ |  |
| Delivery workflows | ⏳ |  |

## Checklist detail

| # | Area | Skenario | Langkah uji (ringkas) | Expected | Hasil | Evidence / Catatan |
|---|---|---|---|---|---|---|
| A1 | Authentication | Login user valid | Login dengan kredensial staging valid | Session terbentuk, redirect ke dashboard sesuai akses | ⏳ |  |
| A2 | Authentication | Akses tanpa sesi / sesi invalid | Buka route terproteksi (booking/transaction/manifest/delivery) tanpa login atau sesi expired | Ditolak/redirect ke auth, tidak ada data sensitif bocor | ⏳ |  |
| A3 | Authentication | Logout | Logout dari sesi aktif | Sesi berakhir; route terproteksi tidak dapat diakses tanpa login ulang | ⏳ |  |
| B1 | Branch authorization | Akses data dalam scope cabang | User non-admin cabang X membuka daftar/detail booking, transaksi, manifest, delivery milik cabang X | Data tampil sesuai scope; aksi diizinkan sesuai permission | ⏳ |  |
| B2 | Branch authorization | Tolak cross-branch (read/write) | User cabang X mencoba akses/detail/mutasi resource cabang Y (direct URL/action) | Ditolak (403/forbidden/empty-by-scope), tanpa partial write | ⏳ |  |
| B3 | Branch authorization | User tanpa cabang / admin behavior | Uji non-admin tanpa branch scope dan (jika berlaku) admin sesuai kontrak | Non-admin tanpa scope: deny/hasil kosong sesuai implementasi; admin mengikuti kontrak permission global (tidak bypass resource inventory) | ⏳ |  |
| C1 | AWB lookup | Pencarian AWB normal (single match, in-scope) | Cari AWB yang ada dalam scope cabang | Hasil benar (AWB, status, tanggal, cabang asal/tujuan, ID) | ⏳ |  |
| C2 | AWB lookup | Multi-match + disambiguasi cabang asal | Cari AWB dengan >1 match; pilih/filter cabang asal lalu cari ulang | Match/ambiguity jelas; hasil terfilter benar; tidak ada hasil usang | ⏳ |  |
| C3 | AWB lookup | Race/stale saat ubah input/filter (regresi PR #9) | Ubah AWB atau filter cabang asal saat request sebelumnya masih pending | Respons lama tidak menimpa hasil request terbaru; state konsisten | ⏳ |  |
| C4 | AWB lookup | Tidak ditemukan / out-of-scope | Cari AWB tidak ada atau milik cabang di luar scope | “Tidak ditemukan”/ditolak sesuai scope, tanpa kebocoran lintas cabang | ⏳ |  |
| D1 | Transaction creation | Buat transaksi valid (allowed branch) | Submit form transaksi dengan data & cabang asal/tujuan valid dalam scope | Transaksi tersimpan, status awal/history sesuai, tampil di daftar/detail | ⏳ |  |
| D2 | Transaction creation | Validasi & cabang tidak valid/out-of-scope | Submit tanpa field wajib, cabang invalid, atau cabang di luar scope | Validasi/server menolak; tidak ada partial write | ⏳ |  |
| D3 | Transaction creation | Idempotency / duplikasi AWB-key | Ulangi submit (double-click/retry) dengan payload sama & konflik key/AWB sesuai skenario | Tidak membuat duplikat tidak sah; replay/idempotent atau conflict yang benar | ⏳ |  |
| E1 | Delivery workflow | Outcome delivery valid (in-scope, anggota manifest/sheet) | Catat outcome pada transaksi valid dalam delivery sheet/manifest | Outcome tersimpan, status/transisi & history sesuai aturan | ⏳ |  |
| E2 | Delivery workflow | Tolak kasus tidak valid | Outcome untuk item bukan anggota manifest/sheet, out-of-scope, soft-deleted, atau outcome final/konflik | Ditolak dengan error sesuai; tidak ada perubahan data/status tidak sah | ⏳ |  |
| E3 | Delivery workflow | Konkuren/ulang aksi | Ulangi update outcome/status cepat/bersamaan (jika memungkinkan) | Guard konkuren/status transition mencegah overwrite tidak valid; state akhir konsisten | ⏳ |  |

## Bukti minimum yang diminta review
- [ ] Minimal 1 kasus **allowed** dan 1 kasus **denied** untuk branch authorization (dengan bukti).
- [ ] Bukti AWB lookup tidak menampilkan hasil usang saat filter/input berubah (regresi PR #9).
- [ ] Bukti alur: auth, branch authorization, AWB lookup, transaction creation, delivery workflows.

## Temuan / deviasi (jika ada)

| ID | Area | Deskripsi | Severity | Tindak lanjut |
|---|---|---|---|---|
|  |  |  |  |  |

## Kesimpulan

- **Keputusan:** ⏳ _PASS / FAIL / BLOCKED_
- **Ringkasan:** _isi_
- **D-08:** tetap TBD/BLOCKED (reassignment riwayat released fail-closed; tanpa perubahan schema/migrasi).
