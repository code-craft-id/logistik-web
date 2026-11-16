# Dev3 Legacy Navigation Inventory

## 1. Observation metadata

Observed 2026-11-16 (Asia/Bangkok), origin https://redlogistik.tracks-app.com/index.php/. Chrome DevTools Lab list_pages failed (connection refused at port 9333); connected Chrome browser via cua_repl successfully inspected existing authenticated tab. IVAN displayed; Administrator role supplied by user, effective role/permission matrix not independently established. DIRECT_NON_MUTATING_DISCOVERY is procedural, not enforced zero-write protection. No credentials inspected, business mutations or private records retained. Existing worktree changes preserved on codex/dev3-ready-for-review.

Evidence: live observations in this document are OBSERVED, not approved business rules. Historical LD evidence is explicitly attributed to docs/agent-state/dev3/REPORT_CATALOGUE.md and DISC-04.md. Current application mappings are source inspection, not a runtime or staging test. Report names do not prove calculations or equivalence.

## 2. Complete legacy navigation tree

Live expanded navigation (icons omitted; spelling preserved). All disclosure nodes have javascript:void(0), hence no destination URL. Leaf URL suffixes below resolve against the origin above. Visibility is established only for this session; role dependence remains unverified.

```text
Dashboard | /
Sistem Seting
  Grup User | group-user
  Manajemen User | user-management
  Hak Akses Menu | hak-akses-menu
Kantor
  Perusahaan | company
  Kantor Cabang | branch-offices
Master Data
  M. Logistik
    Area Logistik
      Provinsi | area
      Kabupaten | kabupaten
      Kecamatan | kecamatan
      Kelurahan | destination-branch
      Kode Pos | kode-pos
    Divisi Logistik
      Pemasaran | marketing
      Driver | driver
      Kurir | courier
    Layanan Logistik
      Moda | moda
      Kategori Layanan | service-category
      Layanan Pengantaran | services-delivery
      Jenis Barang | content-delivery
      Jenis Biaya | billing-type
      Termin | termin
    Kendaraan Logistik
      Jenis Kendaraan | vehicle-type
      Kendaraan | log-vehicles
      Jenis Trucking | jenis-trucking
  M. Vendor
    Vendor | vendors
    Layanan Vendor | services-vendor
  M.Shipment Status | mshipment-status
Modul
  Pemasaran/Penjualan
    Customer | customer
    Penerima | consignee
    Pendapatan Pelanggan | revenue-customer
  Layanan Pelanggan
    Transaksi
      On Site Outbound | on-site-add
      On Site Inbound | on-site-inbound
      Print AWB | print-awb
      Persetujuan Edit/delete AWB | approve-modified-awb
      Void Awb | void-awb
    Status Pengantaran | shipment-status
    Cek Ongkir | cek-ongkir
    Cek Resi | tracking
    Histori Edit Resi | history-edit-resi
    Booking | booking
    Inbound Booking | inbound-booking
    History Delete Resi | history-delete-shipment-status
  Operasional
    Manifest
      Cek Transit | chek-transit
      Cek Inbound | cek-inbound
      Cek Inbound Agen | cek-inbound-agen
      Print Manifest | print-manifest
    Lembar Pengantaran
      Kurir Kota | delivery-sheet
      Print DRS | print-city-courier
    POD Kembali | stt-kembali-operational
    Proses Vendor | proses-vendor
    Approval Pod Kembali | approval-pod-kembali
  Keuangan
    Piutang Dagang
      Invoice (New) | sales
    Hutang Dagang
      Pembayaran Hutang | debt-payments
Laporan-laporan
  Laporan Cabang
    Detail Transaksi | detail-transaction
    Rekap Transaksi | recaps-transactions
    Manifest Outbound | branch-manifest
    Rekap Manifest | branch-manifest-recaps
    Pengantaran | city-courier
    Gross Profit / Manifest | gross-profit-manifest
    Rekap Gross Profit | rekap-gross-profit
    Rekap Transaksi Harian | rekap-omzet-harian
    Manifest Vendor | manifest-vendor
    Awb Tertunda | awb-pending
    Awb Termanifest | awb-termanifest
    Rekap Customer Bulanan | rekap-customer-bl
    Rekap Omset Harian | rekap-omset-harian
    Detail Transaction Inbound | detail-transaksi-inbound
  Laporan Keuangan
    Laporan AR | sales-aging
    Laporan AP | ap-report
  Laporan Kurir
    Harian Kurir | daily-report-courier
    Laporan Detail Kurir | laporan-detail-kurir
  Reports Customer
    Pengiriman | pengiriman
    POD Kembali | pod-return
    Semua Status | all-status
  Report Customer | report-customer
Ticketing
  Tiket Support | ticketing-support
  Persetujuan Tiketing | approval-ticketing
Tutorial System
  List Tutorial | list-tutorial
```

## 3. Full menu index

