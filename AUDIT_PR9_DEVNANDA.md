# AUDIT AWAL PR #9 - Branch devnanda (baseline 2fa5d03)

Tanggal audit: 2026-11-03  
Auditor: Claude Code (Glyph Cluster)  
Branch aktif: devnanda (clean)  
Baseline: 2fa5d03

## Konteks yang dibaca
- AGENTS.md (engineering rules, ownership, security, migration, DoD)
- docs/PRD.md (scope, decision log D-xx)
- docs/ROADMAP.md (phases, ownership Dev1/2/3)
- src/features/shipments/server/manifests-service.ts
- src/features/bookings/server/queries.ts
- src/features/bookings/lookup-actions.ts
- src/features/bookings/schemas.ts
- prisma/schema/sales.prisma (Transaction, Manifest, ManifestItem, DeliverySheet, DeliverySheetItem)
- tests/unit/authorization-booking-transaction-manifest-delivery.test.ts (baris ~296 relevan)
- migrations terkait manifest/delivery

## Temuan

### Temuan 1: Delivery masih menerima manifest yang sudah dihapus (deletedAt)
**Lokasi:**
- `src/features/shipments/server/manifests-service.ts:195-217` (recordDeliveryOutcome)
- `prisma/schema/sales.prisma:198-232` (Manifest memiliki `deletedAt` DateTime?)
- `prisma/schema/sales.prisma:234-251` (ManifestItem memiliki `deletedAt` DateTime?)

**Akar masalah:**
1. Pada `recordDeliveryOutcome`, sheet diambil dengan `findUnique({ where: { id }, include: { manifest: true } })` tanpa memfilter `sheet.manifest.deletedAt`. Manifest yang di-soft-delete (`deletedAt != null`) tetap bisa diakses jika DeliverySheet masih ada.
2. Pencarian `manifestItem` hanya memfilter `manifestId`, `transactionId`, `releasedAt: null` - tidak memfilter `manifestItem.deletedAt`. Model ManifestItem memiliki `deletedAt` (baris 246) namun tidak digunakan dalam query.
3. Berbeda dengan `assignTransactionToManifest` yang sudah memfilter `manifest.deletedAt: null` (baris 120-123). Konsistensi soft-delete belum diterapkan di delivery path.

**Alur reproduksi:**
1. Buat manifest aktif, assign transaction, buat delivery sheet.
2. Soft-delete manifest (`deletedAt = now()`) atau hapus secara logis.
3. Panggil `recordDeliveryOutcome` dengan deliverySheetId/transaksi terkait.
4. Saat ini kode tidak menolak - bisa mencatat outcome pada manifest yang sudah dihapus.

**File terdampak:**
- `src/features/shipments/server/manifests-service.ts` (recordDeliveryOutcome)
- Kemungkinan query lain yang mengakses manifest via delivery sheet

**Risiko data:**
- Audit trail rusak (delivery dicatat pada manifest yang sudah diarsipkan/dihapus)
- Pelanggaran prinsip soft-delete yang konsisten
- Potensi pelanggaran aturan bisnis (operasi pada entitas yang tidak aktif)

**Rencana perubahan minimal:**
1. Setelah load sheet+manifest, validasi `!sheet.manifest.deletedAt` → throw error (mis. `MANIFEST_DELETED` atau `IdentityError` sesuai konteks).
2. Tambahkan filter `deletedAt: null` pada `manifestItem` lookup.
3. Pertimbangkan validasi tambahan pada manifest status jika diperlukan (tetap konsisten dengan policy yang ada).
4. Tambah test case untuk skenario manifest terhapus.

### Temuan 2: Lookup AWB berpotensi mengembalikan transaksi yang salah ketika AWB sama terdapat pada beberapa cabang
**Lokasi:**
- `src/features/bookings/server/queries.ts:156-202` (lookupTransactionByAwb)
- `src/features/bookings/lookup-actions.ts:11` (memanggil tanpa validasi ambiguitas)
- `prisma/schema/sales.prisma:171` (`@@unique([originBranchId, awbNo])` - unik per originBranch, BUKAN global)
- `src/features/bookings/schemas.ts:140-143` (transactionLookupSchema - originBranchId opsional)

**Akar masalah:**
1. Constraint unik adalah `(originBranchId, awbNo)`, artinya AWB bisa sama persis di origin branch berbeda (valid secara skema).
2. `lookupTransactionByAwb` menggunakan `findFirst` tanpa `orderBy` yang deterministik. Jika `originBranchId` tidak disediakan, dan user memiliki akses ke beberapa cabang (atau admin), query bisa mengembalikan transaksi dari cabang yang salah.
3. Branch scope menggunakan `OR: [{originBranchId in branchIds}, {destinationBranchId in branchIds}]` - memperluas kandidat pencarian, meningkatkan risiko ambiguitas.
4. Tidak ada deteksi ambiguitas (banyak hasil) - hanya mengembalikan first match.

**Alur reproduksi:**
1. Ada Transaction A: awbNo="AWB123", originBranchId=1
2. Ada Transaction B: awbNo="AWB123", originBranchId=2 (diizinkan karena unique per originBranch)
3. User memiliki akses ke branch 1 dan 2, memanggil lookup tanpa originBranchId
4. `findFirst` bisa mengembalikan salah satu (tidak deterministik) - berpotensi salah menampilkan data transaksi

