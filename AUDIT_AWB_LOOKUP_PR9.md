# Audit AWB Lookup (PR #9, branch devnanda, baseline 1f67df5)

## Scope
Fokus pada form lookup AWB dan server query `lookupTransactionByAwb` di `src/features/bookings/server/queries.ts`. Tidak mengubah authorization global, kontrak identity Dev 1, database constraint, atau modul di luar scope Dev 2 tanpa koordinasi.

## Kontrak Request-Response Lookup
### Request
- Action: `lookupTransactionAction` (`src/features/bookings/lookup-actions.ts:7-24`)
  - Memanggil `requirePermission("view", "transaction")` (butuh permission resource `transaction` action `view`)
  - Parse via `transactionLookupSchema` (`src/features/bookings/schemas.ts:140-143`): `awbNo` wajib, `originBranchId` opsional (coerced positive int)
- Query: `lookupTransactionByAwb(awbNo: string, originBranchId?: number)`

### Response
- Tidak ditemukan: query `null` -> action `{ found: false }`
- Ditemukan tunggal: action `{ found: true, data: { id, awbNo, status, transactionDate (YYYY-MM-DD), originBranchId, destinationBranchId } }`
- Ambiguitas (>1 hasil, tidak ada `originBranchId`): lempar `IdentityError("FORBIDDEN_BRANCH", 409, "AWB ditemukan di beberapa cabang asal. Pilih cabang asal untuk melanjutkan.")`
- Non-admin filter `originBranchId` di luar `branchIds`: lempar `IdentityError("FORBIDDEN_BRANCH", 403)`

### Catatan
- Soft delete difilter `deletedAt: null`
- Ordering deterministik: `orderBy: [{ transactionDate: "desc" }, { id: "desc" }]`
- Relasi di-load untuk konteks

## Sumber Pilihan Cabang pada UI
- `src/features/bookings/components/awb-lookup.tsx`: hanya input `awbNo`, tidak ada field `originBranchId`. UI perlu ditambah jika ingin menangani 409 secara user-friendly.
- Schema backend sudah mendukung `originBranchId` opsional.

## Cara Actor Memperoleh `branchIds`
- `getUserBranchScope()` mengembalikan `currentIdentity()?.actor.branchIds ?? []`
- `loadAccessActor` hanya mengambil `allowedBranches` dengan branch/office/company aktif dan tidak di-soft-delete
- Non-admin dengan branchIds kosong -> 403 via `requireNonEmptyBranchScope`

## Kaitan `originBranchId` dan `destinationBranchId`
- `Transaction` punya `originBranchId` (required) dan `destinationBranchId` (nullable). `@@unique([originBranchId, awbNo])` -> AWB bisa sama di origin berbeda.
- Admin: scope penuh, deteksi ambiguitas jika >1 dan tidak ada filter origin
- Non-admin: `OR: [{ originBranchId: { in: branchIds } }, { destinationBranchId: { in: branchIds } }]` -> bisa lihat jika cabang user adalah asal ATAU tujuan. Jika user memfilter `originBranchId` eksplisit, harus ada di `branchIds` (403 jika tidak). Jika >1 hasil dan tidak ada filter origin -> 409.

## Soft Delete
Difilter `deletedAt: null` di semua path lookup.

## Penanganan 409 dan 403
- 403: branchIds kosong (non-admin), filter `originBranchId` di luar scope (non-admin), atau gagal permission
- 409: ambiguitas multi-origin tanpa disambiguasi
- Not found -> `{ found: false }`

## Perbedaan Filter Cabang Asal vs Authorization Scope
- Filter `originBranchId` = disambiguasi di antara kandidat yang sudah dalam scope (atau semua untuk admin). Bukan pemberi akses.
- Authorization scope = visibilitas (asal ATAU tujuan untuk non-admin). Jika user menyebut origin di luar scope -> 403. Keduanya tidak disamakan.

## Skenario Cabang B mencari AWB123 (A->B atau C->B)
Keduanya masuk scope via `destinationBranchId == B`. Jika keduanya ada dan user tidak menyediakan `originBranchId`, sistem mengembalikan 409 (minta pilih cabang asal) untuk mencegah salah identifikasi. Ini sesuai dengan hardening PR #9.

## Rencana Perubahan Minimal
1. Query sudah di-harden (findMany + ordering + ambiguitas + validasi scope) - sesuai pola yang ada.
2. Action perlu mempertimbangkan handling error 409/403 dengan response yang ramah UI (opsional, minimal).
3. Form/UI perlu menambah kontrol `originBranchId` (dropdown) untuk menangani ambiguitas; backend sudah siap.
4. Tambah test untuk kasus multi-origin dengan akses via destination.

## Catatan Keputusan
Tidak ditemukan BLOCKED decision jelas. Perilaku asal ATAU tujuan sudah diimplementasikan dan konsisten dengan kebutuhan "pengguna cabang B harus dapat mencari AWB123 dan melihat kiriman A -> B maupun C -> B apabila kedua kiriman memang berada dalam scope aksesnya", dengan disambiguasi via origin saat ambiguitas untuk mencegah kesalahan identifikasi.