| Menu path | Legacy URL | Entry type | Inspected | Notes |
|---|---|---|---|---|
| Dashboard | https://redlogistik.tracks-app.com/index.php/ | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Sistem Seting | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Sistem Seting > Grup User | https://redlogistik.tracks-app.com/index.php/group-user | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Sistem Seting > Manajemen User | https://redlogistik.tracks-app.com/index.php/user-management | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Sistem Seting > Hak Akses Menu | https://redlogistik.tracks-app.com/index.php/hak-akses-menu | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Kantor | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Kantor > Perusahaan | https://redlogistik.tracks-app.com/index.php/company | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Kantor > Kantor Cabang | https://redlogistik.tracks-app.com/index.php/branch-offices | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Area Logistik | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Area Logistik > Provinsi | https://redlogistik.tracks-app.com/index.php/area | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Area Logistik > Kabupaten | https://redlogistik.tracks-app.com/index.php/kabupaten | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Area Logistik > Kecamatan | https://redlogistik.tracks-app.com/index.php/kecamatan | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Area Logistik > Kelurahan | https://redlogistik.tracks-app.com/index.php/destination-branch | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Area Logistik > Kode Pos | https://redlogistik.tracks-app.com/index.php/kode-pos | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Divisi Logistik | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Divisi Logistik > Pemasaran | https://redlogistik.tracks-app.com/index.php/marketing | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Divisi Logistik > Driver | https://redlogistik.tracks-app.com/index.php/driver | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Divisi Logistik > Kurir | https://redlogistik.tracks-app.com/index.php/courier | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Layanan Logistik | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Layanan Logistik > Moda | https://redlogistik.tracks-app.com/index.php/moda | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Layanan Logistik > Kategori Layanan | https://redlogistik.tracks-app.com/index.php/service-category | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Layanan Logistik > Layanan Pengantaran | https://redlogistik.tracks-app.com/index.php/services-delivery | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Layanan Logistik > Jenis Barang | https://redlogistik.tracks-app.com/index.php/content-delivery | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Layanan Logistik > Jenis Biaya | https://redlogistik.tracks-app.com/index.php/billing-type | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Layanan Logistik > Termin | https://redlogistik.tracks-app.com/index.php/termin | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Kendaraan Logistik | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Kendaraan Logistik > Jenis Kendaraan | https://redlogistik.tracks-app.com/index.php/vehicle-type | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Kendaraan Logistik > Kendaraan | https://redlogistik.tracks-app.com/index.php/log-vehicles | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Logistik > Kendaraan Logistik > Jenis Trucking | https://redlogistik.tracks-app.com/index.php/jenis-trucking | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Vendor | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Master Data > M. Vendor > Vendor | https://redlogistik.tracks-app.com/index.php/vendors | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M. Vendor > Layanan Vendor | https://redlogistik.tracks-app.com/index.php/services-vendor | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Master Data > M.Shipment Status | https://redlogistik.tracks-app.com/index.php/mshipment-status | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Pemasaran/Penjualan | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Pemasaran/Penjualan > Customer | https://redlogistik.tracks-app.com/index.php/customer | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Pemasaran/Penjualan > Penerima | https://redlogistik.tracks-app.com/index.php/consignee | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Pemasaran/Penjualan > Pendapatan Pelanggan | https://redlogistik.tracks-app.com/index.php/revenue-customer | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Transaksi | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Transaksi > On Site Outbound | https://redlogistik.tracks-app.com/index.php/on-site-add | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Transaksi > On Site Inbound | https://redlogistik.tracks-app.com/index.php/on-site-inbound | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Transaksi > Print AWB | https://redlogistik.tracks-app.com/index.php/print-awb | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Transaksi > Persetujuan Edit/delete AWB | https://redlogistik.tracks-app.com/index.php/approve-modified-awb | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Transaksi > Void Awb | https://redlogistik.tracks-app.com/index.php/void-awb | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Status Pengantaran | https://redlogistik.tracks-app.com/index.php/shipment-status | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Cek Ongkir | https://redlogistik.tracks-app.com/index.php/cek-ongkir | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Cek Resi | https://redlogistik.tracks-app.com/index.php/tracking | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Histori Edit Resi | https://redlogistik.tracks-app.com/index.php/history-edit-resi | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Booking | https://redlogistik.tracks-app.com/index.php/booking | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > Inbound Booking | https://redlogistik.tracks-app.com/index.php/inbound-booking | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Layanan Pelanggan > History Delete Resi | https://redlogistik.tracks-app.com/index.php/history-delete-shipment-status | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Operasional > Manifest | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Operasional > Manifest > Cek Transit | https://redlogistik.tracks-app.com/index.php/chek-transit | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > Manifest > Cek Inbound | https://redlogistik.tracks-app.com/index.php/cek-inbound | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > Manifest > Cek Inbound Agen | https://redlogistik.tracks-app.com/index.php/cek-inbound-agen | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > Manifest > Print Manifest | https://redlogistik.tracks-app.com/index.php/print-manifest | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > Lembar Pengantaran | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Operasional > Lembar Pengantaran > Kurir Kota | https://redlogistik.tracks-app.com/index.php/delivery-sheet | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > Lembar Pengantaran > Print DRS | https://redlogistik.tracks-app.com/index.php/print-city-courier | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > POD Kembali | https://redlogistik.tracks-app.com/index.php/stt-kembali-operational | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > Proses Vendor | https://redlogistik.tracks-app.com/index.php/proses-vendor | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Operasional > Approval Pod Kembali | https://redlogistik.tracks-app.com/index.php/approval-pod-kembali | Navigation link | Link verified only | Session visibility only; role dependence unverified. |
| Modul > Keuangan | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Keuangan > Piutang Dagang | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Keuangan > Piutang Dagang > Invoice (New) | https://redlogistik.tracks-app.com/index.php/sales | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Modul > Keuangan > Hutang Dagang | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Modul > Keuangan > Hutang Dagang > Pembayaran Hutang | https://redlogistik.tracks-app.com/index.php/debt-payments | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Detail Transaksi | https://redlogistik.tracks-app.com/index.php/detail-transaction | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Rekap Transaksi | https://redlogistik.tracks-app.com/index.php/recaps-transactions | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Manifest Outbound | https://redlogistik.tracks-app.com/index.php/branch-manifest | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Rekap Manifest | https://redlogistik.tracks-app.com/index.php/branch-manifest-recaps | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Pengantaran | https://redlogistik.tracks-app.com/index.php/city-courier | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Gross Profit / Manifest | https://redlogistik.tracks-app.com/index.php/gross-profit-manifest | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Rekap Gross Profit | https://redlogistik.tracks-app.com/index.php/rekap-gross-profit | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Rekap Transaksi Harian | https://redlogistik.tracks-app.com/index.php/rekap-omzet-harian | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Manifest Vendor | https://redlogistik.tracks-app.com/index.php/manifest-vendor | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Awb Tertunda | https://redlogistik.tracks-app.com/index.php/awb-pending | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Awb Termanifest | https://redlogistik.tracks-app.com/index.php/awb-termanifest | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Rekap Customer Bulanan | https://redlogistik.tracks-app.com/index.php/rekap-customer-bl | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Rekap Omset Harian | https://redlogistik.tracks-app.com/index.php/rekap-omset-harian | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Cabang > Detail Transaction Inbound | https://redlogistik.tracks-app.com/index.php/detail-transaksi-inbound | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Keuangan | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Keuangan > Laporan AR | https://redlogistik.tracks-app.com/index.php/sales-aging | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Keuangan > Laporan AP | https://redlogistik.tracks-app.com/index.php/ap-report | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Kurir | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Kurir > Harian Kurir | https://redlogistik.tracks-app.com/index.php/daily-report-courier | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Laporan Kurir > Laporan Detail Kurir | https://redlogistik.tracks-app.com/index.php/laporan-detail-kurir | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Reports Customer | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Laporan-laporan > Reports Customer > Pengiriman | https://redlogistik.tracks-app.com/index.php/pengiriman | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Reports Customer > POD Kembali | https://redlogistik.tracks-app.com/index.php/pod-return | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Reports Customer > Semua Status | https://redlogistik.tracks-app.com/index.php/all-status | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Laporan-laporan > Report Customer | https://redlogistik.tracks-app.com/index.php/report-customer | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Ticketing | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Ticketing > Tiket Support | https://redlogistik.tracks-app.com/index.php/ticketing-support | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Ticketing > Persetujuan Tiketing | https://redlogistik.tracks-app.com/index.php/approval-ticketing | Navigation link | Opened | Session visibility only; role dependence unverified. |
| Tutorial System | javascript:void(0) | Disclosure | Expanded | Session visibility only; role dependence unverified. |
| Tutorial System > List Tutorial | https://redlogistik.tracks-app.com/index.php/list-tutorial | Navigation link | Link verified only | Session visibility only; role dependence unverified. |


## 4. Dev3 detailed page inventory

Shared conventions: default observation day 2026-11-16; month selectors November/2026. An initial parameter-only page is not evidence that result columns or records are absent. Search, sortable headers and pagination describe visible affordances unless a query was actually executed. Creation/payment/approval controls are documented but never submitted. Empty financial results cannot establish formula semantics. See individual entries below.

Coverage: 8 top-level entries, 95 nested entries (disclosures included); 77 destination links in the sidebar. Dashboard shortcuts are separate.

### LP-R01: Laporan-laporan > Laporan Cabang > Detail Transaksi — `detail-transaction`