**File terdampak:**
- `src/features/bookings/server/queries.ts` (lookupTransactionByAwb)
- `src/features/bookings/lookup-actions.ts` (perlu handle ambiguitas)
- Schema UI/form lookup AWB

**Risiko data:**
- Salah identifikasi transaksi (operasi delivery/manifest bisa diarahkan ke AWB yang salah)
- Pelanggaran integritas operasional
- Risiko compliance/audit

**Rencana perubahan minimal:**
1. **Wajibkan `originBranchId`** jika ada potensi ambiguitas, atau ubah menjadi `findMany` dan deteksi jika > 1 hasil.
2. Jika tidak ada `originBranchId` dan hasil > 1 untuk user yang bersangkutan → return error/ambiguous (minta user pilih cabang asal).
3. Tambahkan `orderBy` yang deterministik jika memang harus `findFirst` (mis. `transactionDate desc`, `id desc`).
4. Pertimbangkan ubah schema untuk mewajibkan originBranchId pada lookup form, atau tambahkan validasi di service.
5. Tambah test untuk kasus AWB sama di beda cabang.

**Catatan:** Harus menghormati kontrak authorization (D-03/D-04) dan tidak mengubah constraint migration.

### Temuan 3: Fixture test administrator untuk keberhasilan delivery tidak sesuai dengan hasil conditional update
**Lokasi:**
- `tests/unit/authorization-booking-transaction-manifest-delivery.test.ts:288-304` (test "allows administrator per policy")
- `src/features/shipments/server/manifests-service.ts:254-276` (logic update existing deliverySheetItem)
- Test failure saat ini: `DELIVERY_OUTCOME_CONCURRENTLY_UPDATED` pada baris 274

**Akar masalah:**
Pada test line 296:
```ts
deliverySheetItem: { findUnique: vi.fn().mockResolvedValue({ id: 1 }), create: vi.fn().mockResolvedValue({ id: 1 }), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
```
Item sudah ada (`findUnique` returns object), `allowedItem.outcome` tidak terdefinisi (undefined). Code akan masuk cabang update (bukan create), cek final status - undefined bukan DELIVERED/RETURNED jadi lanjut. Lalu panggil `updateMany` dengan where condition yang mencakup `outcome: allowedItem.outcome ?? null` (jadi `outcome: null`) dan expect `count === 1`. Mock mengembalikan `count: 0`, sehingga throw `DELIVERY_OUTCOME_CONCURRENTLY_UPDATED`.

Fixture test tidak sesuai dengan ekspektasi conditional update. Ini adalah bug di fixture test, bukan di logic production - logic sudah benar (mencegah update concurrent dengan kondisi yang tepat).

**Alur reproduksi:**
Run test → gagal dengan error di atas.

**File terdampak:**
- `tests/unit/authorization-booking-transaction-manifest-delivery.test.ts` (perlu perbaiki fixture)

**Risiko data:**
- Test suite tidak hijau (regression test rusak)
- Bisa menyesatkan saat CI/check

**Rencana perubahan minimal:**
Ubah mock `updateMany` untuk `deliverySheetItem` menjadi `mockResolvedValue({ count: 1 })` pada test case ini. Pastikan state awal item konsisten (outcome undefined/null) dengan kondisi where clause.

```ts
deliverySheetItem: { 
  findUnique: vi.fn().mockResolvedValue({ id: 1, outcome: null }),
  create: vi.fn().mockResolvedValue({ id: 1 }), 
  updateMany: vi.fn().mockResolvedValue({ count: 1 })
},
```

## Pemeriksaan relasi & soft-delete convention
- Manifest: punya `deletedAt`, relasi ke Branch/Vehicle/Courier/User, items, deliverySheet
- ManifestItem: punya `deletedAt` (baris 246 sales.prisma), unique pada `transactionId` (satu transaksi hanya bisa diassign sekali), `releasedAt` untuk tracking release
- Transaction: punya `deletedAt`, relasi ke Booking/Branch/Courier/User, statusHistory, manifestItems, deliverySheetItems
- DeliverySheet: relasi ke Manifest (unique), punya items
- DeliverySheetItem: punya `deletedAt`, unique pada `(deliverySheetId, transactionId)`

Convention: soft delete digunakan (`deletedAt` nullable) konsisten dengan AGENTS.md. Namun belum semua path memfilter `deletedAt` dengan konsisten (Temuan 1).

## Authorization & contracts
- Mengacu D-03/D-04 (bounded v1) - Dev 1 contract
- Tidak menyentuh migration, database constraint, kontrak Dev 1, atau pekerjaan Dev 3
- Menghormati branch scope checks

## Status branch
- Aktif: devnanda ✓
- Clean working tree ✓
- Tidak ada perubahan lokal yang akan tertimpa

## Rekomendasi
1. **Prioritas tinggi:** Perbaiki Temuan 1 (security/data integrity) - tambahkan filter deletedAt
2. **Prioritas tinggi:** Perbaiki Temuan 2 (operational correctness) - cegah salah lookup AWB
3. **Prioritas rendah (test fix):** Perbaiki Temuan 3 agar test suite hijau

Semua perubahan direncanakan minimal, tidak ada refactor besar. Jika ada aturan domain yang belum jelas terkait Temuan 1/2, perlu BLOCKED decision, tapi berdasarkan kode dan schema saat ini perubahan di atas sesuai dengan pola yang sudah ada.
