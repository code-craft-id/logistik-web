/**
 * Single source of feature explanations for the in-app help chat.
 * Add or edit entries here; the chat searches titles, keywords and answers.
 * Plain text only (no personal data); `href` must be an implemented route.
 */
export type HelpEntry = {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  href?: string;
};

export const helpEntries: HelpEntry[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    keywords: [
      "dashboard",
      "beranda",
      "ringkasan",
      "kpi",
      "grafik",
      "quick action",
      "pending",
    ],
    answer:
      "Dashboard menampilkan ringkasan bulan berjalan: jumlah transaksi, manifest, lembar pengantaran, AWB Pending (AWB tanpa manifest aktif), invoice outstanding dan piutang, grafik jumlah AWB per hari, status kiriman dan aktivitas AWB terbaru. Ubah periode dan cabang lalu klik Tampilkan laporan. Quick Action hanya menampilkan menu yang boleh Anda buka.",
    href: "/dashboard",
  },
  {
    id: "booking",
    title: "Booking",
    keywords: ["booking", "pesan", "pickup", "jemput", "tambah booking"],
    answer:
      "Menu Modul > Layanan Pelanggan > Booking. Klik Tambah Booking, pilih Cabang dan (opsional) Customer, isi pengirim, penerima, DO, tujuan, koli, berat, volume dan biaya, lalu simpan. Booking boleh dihubungkan ke AWB, tetapi tidak wajib.",
    href: "/bookings",
  },
  {
    id: "awb-entry",
    title: "Entry AWB (Transaksi)",
    keywords: [
      "awb",
      "resi",
      "entry",
      "transaksi",
      "tambah awb",
      "input",
      "on site",
      "outbound",
      "kirim",
    ],
    answer:
      "Modul > Layanan Pelanggan > Transaksi > On Site Outbound, lalu Tambah AWB. Kolom AWB No. terisi otomatis setelah Asal dipilih (kode cabang asal + tahun bulan + nomor urut, contoh JKT261100001) dan boleh diubah; bila tidak diubah, nomor dikunci saat disimpan sehingga tidak bentrok dengan pengguna lain. Pilih Pricing Type (Harga/Kg, Harga/Koli, Trucking), Pickup By, Asal (wajib), Tujuan, Customer, Marketing, data pengirim dan penerima (pilih Penerima untuk mengisi otomatis), Layanan, DOC/PAC, Via Moda, Pembayaran, koli, volume dan berat. Harga/Kg dan Min KG terisi dari tarif Cek Ongkir bila ada. Grand Total = harga x Terberat (minimal Min KG) / koli / tarif tetap + biaya lain, packing, pickup - discount + PPN, dihitung ulang oleh server. Ganti Harga = isi Grand Total manual. Kirim ulang form yang sama tidak membuat AWB ganda. Tab On Site Inbound menampilkan AWB yang menuju cabang Anda.",
    href: "/transactions/new",
  },
  {
    id: "awb-approval",
    title: "Persetujuan Edit/delete AWB",
    keywords: [
      "edit awb",
      "hapus awb",
      "delete awb",
      "persetujuan",
      "approval awb",
      "ubah awb",
      "modified",
    ],
    answer:
      "Buka detail AWB, pilih Ajukan Edit atau Ajukan Hapus dan isi alasan. Penyetuju membuka Modul > Layanan Pelanggan > Transaksi > Persetujuan Edit/delete AWB lalu klik Setujui atau Tolak (pengaju tidak boleh menyetujui sendiri, kecuali admin). Hapus yang disetujui langsung menghapus AWB, kecuali AWB masih ada di manifest, lembar pengantaran, invoice, jurnal, POD Kembali atau hutang. Edit yang disetujui membuka form edit sekali di detail AWB; koli, berat, volume dan biaya tidak bisa diubah bila AWB sudah diinvoice atau dijurnal. Riwayatnya tampil di Histori Edit Resi dan History Delete Resi.",
    href: "/transactions/approvals",
  },
  {
    id: "cek-ongkir",
    title: "Cek Ongkir dan tarif",
    keywords: [
      "ongkir",
      "tarif",
      "harga",
      "cek ongkir",
      "biaya kirim",
      "estimasi",
    ],
    answer:
      "Modul > Layanan Pelanggan > Cek Ongkir. Pilih Dari, Ke dan isi berat, lalu Cek. Tarif = Tarif per Kg x berat (minimal Berat Min.). Pengguna dengan hak kelola tarif bisa menambah atau menghapus tarif di bagian Kelola Tarif. Tarif ini juga mengisi otomatis Harga/Kg dan Min KG saat Tambah AWB.",
    href: "/customer-service/cek-ongkir",
  },
  {
    id: "inbound-booking",
    title: "Inbound Booking",
    keywords: ["inbound booking", "booking masuk", "booking tujuan"],
    answer:
      "Modul > Layanan Pelanggan > Inbound Booking (tab di halaman Booking) menampilkan booking yang menuju cabang Anda: tujuan booking sama dengan nama cabang, atau AWB-nya menuju cabang Anda.",
    href: "/bookings?tab=inbound",
  },
  {
    id: "inbound-agen",
    title: "Cek Inbound Agen",
    keywords: ["inbound agen", "agen", "manifest agen", "vendor"],
    answer:
      "Modul > Operasional > Manifest > Cek Inbound Agen (tab di halaman Manifest) menampilkan manifest yang diteruskan ke agen/vendor. Pilih Tujuan untuk menyaring per kota cabang.",
    href: "/manifest?view=agent",
  },
  {
    id: "pod-return",
    title: "POD Kembali dan Approval Pod Kembali",
    keywords: [
      "pod kembali",
      "pod",
      "bukti terima",
      "approval pod",
      "stt kembali",
    ],
    answer:
      "Modul > Operasional > POD Kembali: klik Tambah POD Kembali, pilih tanggal, cabang asal, Tujuan POD, driver, keterangan dan tempel nomor AWB berstatus Delivered. Nomor dokumen dibuat otomatis (POD-YYYYMMDD-urut). Cabang tujuan menyetujui atau menolak di tab Approval Pod Kembali. Satu AWB hanya boleh ada di satu dokumen yang tidak ditolak.",
    href: "/pod-returns",
  },
  {
    id: "debt-payment",
    title: "Pembayaran Hutang",
    keywords: [
      "hutang",
      "pembayaran hutang",
      "invoice vendor",
      "ap",
      "tagihan vendor",
    ],
    answer:
      "Modul > Keuangan > Hutang Dagang > Pembayaran Hutang. Klik Tambah Pembayaran Hutang, pilih Kategori dan Vendor, tanggal, nomor invoice (kosongkan untuk otomatis), tanggal diterima, term, nominal dan AWB terkait. Tgl. Pengingat = tanggal diterima (atau dibuat) + term. Klik Tandai Lunas saat sudah dibayar. Belum membuat jurnal akuntansi.",
    href: "/finance/debt-payments",
  },
  {
    id: "awb-detail",
    title: "Detail AWB dan barcode",
    keywords: [
      "detail",
      "barcode",
      "cetak",
      "scan",
      "awb detail",
      "riwayat status",
    ],
    answer:
      "Buka AWB dari daftar Transaksi. Halaman detail menampilkan barcode Code 128 dari nomor AWB, semua data pengiriman (cabang, customer, layanan, moda, pembayaran) dan riwayat status. Barcode bisa dipindai alat scanner standar.",
    href: "/transactions",
  },
  {
    id: "awb-status",
    title: "Ubah status AWB",
    keywords: [
      "status",
      "ubah status",
      "in transit",
      "delivered",
      "cancelled",
      "batal",
    ],
    answer:
      "Di detail AWB, bagian Ubah Status. Urutan yang diizinkan: Open → In Transit → Delivered, atau Open/In Transit → Cancelled. Setiap perubahan tercatat (siapa, kapan, alasan). AWB harus In Transit sebelum hasil antar dicatat Terkirim.",
    href: "/transactions",
  },
  {
    id: "tracking",
    title: "Tracking AWB",
    keywords: ["tracking", "lacak", "cek resi", "cari awb", "lookup"],
    answer:
      "Gunakan Tracking AWB (Quick Action di Dashboard atau /transactions/lookup). Masukkan nomor AWB untuk melihat status dan riwayatnya, sebatas cabang yang boleh Anda lihat.",
    href: "/transactions/lookup",
  },
  {
    id: "manifest",
    title: "Manifest",
    keywords: [
      "manifest",
      "manifes",
      "muat",
      "kendaraan",
      "vendor",
      "kurir",
      "tambah manifest",
    ],
    answer:
      "Modul > Operasional > Manifest. Tambah Manifest: isi nomor, tanggal, jenis, cabang pemilik, asal, tujuan, kendaraan, kurir dan vendor. Manifest dibuat berstatus Draft. Di detail manifest, ketik nomor AWB lalu Tambahkan. Satu AWB hanya boleh di satu manifest aktif; total koli/berat/volume dihitung otomatis.",
    href: "/manifest",
  },
  {
    id: "drs",
    title: "Lembar Pengantaran (DRS) dan hasil antar",
    keywords: [
      "drs",
      "lembar pengantaran",
      "delivery sheet",
      "pengantaran",
      "antar",
      "hasil antar",
      "terkirim",
      "gagal",
      "retur",
      "pod",
    ],
    answer:
      "Di detail manifest, bagian Lembar Pengantaran: klik Buat DRS (satu DRS per manifest). Lalu di tabel AWB pilih hasil antar (Terkirim, Gagal, Retur) dan nama penerima, klik Simpan. Terkirim mengubah status AWB menjadi Delivered. Hasil Terkirim dan Retur bersifat final.",
    href: "/manifest",
  },
  {
    id: "customer",
    title: "Customer dan Penerima",
    keywords: [
      "customer",
      "pelanggan",
      "penerima",
      "consignee",
      "pemasaran",
      "penjualan",
      "marketing",
    ],
    answer:
      "Modul > Pemasaran/Penjualan. Tab Customer dan Penerima: cari, tambah (klik + Tambah), ubah dan hapus. Pengguna cabang hanya bisa mengubah data cabangnya sendiri; data 'Semua cabang' hanya bisa dibuat admin. Data yang dihapus tetap tercatat di AWB lama.",
    href: "/marketing",
  },
  {
    id: "invoice",
    title: "Invoice dan pembayaran",
    keywords: [
      "invoice",
      "tagihan",
      "faktur",
      "bayar",
      "pembayaran",
      "receipt",
      "void",
      "piutang",
    ],
    answer:
      "Akunting > Invoice. Buat draft dengan memilih customer dan AWB (satu AWB hanya di satu invoice aktif), lalu Terbitkan (nomor INV-…). Catat pembayaran sebagian atau penuh; status Belum dibayar/Sebagian/Lunas dihitung otomatis. Koreksi: balik pembayaran, lalu VOID dengan alasan dan buat invoice baru.",
    href: "/finance/invoices",
  },
  {
    id: "accounting",
    title: "Akunting (akun, jurnal, biaya, periode)",
    keywords: [
      "akunting",
      "akuntansi",
      "jurnal",
      "akun",
      "perkiraan",
      "biaya aktual",
      "tutup periode",
      "laba rugi",
      "arus kas",
      "gp",
    ],
    answer:
      "Menu Akunting: Akun & kategori (chart of accounts, juga lewat Master Data > Perkiraan), Jurnal (wajib seimbang; yang sudah diposting dikoreksi dengan jurnal balik), Biaya aktual per AWB, Periode (tutup bulan) dan Laporan P&L, GP dan arus kas. Jurnal, pembayaran dan invoice terbit tidak bisa dihapus.",
    href: "/finance/accounting",
  },
  {
    id: "report-transactions",
    title: "Laporan Detail Transaksi dan AWB",
    keywords: [
      "laporan",
      "detail transaksi",
      "awb tertunda",
      "awb termanifest",
      "pending",
      "semua status",
      "export",
      "csv",
    ],
    answer:
      "Laporan > Laporan Cabang: Detail Transaksi (bisa Export CSV dengan hak export), AWB (tab tertunda = belum masuk manifest aktif, termanifest). Laporan > Customer Reports > Semua Status menampilkan status tersimpan, penerima terakhir dan manifest.",
    href: "/branch-reports/transaction-details",
  },
  {
    id: "report-recap",
    title: "Rekap Customer Bulanan dan Omset Harian",
    keywords: [
      "rekap",
      "customer bulanan",
      "omset",
      "omzet",
      "harian",
      "pendapatan",
      "penjualan",
    ],
    answer:
      "Rekap Customer Bulanan: per customer jumlah AWB, koli, berat, total biaya. Rekap Omset Harian: per tanggal dan jenis pembayaran. Omset = biaya yang diisi saat Entry AWB (belum diskon/pajak). Kolom 'AWB data belum lengkap' menunjukkan AWB yang koli/berat/biayanya kosong.",
    href: "/branch-reports/daily-turnover-summary",
  },
  {
    id: "report-gp",
    title: "Gross Profit dan Rekap GP",
    keywords: [
      "gross profit",
      "gp",
      "laba",
      "profit",
      "rekap gp",
      "manifest gp",
      "biaya",
    ],
    answer:
      "Gross Profit / Manifest: Pendapatan = biaya input AWB di manifest, Biaya = biaya aktual dari Akunting, GP = selisihnya. Rekap Gross Profit merangkum per kendaraan. AWB tanpa biaya input atau tanpa biaya aktual dihitung 0 dan jumlahnya ditampilkan.",
    href: "/branch-reports/gross-profit",
  },
  {
    id: "report-ops",
    title: "Laporan Kurir, Inbound, Manifest, Vendor",
    keywords: [
      "kurir",
      "inbound",
      "masuk",
      "manifest outbound",
      "pengantaran",
      "vendor",
      "manifest vendor",
    ],
    answer:
      "Laporan Kurir: per kurir total AWB diantar, berhasil, gagal, retur. Detail Transaksi Inbound: AWB yang tujuannya cabang Anda. Manifest Outbound dan Pengantaran: daftar manifest dan DRS. Manifest Vendor: per vendor yang dipilih saat membuat manifest.",
    href: "/courier-reports",
  },
  {
    id: "report-customer",
    title: "Pengiriman dan POD Kembali",
    keywords: ["pengiriman", "pod", "bukti", "diterima", "customer report"],
    answer:
      "Laporan > Customer Reports: Pengiriman (daftar AWB per customer dengan layanan dan moda) dan POD Kembali (AWB yang tercatat Terkirim beserta penerima dan waktu terima). Pencatatan dokumen POD fisik kembali ke kantor belum tersedia.",
    href: "/customer-reports/shipments",
  },
  {
    id: "report-finance",
    title: "Laporan Keuangan (umur piutang)",
    keywords: [
      "laporan keuangan",
      "ar",
      "aging",
      "umur piutang",
      "jatuh tempo",
      "ap",
      "hutang",
    ],
    answer:
      "Laporan Keuangan menampilkan saldo invoice terbit yang belum lunas per customer per hari ini, dikelompokkan: belum jatuh tempo, 1–30, 31–60, 61–90, lebih dari 90 hari. Laporan hutang (AP) belum tersedia.",
    href: "/financial-reports",
  },
  {
    id: "ticketing",
    title: "Ticketing",
    keywords: ["tiket", "ticket", "ticketing", "keluhan", "support", "bantuan"],
    answer:
      "Menu Ticketing: buat tiket (cabang, prioritas, judul, menu, link halaman, catatan), lihat daftar dan detail. Pembuat dan cabangnya bisa melihat tiket; admin bisa melihat semua.",
    href: "/ticketting",
  },
  {
    id: "master-data",
    title: "Master Data",
    keywords: [
      "master",
      "master data",
      "area",
      "divisi",
      "layanan",
      "kendaraan",
      "moda",
      "jenis barang",
      "jenis biaya",
      "termin",
      "vendor",
      "shipment status",
      "driver",
      "kurir",
    ],
    answer:
      "Master Data: Area Logistik, Divisi (marketing, driver, kurir), Layanan (moda, layanan, jenis barang, jenis biaya/pembayaran, termin), Kendaraan, Vendor dan Shipment Status. Data bersama hanya bisa diubah admin; data per cabang bisa diubah pengguna cabang yang berhak.",
    href: "/logistics/services",
  },
  {
    id: "users",
    title: "User, grup dan hak akses",
    keywords: [
      "user",
      "pengguna",
      "grup",
      "hak akses",
      "izin",
      "permission",
      "role",
      "admin",
      "akses ditolak",
    ],
    answer:
      "Sistem Setting: Grup User, Manajemen User dan Hak Akses Menu. Hak akses diberikan per grup (lihat, tambah, ubah, hapus, export) dan dibatasi cabang yang ditugaskan ke user. Menu yang tidak boleh dibuka tidak tampil; 'Akses ditolak' berarti grup Anda belum punya hak tersebut.",
    href: "/group-user",
  },
  {
    id: "office",
    title: "Kantor, cabang dan perusahaan",
    keywords: [
      "kantor",
      "cabang",
      "branch",
      "perusahaan",
      "company",
      "agen",
      "office",
    ],
    answer:
      "Menu Kantor: Perusahaan, Kantor Cabang, Kantor dan Agen. Semua data operasional dan laporan dibatasi ke cabang yang ditugaskan ke user.",
    href: "/office/branches",
  },
  {
    id: "period",
    title: "Periode, tanggal dan zona waktu",
    keywords: [
      "periode",
      "tanggal",
      "utc",
      "zona waktu",
      "jam",
      "filter",
      "31 hari",
      "92 hari",
    ],
    answer:
      "Tanggal di laporan memakai UTC. Laporan operasional dibatasi 31 hari per tampilan, laporan rekap 92 hari. Jika periode kosong, laporan dan dashboard memakai bulan berjalan.",
  },
  {
    id: "help",
    title: "Tentang chat bantuan",
    keywords: ["chat", "bantuan", "help", "tanya", "riwayat"],
    answer:
      "Chat ini menjawab dari daftar penjelasan fitur di aplikasi (tidak dikirim ke layanan luar). Riwayat chat tersimpan di browser Anda dan terhapus otomatis setelah 10 menit.",
  },
];