- **Title / URL:** Kelola Detail Transaksi; https://redlogistik.tracks-app.com/index.php/detail-transaction. Entry: sidebar path above.
- **Purpose:** Detail Transaksi report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Periode pair; Asal=Semua Asal; Tujuan=Semua Tujuan; Pelanggan=Semua Pelanggan; Jenis Biaya=Semua Pembayaran; Moda=Semua Moda; Status=Semua Status; Cari; Ekspor; Refresh.
- **Columns, in order:** AWB No.; tanggal; Moda; Servis; Asal; Tujuan; Pengirim; Penerima Barang; Koli; Kilo; Deskripsi; Status Pengiriman; Komentar; Diterima Oleh
- **Observed result:** Initial current-day Processing; existing historical query populated, Showing 1 to 16 of 82,201 entries; not reconciled.
- **Related views / limits:** RPT-01 source-backed bounded report; missing transport/service and legacy billing meanings not guessed. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R02: Laporan-laporan > Laporan Cabang > Rekap Transaksi — `recaps-transactions`

- **Title / URL:** Rekap Transaksi; https://redlogistik.tracks-app.com/index.php/recaps-transactions. Entry: sidebar path above.
- **Purpose:** Rekap Transaksi report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Bulan=November; year=2026; Cabang=JAKARTA; Jenis Lembar=-- Multiple Sheet --; Ekspor Excel.
- **Columns, in order:** Not exposed in parameter-only initial view; output unverified.
- **Observed result:** Parameter-only view.
- **Related views / limits:** No dedicated implemented recap route established; daily turnover is distinct. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R03: Laporan-laporan > Laporan Cabang > Manifest Outbound — `branch-manifest`

- **Title / URL:** Manifes Cabang; https://redlogistik.tracks-app.com/index.php/branch-manifest. Entry: sidebar path above.
- **Purpose:** Manifest Outbound report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Tanggal=2026-11-16; Cabang=JAKARTA; Daftar Manifes.
- **Columns, in order:** Manifes No.; Tanggal; Asal; Tujuan; Penjual; Tot. AWB; Tot. Koli; Tot. Berat; Tot. Volume; Tot. Biaya (Rp.); Kendaraan; Sopir; Status; Aksi
- **Observed result:** Header-only table; no row detail available.
- **Related views / limits:** RPT-02 operational inventory; vendor/cost/driver semantics not equivalent. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R04: Laporan-laporan > Laporan Cabang > Rekap Manifest — `branch-manifest-recaps`

- **Title / URL:** Recaps Manifest; https://redlogistik.tracks-app.com/index.php/branch-manifest-recaps. Entry: sidebar path above.
- **Purpose:** Rekap Manifest report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Bulan=November; year=2026; Cabang=JAKARTA; Ekspor Excel.
- **Columns, in order:** Not exposed in parameter-only initial view; output unverified.
- **Observed result:** Parameter-only view.
- **Related views / limits:** No dedicated source-backed manifest recap found. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R05: Laporan-laporan > Laporan Cabang > Pengantaran — `city-courier`

- **Title / URL:** Cari Kurir Kota / Daftar Kurir Kota; https://redlogistik.tracks-app.com/index.php/city-courier. Entry: sidebar path above.
- **Purpose:** Pengantaran report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Select Searching; Search; Refresh; local Search; size 10/25/50/100; Previous/Next.
- **Columns, in order:** Tanggal; DRS No.; Cabang; Kurir; Tot. AWB; Tot. Progress; Tot. Sukses; Tot. Gagal; Tot. Koli; Tot. Berat; Tot. Volume; Tot. Biaya (Rp.); Status; Aksi
- **Observed result:** Showing 0 to 0 of 0 entries; sortable headers.
- **Related views / limits:** RPT-02 stored sheets/items; legacy report is per DRS; item view separate. Generation remains OPS-03. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R06: Laporan-laporan > Laporan Cabang > Gross Profit / Manifest — `gross-profit-manifest`

- **Title / URL:** Gross Profit / Manifests; https://redlogistik.tracks-app.com/index.php/gross-profit-manifest. Entry: sidebar path above.
- **Purpose:** Gross Profit / Manifest report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** November; 2026; Status initially Select Status ...; expanded Destination/Transit/Vendor; Show; Refresh; result Search; size 10/25/50/100; Previous/Next.
- **Columns, in order:** Manifest No.; Tanggal; Tujuan; Tot. AWB; Tot. Koli; Tot. Kg; Tot. Volume; Tot. Biaya (Rp.); kendaraan; Driver; Aksi
- **Observed result:** Destination Show query empty; no profit amount/formula established.
- **Related views / limits:** Old route is preview; FIN transaction GP uses adopted accounting policy, not manifest GP parity. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R07: Laporan-laporan > Laporan Cabang > Rekap Transaksi Harian — `rekap-omzet-harian`

- **Title / URL:** Rekap Transaksi Harian; https://redlogistik.tracks-app.com/index.php/rekap-omzet-harian. Entry: sidebar path above.
- **Purpose:** Rekap Transaksi Harian report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Tanggal=2026-11-16; Cabang=JAKARTA; Cetak.
- **Columns, in order:** Not exposed in parameter-only initial view; output unverified.
- **Observed result:** Parameter-only print view; print skipped.
- **Related views / limits:** Distinct route from rekap-omset-harian; no proven counterpart. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R08: Laporan-laporan > Laporan Cabang > Rekap Gross Profit — `rekap-gross-profit`

- **Title / URL:** Rekap Gross Profit; https://redlogistik.tracks-app.com/index.php/rekap-gross-profit. Entry: sidebar path above.
- **Purpose:** Rekap Gross Profit report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Periode Date Start/End=2026-11-16; Branch Origin displays -- All Destination --; Nopol=-- All Nopol --; Show; Export Excel; Refresh; result Search; size 10/25/50/100; Previous/Next.
- **Columns, in order:** No. Polisi; No. Manifests; Tujuan; Driver; Tgl. Manifests; Dibuat Oleh
- **Observed result:** Current-day Show empty. Origin/destination label mismatch preserved.
- **Related views / limits:** Preview survives; FIN monthly transaction GP recap has different grouping/source. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R09: Laporan-laporan > Laporan Cabang > Manifest Vendor — `manifest-vendor`

- **Title / URL:** Penjual Manifes; https://redlogistik.tracks-app.com/index.php/manifest-vendor. Entry: sidebar path above.
- **Purpose:** Manifest Vendor report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** November; 2026; Penjual=Pilih Penjual...; Pengguna=Pilih Pengguna...; Daftar Manifes.
- **Columns, in order:** Not exposed in parameter-only initial view; output unverified.
- **Observed result:** No result columns or explicit query button exposed.
- **Related views / limits:** RPT-02/RPT-05 document missing trustworthy vendor association; unavailable state deliberate. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R10: Laporan-laporan > Laporan Cabang > Awb Tertunda — `awb-pending`

- **Title / URL:** AWB Pending Manifest; https://redlogistik.tracks-app.com/index.php/awb-pending. Entry: sidebar path above.
- **Purpose:** Awb Tertunda report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Semua Tujuan; Cari; Ekspor Excel; Refresh; local Search.
- **Columns, in order:** AWB Koli No.; AWB No.; DO No.; Tanggal; Tujuan; Moda; Koli; Berat; Volume; Total Biaya
- **Observed result:** Processing at initial capture; settled membership unverified.
- **Related views / limits:** Shared AWB preview is not real pending membership. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R11: Laporan-laporan > Laporan Cabang > Awb Termanifest — `awb-termanifest`

- **Title / URL:** AWB TerManifes; https://redlogistik.tracks-app.com/index.php/awb-termanifest. Entry: sidebar path above.
- **Purpose:** Awb Termanifest report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** November; 2026; Semua Pengguna; Semua Tujuan; Cari; Ekspor Excel; Refresh; local Search.
- **Columns, in order:** AWB No.; DO No.; Manifes No.; Tanggal; Tujuan; Moda; Koli; Berat; Volume; Total Biaya
- **Observed result:** Processing at initial capture; settled membership unverified.
- **Related views / limits:** Shared AWB preview does not prove manifested membership/history. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R12: Laporan-laporan > Laporan Cabang > Rekap Customer Bulanan — `rekap-customer-bl`

- **Title / URL:** Rekap Pelanggan Bl; https://redlogistik.tracks-app.com/index.php/rekap-customer-bl. Entry: sidebar path above.
- **Purpose:** Rekap Customer Bulanan report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** November; 2026; Cabang=JAKARTA; Ekspor Excel.
- **Columns, in order:** Not exposed in parameter-only initial view; output unverified.
- **Observed result:** Parameter-only view.
- **Related views / limits:** Preview only; totals unimplemented by matching labels. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R13: Laporan-laporan > Laporan Cabang > Rekap Omset Harian — `rekap-omset-harian`

- **Title / URL:** Rekap Omset Harian; https://redlogistik.tracks-app.com/index.php/rekap-omset-harian. Entry: sidebar path above.
- **Purpose:** Rekap Omset Harian report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** November; 2026; Cabang=JAKARTA; Ekspor Excel.
- **Columns, in order:** Not exposed in parameter-only initial view; output unverified.
- **Observed result:** Parameter-only view.
- **Related views / limits:** Preview only; distinct from daily transaction print recap. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R14: Laporan-laporan > Laporan Cabang > Detail Transaction Inbound — `detail-transaksi-inbound`

- **Title / URL:** Kelola Detail Transaksi; https://redlogistik.tracks-app.com/index.php/detail-transaksi-inbound. Entry: sidebar path above.
- **Purpose:** Detail Transaction Inbound report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** November; 2026; Asal/Tujuan/Pelanggan/Pembayaran/Moda/Status all defaults; Jenis Lembar=-- One Sheet --; Cari; Ekspor; Refresh.
- **Columns, in order:** AWB No.; tanggal; Moda; Servis; Asal; Tujuan; Pengirim; Penerima Barang; Koli; Kilo; Deskripsi; Status Pengiriman; Komentar; Diterima Oleh
- **Observed result:** Processing at initial capture; inbound event/date semantics unverified.
- **Related views / limits:** Preview only; same headers do not establish inbound semantics. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R15: Laporan-laporan > Laporan Kurir > Harian Kurir — `daily-report-courier`

- **Title / URL:** List Daily Report Courier; https://redlogistik.tracks-app.com/index.php/daily-report-courier. Entry: sidebar path above.
- **Purpose:** Harian Kurir report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Date Start/End=2026-11-16; Export; Search; Refresh; local Search.
- **Columns, in order:** Nama Kurir; Jumlah Terambil; Jumlah Miss Pickup
- **Observed result:** Processing at initial capture; no settled result claim.
- **Related views / limits:** Combined courier preview; pickup/miss event source unestablished. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R16: Laporan-laporan > Laporan Kurir > Laporan Detail Kurir — `laporan-detail-kurir`

- **Title / URL:** Laporan Detail Kurir; https://redlogistik.tracks-app.com/index.php/laporan-detail-kurir. Entry: sidebar path above.
- **Purpose:** Laporan Detail Kurir report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Periode pair; Branch=Semua Asal; Kurir=-- Semua Kurir --; Status=-- All Status --; Cari; Ekspor; Refresh.
- **Columns, in order:** DRS No.; AWB No; Kurir; Tanggal; Asal; Tujuan; Pengirim; Layanan; Status; Penerima; Diterima Oleh; Tgl. Diterima; Acc. in; L.Time; SLA
- **Observed result:** Empty table; Tot. Sukses/Pending/Failed each 0; sortable headers.
- **Related views / limits:** Preview only; SLA/lead-time semantics unverified. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R17: Laporan-laporan > Laporan Keuangan > Laporan AR — `sales-aging`

- **Title / URL:** Daftar Rekap Penjualan Aging; https://redlogistik.tracks-app.com/index.php/sales-aging. Entry: sidebar path above.
- **Purpose:** Laporan AR report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Cari textbox; November; 2026; Pelanggan=Semua; Ekspor Excel; Menunjukan; Refresh; Belum Lunas/Lunas tabs.
- **Columns, in order:** Tanggal Invoice; No. KWT/INV; Pelanggan; Ketentuan; Status; [blank]; Penerima
- **Observed result:** Menunjukan executed; both tabs empty, same seven headers.
- **Related views / limits:** AR preview remains; FIN invoice/receipt policy is not proven legacy aging parity. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R18: Laporan-laporan > Laporan Keuangan > Laporan AP — `ap-report`

- **Title / URL:** Daftar Rekap Laporan AP; https://redlogistik.tracks-app.com/index.php/ap-report. Entry: sidebar path above.
- **Purpose:** Laporan AP report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Cari textbox; November; 2026; Penjual=Semua; Ekspor Excel; Menunjukan; Belum Lunas/Lunas tabs.
- **Columns, in order:** Penjual; No. Faktur; Tanggal; Status; Tot. Biaya
- **Observed result:** Menunjukan executed; both tabs empty, same five headers.
- **Related views / limits:** AP preview; supplier settlement excluded from FIN. Accrued liability is not a payment workflow. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R19: Laporan-laporan > Reports Customer > Pengiriman — `pengiriman`

- **Title / URL:** Report Pengiriman; https://redlogistik.tracks-app.com/index.php/pengiriman. Entry: sidebar path above.
- **Purpose:** Pengiriman report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Periode pair; Customer=Semua Customer; Destination=ALL DESTINATION; Search; Export; Refresh; local Search.
- **Columns, in order:** AWB No .; Date; DO No. / Reff; Moda; Service; Origin; Destination; Shipper; Consignee; Koli; Kilo; Description; Shipment Status; Received by; Received Date
- **Observed result:** Empty table, sortable headers.
- **Related views / limits:** Combined customer preview, not source-backed shipment report. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R20: Laporan-laporan > Reports Customer > POD Kembali — `pod-return`

- **Title / URL:** Report POD Return; https://redlogistik.tracks-app.com/index.php/pod-return. Entry: sidebar path above.
- **Purpose:** POD Kembali report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Periode pair; Semua Asal/Tujuan/Customer; Search; Export; Refresh; local Search.
- **Columns, in order:** AWB; AWB Date; Destination; Consignee; Reff No; Received By; Received Date; Status AWB; Remarks
- **Observed result:** Empty indicator with Processing also present; settled result unverified.
- **Related views / limits:** Preview; delivery outcome cannot prove POD-return event. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R21: Laporan-laporan > Reports Customer > Semua Status — `all-status`

- **Title / URL:** Report All Status; https://redlogistik.tracks-app.com/index.php/all-status. Entry: sidebar path above.
- **Purpose:** Semua Status report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Periode pair; Asal/Tujuan/Customer/Pembayaran/Status all defaults; Search; Export; Refresh; size 10/25/50/100; local Search; Previous/Next.
- **Columns, in order:** AWB; Date; Moda; Service; Origin; Destination; Shipper; Consignee; Koli; Kilo; Description; Shipment Status; Received by; No Manifest
- **Observed result:** Empty table; Total POD/AWB, Total Kilo/Kg, Total Koli/Pieces labels, not reconciled totals.
- **Related views / limits:** Preview, not source-backed all-status scope/totals. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### LP-R22: Laporan-laporan > Report Customer — `report-customer`

- **Title / URL:** Report Customer; https://redlogistik.tracks-app.com/index.php/report-customer. Entry: sidebar path above.
- **Purpose:** Report Customer report (label interpretation; business semantics unconfirmed).
- **Controls / sections:** Periode Date Start/End; Origin=-- All Origin --; Destination=-- All Destination --; Customer=-- All Customer --; Billing Type=-- All Billing Type --; Export Excel.
- **Columns, in order:** Not exposed in parameter-only initial view; output unverified.
- **Observed result:** Parameter-only standalone report.
- **Related views / limits:** Shared preview is not a verified standalone export equivalent. Export unverified; row workflows not executed. Other dropdown values/validation not exhaustively inspected.

### Shared date selector and query evidence

Report Customer Start Date calendar exposed Indonesian months Januari–Desember and initially years 2016–2036 around selected 2026. Selecting 2016 shifted the available years to 2006–2026. Thus 2016 is a moving selector-window edge, **not an earliest selectable date**. No absolute minimum exposed or established. No historical coverage inferred. Current-day period defaults elsewhere are 2026-11-16; dashboard range defaults are 2026-11-01 through 2026-11-16.

The pre-existing populated Detail Transaksi query was `detail-transaction?startDate=2016-11-01&endDate=2026-11-16&Asal=0&Tujuan=0&Customer=0&Jenis_Biaya=0&ModaBy=0&inv_status=0&smuNo=&form=1&submit=Cari`. It was already loaded, not newly submitted by this observer. Populated output establishes neither earliest record date nor complete coverage. No random historical scanning performed.

Executed bounded GP query: `gross-profit-manifest?bulan=11&tahun=2026&status=1&show=Show` (Destination), empty. Rekap GP Show retained current-day dates/all destinations/all plates and returned six columns. AR/AP Menunjukan and tab switching were read-only displays; exact resulting query strings were not captured, so none invented. Historical LD042 in REPORT_CATALOGUE records Status options Semua Status/Paid/Unpaid/Invoiced/Uninvoiced and Paid → `inv_status=Closed`; these are billing filters, not the Status Pengiriman output column. That option test was not repeated here.

### Dashboard — Dashboard — `/index.php/`

URL https://redlogistik.tracks-app.com/index.php/. Date range 2026-11-01–2026-11-16; November/2026; Semua Cabang. Dashboard year options 2020–2026 differ from the calendar widget. Refresh and per-section refresh controls. Quick Action exposes Booking, Entry AWB, Manifest, Transit, Inbound Manifest, Delivery Sheet, Shipment Status, Invoice, Invoice Paid, Tracking AWB, Report Detail Transaksi, Rekap Transaksi, Report AR, and Atur Menu (settings action skipped).

Sections: Quick Action; AI Executive Insight; AI Executive Summary; Rekomendasi AI; Notifikasi Penting; KPI Summary; Analytics & Operational Status; Grafik Penjualan; Top 5 Customer (Revenue Bulan Ini); Shipment Status; Aktivitas Terbaru; POD Outstanding Manifest; Pengumuman. Initial Memuat... states settled to content. KPI labels: Total Transaksi, Total Shipment Success, Delivery, AWB Pending, Invoice Outstanding, Piutang. Shipment groups: Delivered / Success, On Delivery, Failed / Return, Pending. No totals/formulas reconciled. Recent activity record identifiers intentionally omitted. No AI/settings action invoked.

In-page shortcuts supplement the sidebar. Plain URL suffixes: Booking `booking`; Entry AWB `on-site-add/tambah`; Manifest `manifests`; Transit `chek-transit`; Inbound Manifest `cek-inbound`; Delivery Sheet `delivery-sheet`; Shipment Status `shipment-status`; Invoice `sales`; Tracking AWB `tracking`. These are verified links only unless separately catalogued; no creation workflow entered from them.

Shared query context observed in the parameterized dashboard shortcuts:

```text
dashboard_date=2026-11-16&dashboard_start_date=2026-11-01&dashboard_end_date=2026-11-16&start_date=2026-11-01&end_date=2026-11-16&dashboard_month=11&dashboard_year=2026&branch_id=0&dashboard_branch=0
```

The exact URL is the origin plus destination, `?`, shared context, `&`, and suffix below. This compact notation records observed links; it does not prove their filters work.

| In-page link | Destination | Additional suffix | Inspected |
|---|---|---|---|
| Invoice Paid | sales | status=paid&invoice_status=Closed&dashboard=invoice-paid | Base page only |
| Report Detail Transaksi | detail-transaction | dashboard=detail-transaksi | Base and pre-existing historical query |
| Rekap Transaksi | recaps-transactions | dashboard=rekap-transaksi | Base only |
| Report AR | sales-aging | dashboard=ar-report | Base and November display query |
| AWB Pending notification | awb-pending | status=pending&dashboard=awb-pending | Base only |
| Shipment Pending notification | on-site-add | status=pending&dashboard=shipment-on-delivery | Link only |
| Invoice Outstanding notification | sales | status=unpaid&invoice_status=Open&dashboard=invoice-outstanding#card_sales | Base only |
| Failed / Return notification | shipment-status | status=failed-return&dashboard=failed-return | Link only |
| Delivery Sheet notification | delivery-sheet | dashboard=delivery-sheet#card_delivery_sheet | Link only |
| Piutang notification | sales | status=unpaid&invoice_status=Open&dashboard=piutang&show=Menunjukan#card_sales | Base only |

KPI links additionally contain `month=11&bulan=11&year=2026&tahun=2026&date=2026-11-16&tanggal=2026-11-16`. Analytics links below contain only the month/year extras. Their final suffixes:

| Link | Destination | Final suffix | Extra keys |
|---|---|---|---|
| Total Transaksi | on-site-add | dashboard=total-transaksi | KPI |
| Total Shipment Success | shipment-status | status=delivered&dashboard=delivered | KPI |
| Delivery | delivery-sheet | dashboard=delivery#card_delivery_sheet | KPI |
| AWB Pending KPI | awb-pending | status=pending&dashboard=awb-pending | KPI |
| Invoice Outstanding KPI | sales | status=unpaid&invoice_status=Open&dashboard=invoice-outstanding#card_sales | KPI |
| Piutang KPI | sales | status=unpaid&invoice_status=Open&dashboard=piutang&show=Menunjukan#card_sales | KPI |
| Lihat Semua Customer | revenue-customer | dashboard=top-customer&sort=revenue | Analytics |
| Delivered / Success | shipment-status | status=delivered&dashboard=shipment-delivered | Analytics |
| On Delivery | shipment-status | status=on-delivery&dashboard=shipment-on-delivery | Analytics |
| Failed / Return | shipment-status | status=failed-return&dashboard=failed-return | Analytics |
| Pending | awb-pending | status=pending&dashboard=shipment-pending | Analytics |
| Lihat Detail | shipment-status | dashboard=shipment-status | Analytics |
| Lihat Semua POD | shipment-status | dashboard=pod-outstanding | Analytics |

Lihat Semua Aktivitas links to `https://redlogistik.tracks-app.com/modul/home/dashboard_activity.php?` plus shared context and `&dashboard=activity` (link verified, outside approved index.php navigation scope, not opened). Lihat Semua Pengumuman links to `https://redlogistik.tracks-app.com/` (not opened). Recent activity links use `tracking/view/[private-id]#tracking`; identifiers redacted. No page behavior inferred from these links. Current `/dashboard` renders the RPT-02 operational target, not the live AI/finance dashboard above.

### Modul > Pemasaran/Penjualan > Pendapatan Pelanggan — `revenue-customer`

URL https://redlogistik.tracks-app.com/index.php/revenue-customer. Title/section List Pelanggan, home breadcrumb. November/2026 selectors and Search. Columns: No.; List Pelanggan; Total Pendapatan; Growth. Initial Processing; settled rows and growth/revenue formulas unverified. Dashboard Top 5 Customer links here. No dedicated implemented revenue equivalent established.

### Modul > Keuangan > Piutang Dagang > Invoice (New) — `sales`

URL https://redlogistik.tracks-app.com/index.php/sales. Sections Tambah Invoice, Daftar Invoice. Form: Customers (Pilih Customers); Invoice No (Auto Generate When Submit); Manual; Tgl. Dibuat (2026-11-16); Termin; Deskripsi (Description); Submit. Form/Manual skipped. List: Search textbox; Select Searching; Search button; Refresh; Export. Ordered columns Customer; Invoice No; Tgl. Dibuat; Tgl. Diterima; Termin; Tgl. Pengingat; Status; Tgl. Tutup; Tot. AWB; Action. Empty result; populated invoice detail/payment/history unverified. Dashboard paid/outstanding links do not prove payment workflow. Current `/finance/invoices`, `/finance/invoices/new`, `/finance/invoices/[id]` implement adopted manual IDR billing/issue/void/receipt/reversal policy; PARTIAL parity.

### Modul > Keuangan > Hutang Dagang > Pembayaran Hutang — `debt-payments`

URL https://redlogistik.tracks-app.com/index.php/debt-payments. Sections Tambah Pembayaran Hutang, Daftar Invoice. Form: Kategori (--Please Select--); Tanggal Buat (2026-11-16); Invoice No. (Auto Generate When Submit); Manual; Submit. Form actions skipped. Search textbox; Select Searching; Search; Refresh. Columns Kategori; Vendor; Invoice No; Tanggal Dibuat; Tanggal Diterima; Term; Tgl. Pengingat; Status; Tanggal Tutup; Tot. AWB; Action. Empty result; payment/detail/history not established. FIN-02 accrued supplier liability does not implement settlement.

### Ticketing > Tiket Support — `ticketing-support`

URL https://redlogistik.tracks-app.com/index.php/ticketing-support. Title Add Ticketing despite list content. Select Searching; Search button; Refresh; Add link to `ticketing-support/tambah`; local Search textbox. Columns Date; No. Ticket; Judul; Link URL; Status; Approval; Approve By; Action. One existing row, content omitted. Eye detail opened; no status/approval action executed. Current `/ticketting` and `/ticketting/[id]` implement accepted SUP-01 creator/current-branch subset with explicit administrator scope; no approval/lifecycle/attachment parity claim.

### Ticketing > Tiket Support > Add — `ticketing-support/tambah`

URL https://redlogistik.tracks-app.com/index.php/ticketing-support/tambah. Title Add Ticketing. Fields in order Date (2026-11-16); Priority (Pilih Priority....); Subject; Upload File / Choose File; Nama Menu; Picture (ex: 1) + Detail button; URL; Remarks; submit; Back to list. No input/upload/Detail/submit. Historical LD036 observed Low/Normal/High, not re-expanded here. Current `/ticketting/new` implements accepted basic fields/priority; attachments/Picture/lifecycle intentionally deferred.

### Ticketing > Tiket Support > eye detail — `ticketing-support/chat/[id]`

Existing ordinary detail link opened; private ID deliberately redacted. Title Edit Ticketing. Date; disabled Priority (Normal); Subject; Upload File / Choose File; existing attachment link; Nama Menu; Picture (ex: 1) + Detail; URL; Remarks; Back. Field values/attachment filename omitted; attachment not opened. Historical LD020 identified readonly basic fields; this visit confirmed presence without testing editability. No separate history/comments/assignment/reopen control established. Current `/ticketting/[id]` is PARTIAL. Redaction is deliberate sanitation, not a guessed URL.

### Ticketing > Persetujuan Tiketing — `approval-ticketing`

URL https://redlogistik.tracks-app.com/index.php/approval-ticketing. Title Approval Ticketing; Search textbox. Columns Judul; Nama Menu; Link URL; Action. Empty table, no populated approval/history detail available. No standalone current approval route; intentionally deferred by SUP-01 scope. Empty list does not prove absence of approval workflows.

### Accounting / ledger / category / cashflow / P&L legacy discovery

No such sidebar destination exposed after recursive expansion of all eight top-level entries. No URL guessed. Legacy accounting pages remain UNVERIFIED, not proven absent globally. Current `/finance/accounting` and accounts/journals/costs/periods/reports implement adopted FIN-02 target. Older `/perkiraan`, `/akunting`, `/akunting/ledger`, `/akunting/kategori-akun`, `/akunting/rugi-laba`, `/akunting/kategori-cashflow` are preview surfaces. Local previews do not establish legacy provenance.


## 5. Export inventory

No download performed. The current user permits confirmed bounded non-mutating report exports; this visit did not establish output bounds and side effects for a particular export sufficiently to execute it. Button wording is not format verification. No temporary exports entered the repository.

| Legacy page | Export action | Observed format | Structure | Verification |
|---|---|---|---|---|
| LP-R01 `detail-transaction` | Ekspor | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R02 `recaps-transactions` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R03 `branch-manifest` | None exposed | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | None shown in inspected view |
| LP-R04 `branch-manifest-recaps` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R05 `city-courier` | None exposed | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | None shown in inspected view |
| LP-R06 `gross-profit-manifest` | None exposed | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | None shown in inspected view |
| LP-R07 `rekap-omzet-harian` | Cetak | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R08 `rekap-gross-profit` | Export Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R09 `manifest-vendor` | None exposed | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | None shown in inspected view |
| LP-R10 `awb-pending` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R11 `awb-termanifest` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R12 `rekap-customer-bl` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R13 `rekap-omset-harian` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R14 `detail-transaksi-inbound` | Ekspor | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R15 `daily-report-courier` | Export | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R16 `laporan-detail-kurir` | Ekspor | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R17 `sales-aging` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R18 `ap-report` | Ekspor Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R19 `pengiriman` | Export | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R20 `pod-return` | Export | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R21 `all-status` | Export | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| LP-R22 `report-customer` | Export Excel | UNVERIFIED | Sheets, export columns/counts, date/currency/number formats and UI/export differences unknown | Not executed |
| Invoice `sales` | Export | UNVERIFIED | No file inspected | Not executed |

## 6. Legacy-to-current mapping

Classifications describe behavior, not matching labels. EXACT requires demonstrated parity; none established. RELOCATED below describes a current-app functional relocation, not proven provider equivalence.

| Legacy menu path | Legacy URL | Current route | Classification | Explanation |
|---|---|---|---|---|
| Laporan-laporan > Laporan Cabang > Detail Transaksi (LP-R01) | https://redlogistik.tracks-app.com/index.php/detail-transaction | /branch-reports/transaction-details | PARTIAL | RPT-01 source-backed bounded report; missing transport/service and legacy billing meanings not guessed. |
| Laporan-laporan > Laporan Cabang > Rekap Transaksi (LP-R02) | https://redlogistik.tracks-app.com/index.php/recaps-transactions | â€” | MISSING_OR_BLOCKED | No dedicated implemented recap route established; daily turnover is distinct. |
| Laporan-laporan > Laporan Cabang > Manifest Outbound (LP-R03) | https://redlogistik.tracks-app.com/index.php/branch-manifest | /branch-reports/manifest-outbound | PARTIAL | RPT-02 operational inventory; vendor/cost/driver semantics not equivalent. |
| Laporan-laporan > Laporan Cabang > Rekap Manifest (LP-R04) | https://redlogistik.tracks-app.com/index.php/branch-manifest-recaps | â€” | MISSING_OR_BLOCKED | No dedicated source-backed manifest recap found. |
| Laporan-laporan > Laporan Cabang > Pengantaran (LP-R05) | https://redlogistik.tracks-app.com/index.php/city-courier | /branch-reports/delivery?view=sheets; /branch-reports/delivery?view=items | PARTIAL | RPT-02 stored sheets/items; legacy report is per DRS; item view separate. Generation remains OPS-03. |
| Laporan-laporan > Laporan Cabang > Gross Profit / Manifest (LP-R06) | https://redlogistik.tracks-app.com/index.php/gross-profit-manifest | /branch-reports/gross-profit; /finance/accounting/reports | PARTIAL | Old route is preview; FIN transaction GP uses adopted accounting policy, not manifest GP parity. |
| Laporan-laporan > Laporan Cabang > Rekap Transaksi Harian (LP-R07) | https://redlogistik.tracks-app.com/index.php/rekap-omzet-harian | â€” | MISSING_OR_BLOCKED | Distinct route from rekap-omset-harian; no proven counterpart. |
| Laporan-laporan > Laporan Cabang > Rekap Gross Profit (LP-R08) | https://redlogistik.tracks-app.com/index.php/rekap-gross-profit | /branch-reports/rekap-gross-profit; /finance/accounting/reports | PARTIAL | Preview survives; FIN monthly transaction GP recap has different grouping/source. |
| Laporan-laporan > Laporan Cabang > Manifest Vendor (LP-R09) | https://redlogistik.tracks-app.com/index.php/manifest-vendor | /branch-reports/manifest-vendor | INTENTIONALLY_DEFERRED | RPT-02/RPT-05 document missing trustworthy vendor association; unavailable state deliberate. |
| Laporan-laporan > Laporan Cabang > Awb Tertunda (LP-R10) | https://redlogistik.tracks-app.com/index.php/awb-pending | /branch-reports/awb | PARTIAL | Shared AWB preview is not real pending membership. |
| Laporan-laporan > Laporan Cabang > Awb Termanifest (LP-R11) | https://redlogistik.tracks-app.com/index.php/awb-termanifest | /branch-reports/awb | PARTIAL | Shared AWB preview does not prove manifested membership/history. |
| Laporan-laporan > Laporan Cabang > Rekap Customer Bulanan (LP-R12) | https://redlogistik.tracks-app.com/index.php/rekap-customer-bl | /branch-reports/customer-monthly-summary | PARTIAL | Preview only; totals unimplemented by matching labels. |
| Laporan-laporan > Laporan Cabang > Rekap Omset Harian (LP-R13) | https://redlogistik.tracks-app.com/index.php/rekap-omset-harian | /branch-reports/daily-turnover-summary | PARTIAL | Preview only; distinct from daily transaction print recap. |
| Laporan-laporan > Laporan Cabang > Detail Transaction Inbound (LP-R14) | https://redlogistik.tracks-app.com/index.php/detail-transaksi-inbound | /branch-reports/inbound-transaction-details | PARTIAL | Preview only; same headers do not establish inbound semantics. |
| Laporan-laporan > Laporan Kurir > Harian Kurir (LP-R15) | https://redlogistik.tracks-app.com/index.php/daily-report-courier | /courier-reports | PARTIAL | Combined courier preview; pickup/miss event source unestablished. |
| Laporan-laporan > Laporan Kurir > Laporan Detail Kurir (LP-R16) | https://redlogistik.tracks-app.com/index.php/laporan-detail-kurir | /courier-reports | PARTIAL | Preview only; SLA/lead-time semantics unverified. |
| Laporan-laporan > Laporan Keuangan > Laporan AR (LP-R17) | https://redlogistik.tracks-app.com/index.php/sales-aging | /financial-reports; /finance/invoices | PARTIAL | AR preview remains; FIN invoice/receipt policy is not proven legacy aging parity. |
| Laporan-laporan > Laporan Keuangan > Laporan AP (LP-R18) | https://redlogistik.tracks-app.com/index.php/ap-report | /financial-reports | INTENTIONALLY_DEFERRED | AP preview; supplier settlement excluded from FIN. Accrued liability is not a payment workflow. |
| Laporan-laporan > Reports Customer > Pengiriman (LP-R19) | https://redlogistik.tracks-app.com/index.php/pengiriman | /customer-reports | PARTIAL | Combined customer preview, not source-backed shipment report. |
| Laporan-laporan > Reports Customer > POD Kembali (LP-R20) | https://redlogistik.tracks-app.com/index.php/pod-return | /customer-reports | PARTIAL | Preview; delivery outcome cannot prove POD-return event. |
| Laporan-laporan > Reports Customer > Semua Status (LP-R21) | https://redlogistik.tracks-app.com/index.php/all-status | /customer-reports | PARTIAL | Preview, not source-backed all-status scope/totals. |
| Laporan-laporan > Report Customer (LP-R22) | https://redlogistik.tracks-app.com/index.php/report-customer | /customer-reports | PARTIAL | Shared preview is not a verified standalone export equivalent. |
| Dashboard | https://redlogistik.tracks-app.com/index.php/ | /dashboard | PARTIAL | Operational target, not AI/financial KPI parity. |
| Pendapatan Pelanggan | https://redlogistik.tracks-app.com/index.php/revenue-customer | /marketing (module entry only) | MISSING_OR_BLOCKED | Dedicated revenue/Growth query counterpart not established. |
| Invoice (New) | https://redlogistik.tracks-app.com/index.php/sales | /finance/invoices; /finance/invoices/new; /finance/invoices/[id] | PARTIAL | Adopted FIN-01 target; legacy numbering/financial lifecycle not equivalent by evidence. |
| Pembayaran Hutang | https://redlogistik.tracks-app.com/index.php/debt-payments | — | INTENTIONALLY_DEFERRED | Supplier payment workflow excluded from FIN adoption. |
| Tiket Support, Add, eye detail | https://redlogistik.tracks-app.com/index.php/ticketing-support; ticketing-support/tambah; ticketing-support/chat/[id] | /ticketting; /ticketting/new; /ticketting/[id] | PARTIAL | Creator/branch subset; approval, attachment and history parity not established. |
| Persetujuan Tiketing | https://redlogistik.tracks-app.com/index.php/approval-ticketing | — | INTENTIONALLY_DEFERRED | Approval lifecycle excluded from accepted v1. |
| Legacy accounting paths not exposed | UNVERIFIED | /finance/accounting; /finance/accounting/accounts; /finance/accounting/journals; /finance/accounting/costs; /finance/accounting/periods; /finance/accounting/reports | UNVERIFIED | Current implementation exists; legacy navigation provenance not established. |
| Older local accounting previews (not observed legacy menu) | UNVERIFIED | /perkiraan; /akunting; /akunting/ledger; /akunting/kategori-akun; /akunting/rugi-laba; /akunting/kategori-cashflow → /finance/accounting/* | RELOCATED | Modern functions under finance/accounting; old preview routes remain. Current-app relocation only. |
| Provider inventory metadata for implemented Detail Transaksi | https://redlogistik.tracks-app.com/index.php/detail-transaction | /branch-reports/transaction-details | STALE_NAVIGATION | Unlinked metadata can imply unavailable although a separate canonical runtime link exists. |

Source evidence: `src/components/shell/navigation.ts`, `legacy-menu.ts`, `implemented-preview-routes.ts`; corresponding `src/app/(dashboard)/` pages; `src/features/finance/components/accounting-pages.tsx`; `docs/decisions/{SUP-01-contract,RPT-01-contract,RPT-02-contract,FIN-01-contract,FIN-02-contract,FIN-implementation}.md`. HEAD `af28516eac27d6dd6a2930372baab6f83e21e8f0` plus pre-existing uncommitted UI edits. Conclusions describe inspected disk source, not a clean committed snapshot. FIN adoption dated 2026-11-15 is target policy, not provider parity/release approval.

## 7. Navigation gaps and relocation analysis

- Current exported `navigation` derives from `legacyMenu`, not directly from the full `providerNavigation`. It simplifies hierarchy and calls reports Laporan, while live legacy calls it Laporan-laporan. Current Akunting is an added group not exposed in this live sidebar.
- `leaf()` retains href only when the normalized route appears in `implementedPreviewRoutes`. The registry establishes a page, not backend functionality. A link can reach a preview; unavailable metadata does not prove a denied permission or absent feature.
- Provider inventory constructs sections with unlinked leaf metadata. The same concept may be unavailable there but linked elsewhere. This is stale presentation only where an implemented counterpart is independently established; it does not make every report implemented.
- Akunting is specially replaced with Ikhtisar akuntansi, Invoice, Akun & kategori, Jurnal, Biaya aktual, Periode, P&L, GP & arus kas. These `/finance/*` links are excluded from More previews. Finance is reachable through the added accounting group while Laporan Keuangan opens `/financial-reports`, still a preview. This is confusing discoverability, not missing finance implementation.
- `/finance/accounting/reports` renders Profit & Loss, Gross Profit per transaksi, Rekap Gross Profit bulanan, Arus kas, Buku besar — pergerakan periode, and source-journal drilldown. Branch/date filters have a maximum 366 days. It covers new LMS accounting documents in IDR with explicit cost-completeness warnings. Ledger columns: Akun; Debit IDR; Kredit IDR. Source rows: Tanggal; Jurnal; Sumber; Referensi; Transaksi; Akun; Debit; Kredit. This is source-backed functionality, unlike retained `/akunting/*` previews.
- **Manifest GP is not transaction GP.** Legacy Destination GP is a manifest list with quantities/cost labels and no verified profit formula. FIN GP uses invoice issue/cost declarations and accounting-date movements under adopted recognition rules. Grouping, attribution, date basis, completeness and historical coverage differ. Legacy Rekap GP lists plates/manifests/drivers/creator; FIN recap groups monthly accounting movements. Do not repoint legacy labels as exact equivalents without a domain decision.
- Rekap Transaksi, Rekap Manifest, Rekap Transaksi Harian have no dedicated proven current equivalent. The omzet/omset spellings identify distinct routes. Generic AWB/customer/courier previews collapse separate report identities.
- Live Layanan Vendor and M.Shipment Status differ from provider inventory Layanaan Vendor and M. Shipment Status. Current Rekap Customer BUlanan capitalization also differs. Spelling does not settle business policy.
- FIN separates invoice list/new/detail; legacy combines create/list. AP previews and accrued liabilities do not imply supplier settlement. SUP separates creator-scoped create/list/detail from the legacy approval-oriented surface.

## 8. Unverified observations

- All 22 report destinations opened and eight top-level sidebar entries recursively expanded. Non-Dev3 pages were link-verified only, as indexed. No inaccessible login/session blocker occurred after fallback. Thirty distinct live Dev3 page surfaces were inspected (22 reports, dashboard, revenue, invoice, debt, ticket list/add/detail/approval); accounting has a separate unverified section.
- Parameter/export-only outputs LP-R02/R04/R07/R12/R13/R22 remain unverified because export/print was not executed. Manifest Vendor results and initial Processing views require settled-output evidence; they are not claims of no data.
- Export file type, worksheets, exported headers/counts, formats and UI/export comparisons unknown. Excel labels alone do not verify format. No private record/export/screenshot entered the repository.
- Earliest selectable date and earliest actual record date unknown. Moving year window is not a bound. Historical Detail Transaksi was pre-existing, not a controlled query from this observer.
- Other dropdown option lists, branch/role effects, search matches, sort/pagination correctness and server validation were not exhaustively tested. Visible affordances do not prove backend behavior.
- GP Transit/Vendor output was historically observed (LD043/046), not revisited here. Current Destination empty does not imply all variants always empty.
- Populated invoice/payment/approval/history behavior unverified. Ticket attachment not downloaded; detail mutability/lifecycle/notification effects not tested. No business mutation permitted.
- Legacy accounting/ledger/categories/P&L links not exposed for this session. Global availability and other roles unknown. Dashboard activity endpoint lies outside index.php scope and was not opened; private activity IDs intentionally omitted.
- Current route availability is source-verified, not a new runtime/staging acceptance. No business-formula reconciliation or release conclusion follows. Historical test results in contracts were not rerun or claimed as this task's checks.

## 9. Recommendations for follow-up

1. **Low-risk navigation:** label financial/accounting previews clearly and add named links to implemented `/finance/accounting/reports` and `/finance/invoices`. Preserve old URLs; do not equate manifest and transaction GP.
2. **Low-risk inventory:** correct spelling, retain all 22 report identities and both daily recaps, explain unavailable inventory metadata when another canonical route works. Route registration must not imply permission/backend readiness.
3. **Targeted evidence:** confirm a bounded non-mutating export for parameter-only reports and inspect sanitized structure temporarily. Verify settled AWB/vendor outputs with known permissible filters, without random historical scanning.
4. **Finance-owner decision:** determine whether manifest GP/recap is required alongside adopted transaction/accounting GP. Establish source, grouping, recognition, filters, completeness and reconciled synthetic examples before implementation.
5. **Separate domain work:** supplier settlement/AP aging, report formulas/date semantics, ticket approval/history/attachments and legacy accounting provenance need evidence/decisions of their own. Accepted v1 contracts do not silently approve them.

Documentation checkpoint: this inventory is the sole task-owned repository file. Existing modified source/state files were preserved. No source/schema/permission/finance changes, push, merge or deployment. Consistency and whitespace check results are recorded below.

Validation on 2026-11-16: Python assertions passed for readable UTF-8, nine required sections, exactly 22 unique ordered LP-R headings, 22 corresponding mappings, balanced fences and absence of known private-ID/credential patterns. Manual content review retained headers/controls and omitted private row values. `git diff --no-index --check -- NUL docs/decisions/DEV3-LEGACY-NAVIGATION-INVENTORY.md` reported no whitespace errors (exit 1 because the new file differs from NUL); scoped `git diff --check` passed. The no-index check covers this untracked file. Git emitted only its CRLF-to-LF normalization notice. File remains uncommitted. Application lint/typecheck/tests/migrations/build intentionally not run for this documentation-only task.
