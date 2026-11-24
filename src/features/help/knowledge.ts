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
      "Dashboard menampilkan ringkasan bulan berjalan: jumlah transaksi, manifest, lembar pengantaran, AWB Pending (AWB tanpa manifest aktif), invoice outstanding dan piutang, grafik jumlah AWB per hari, status kiriman dan aktivitas AWB terbaru. Ubah periode dan cabang lalu klik Tampilkan laporan. Quick Action mengikuti urutan aplikasi lama (Booking, Entry AWB, Manifest, Transit, Inbound Manifest, Delivery Sheet, Shipment Status, Invoice, Invoice Paid, Tracking AWB, Report Detail Transaksi, Rekap Transaksi, Report AR) dan hanya menampilkan menu yang boleh Anda buka.",
    href: "/dashboard",
  },
  {
    id: "delete-confirmation",
    title: "Konfirmasi sebelum hapus",
    keywords: [
      "hapus",
      "konfirmasi",
      "batal",
      "void",
      "nonaktifkan",
      "salah hapus",
      "modal",
    ],
    answer:
      "Semua tindakan hapus, nonaktifkan, batal dan void selalu menampilkan jendela konfirmasi dulu; data baru diproses setelah Anda menekan tombol Ya. Tekan Batal atau Escape untuk membatalkan. Berlaku untuk master data, perusahaan/kantor, konfigurasi, customer/penerima, user, grup user, tarif, batal booking, pengajuan hapus AWB dan persetujuannya, serta void invoice/balik jurnal/pembayaran dan tutup periode. Hapus baris di form yang belum disimpan (misalnya baris invoice atau foto sebelum Simpan) tidak perlu konfirmasi.",
    href: "/dashboard",
  },
  {
    id: "shipment-status-list",
    title: "Status Pengantaran (Kelola Status Pengiriman)",
    keywords: [
      "status pengantaran",
      "shipment status",
      "status pengiriman",
      "sla",
      "lead time",
      "diterima oleh",
      "kelola status",
    ],
    answer:
      "Modul > Layanan Pelanggan > Status Pengantaran (juga Quick Action Shipment Status) menampilkan semua AWB dari/ke cabang Anda: AWB, tanggal, asal, tujuan, pengirim, layanan, status, penerima, diterima oleh, tanggal diterima, lead time (L.Time, hari) dan SLA. Cari dengan AWB, DO, nama pengirim atau penerima dan saring per status; 50 baris per halaman. SLA berisi In Progress sampai kiriman diterima (Retur untuk AWB Returned), lalu On Time bila lead time (hari dari tanggal AWB sampai diterima) tidak melebihi Estimasi rute di Cek Ongkir (angka terbesar, misalnya 1-2 hari = 2 hari) atau Late bila melebihi; tanda - bila rute belum punya Estimasi. Isi kolom Estimasi di Cek Ongkir agar SLA terhitung. Tombol Ubah membuka detail AWB untuk mengubah status (hak Transaksi: ubah); bukti terima dari kurir masuk lewat Scan AWB. Data diterima diambil dari bukti terima Scan, import Excel atau lembar pengantaran (DRS). Import status (hak Transaksi: ubah): klik Template Import untuk mengunduh template berkolom AWB No. | Date | Received | Status | Remarks, isi Status 2 = ACCEPTED/DITERIMA (Received wajib, AWB menjadi Delivered) atau 1 = BACK TO OFFICE/RETUR (AWB menjadi Returned), Date = tanggal diterima (YYYY-MM-DD, tidak boleh masa depan). Klik Import, pilih file, Periksa file untuk melihat hasil per baris (AWB tidak ditemukan, kode status lain, duplikat, tanggal salah), lalu Proses baris valid; baris yang salah dilewati. Riwayat status mencatat alasan Import Status Excel.",
    href: "/customer-service/status-pengantaran",
  },
  {
    id: "rekap-transaksi",
    title: "Rekap Transaksi (Excel)",
    keywords: [
      "rekap transaksi",
      "rekap",
      "excel",
      "ekspor",
      "multiple sheet",
      "one sheet",
      "penagihan",
    ],
    answer:
      "Laporan > Laporan Cabang > Rekap Transaksi (juga Quick Action). Pilih Bulan, Tahun, Cabang asal dan Jenis Lembar lalu Ekspor Excel. Multiple Sheet = satu sheet per tanggal (nama sheet YYYY-MM-DD), One Sheet = semua tanggal dalam satu sheet plus TOTAL BULAN. Tiap tanggal berisi baris per Cabang Tujuan: Total AWB, Total Koli, Total Berat, Total Volume, CASH, KREDIT, COD (Grand Total AWB menurut jenis pembayaran) dan Total Penagihan (CASH + KREDIT + COD), ditutup baris TOTAL. Tanggal yang AWB-nya semuanya di-void tetap punya sheet dengan total 0, seperti di aplikasi lama. Membuka halaman butuh hak Laporan Transaksi: lihat; mengunduh butuh hak ekspor.",
    href: "/branch-reports/rekap-transaksi",
  },
  {
    id: "report-ar-aging",
    title: "Report AR (Rekap Aging Pelanggan, Belum Lunas)",
    keywords: [
      "report ar",
      "aging",
      "umur piutang",
      "piutang",
      "belum lunas",
      "rekap aging",
      "usia faktur",
    ],
    answer:
      "Quick Action Report AR atau Laporan > Laporan Keuangan > Laporan AR (/financial-reports/aging). Pilih Bulan, Tahun dan Pelanggan (atau Semua) lalu Menampilkan untuk melihat tabel, atau Ekspor Excel. Isinya invoice terbit pada bulan itu yang belum lunas: tanggal faktur, No. KWT/INV, nama perusahaan, jumlah tagihan, KETENTUAN (Termin pelanggan dari master Termin, misalnya 21 Hari; bila pelanggan tidak punya termin dipakai jatuh tempo - tanggal invoice), USIA FAKTUR (hari sejak tanggal invoice) dan sisa tagihan pada kolom 0 s/d 21 hari, > 21 = 30 hari atau > 30 hari; HASIL AKHIR berisi total tiap kolom dan persentasenya terhadap total Jumlah Tagihan (NAN% bila tidak ada tagihan, seperti di aplikasi lama). Tanggal dan nama penerima faktur diambil dari Serah Terima Faktur di detail invoice ('-' bila belum dicatat). Aturan umur dan isi kolom menunggu konfirmasi bagian keuangan. Laporan umur piutang per customer (lewat jatuh tempo) tetap ada di Laporan Keuangan.",
    href: "/financial-reports/aging",
  },
  {
    id: "report-ap-aging",
    title: "Laporan AP (Rekap Aging Pemasok)",
    keywords: [
      "laporan ap",
      "aging pemasok",
      "hutang",
      "umur hutang",
      "rekap aging pemasok",
      "vendor",
      "agen",
    ],
    answer:
      "Laporan > Laporan Keuangan > Laporan AP (/financial-reports/ap-aging). Pilih Bulan, Tahun dan Pemasok lalu Menampilkan atau Ekspor Excel. Isinya tagihan vendor/agen dari Proses Vendor yang belum lunas dan bertanggal faktur di bulan itu: nama perusahaan, No. KWT/INV, tanggal faktur, ATAS (Vendor/Agen/Lainnya), batas waktu (tanggal terima atau faktur + termin), jumlah tagihan, kolom umur 0-30, 31-60, 61-90 dan > 90 hari sejak tanggal faktur, serta keterangan Lewat batas waktu. HASIL AKHIR berisi total dan persentase terhadap total tagihan. Tagihan yang sudah ditutup di Pembayaran Hutang (Lunas) tidak tampil. Butuh hak Pembayaran Hutang: lihat.",
    href: "/financial-reports/ap-aging",
  },
  {
    id: "perkiraan-structure",
    title: "Perkiraan: induk, rugi laba, cabang dan saldo awal",
    keywords: [
      "perkiraan",
      "akun",
      "induk",
      "ledger",
      "opening balance",
      "saldo awal",
      "kategori rugi laba",
      "cost centre",
      "inisial",
      "tampil",
    ],
    answer:
      "Akunting > Data Akun (juga Master Data > Perkiraan). Tiap akun (Perkiraan) punya Kode Rekening, Nama, Inisial, Induk, Klasifikasi, Kategori akun, Tampil (Show/Hide), Kategori Rugi Laba (khusus akun pendapatan/beban) dan Cabang (kosong = Nasional). Akun tanpa induk berfungsi sebagai Ledger/grup, akun yang punya induk adalah Child; induk tidak boleh melingkar. Posisi (Neraca atau Rugi Laba) dan tanda +/- di Rugi Laba otomatis dari klasifikasi, jadi tidak perlu diisi. Tabel menampilkan Saldo dari jurnal terposting di sisi saldo normal. Kategori Rugi Laba dikelola di bagian Kategori Rugi Laba (kode dan nama). Opening Balance (saldo awal): pilih akun, akun lawan ekuitas (mis. Laba Ditahan), cabang, tanggal dan jumlah; sistem membuat jurnal saldo awal yang langsung terposting (butuh hak Jurnal: posting dan periode belum ditutup). Satu saldo awal per akun per cabang; untuk mengubah, balik jurnal saldo awal di menu Jurnal lalu isi ulang.",
    href: "/finance/accounting/accounts",
  },
  {
    id: "hitung-rugi-laba",
    title: "Hitung Rugi Laba",
    keywords: [
      "rugi laba",
      "laba rugi",
      "hitung rugi laba",
      "profit loss",
      "cost centre",
      "current year",
    ],
    answer:
      "Akunting > Hitung Rugi Laba (/akunting/rugi-laba). Pilih Bulan, Tahun dan Cost Centre (NASIONAL = semua cabang yang boleh Anda lihat, atau satu cabang) lalu Search. Hasilnya dari jurnal terposting akun pendapatan dan beban, dikelompokkan per Kategori Rugi Laba: KODE AKUN, INDUK, HASIL bulan itu, % terhadap pendapatan bulan itu (nan % bila belum ada pendapatan) dan Current Year (Januari sampai bulan terpilih), dengan TOTAL per kategori dan LABA (RUGI) BERSIH. Pendapatan bernilai plus, beban minus. Akun tanpa kategori masuk Tanpa Kategori Rugi Laba. Butuh hak Laporan keuangan: lihat.",
    href: "/akunting/rugi-laba",
  },
  {
    id: "scan-koli-transit-inbound",
    title: "Scan koli Transit / Inbound (User Transit, Transit Date, Acc. In)",
    keywords: [
      "scan transit",
      "scan inbound",
      "cek transit",
      "cek inbound",
      "user transit",
      "transit date",
      "acc in",
      "sisa koli",
      "scan koli",
    ],
    answer:
      "Modul > Operasional > Manifest, tab Transit (Cek Transit) atau Inbound (Cek Inbound), klik Scan pada manifest. Ketik atau scan No. AWB/Koli lalu Enter (scanner genggam atau kamera HP juga bisa): label koli AWB-n mencatat koli itu, nomor AWB saja mencatat koli berikutnya; satu koli hanya bisa di-scan sekali. Tabel menampilkan Biaya Kirim, Berat Terbesar, Total Koli, Scan Koli dan Sisa Koli per AWB serta GRAND TOTAL. Scan Transit hanya untuk cabang yang namanya ada di Transit1-5 manifest (Transit Ke- menunjukkan urutannya), Scan Inbound hanya untuk cabang tujuan; manifest Draft belum bisa di-scan; butuh hak Manifest: ubah. Scan transit pertama mengisi kolom User Transit dan Transit Date di Cek Transit; scan inbound pertama sebuah AWB mengisi Acc. In di Status Pengantaran; semua scan tampil di Tracking Details. Pindah Manifest belum tersedia sampai aturan D-08 (AWB pindah manifest) diputuskan.",
    href: "/manifest?type=Transit",
  },
  {
    id: "booking",
    title: "Booking",
    keywords: [
      "booking",
      "pesan",
      "pickup",
      "jemput",
      "tambah booking",
      "nomor booking",
      "barcode booking",
      "print booking",
      "slip",
    ],
    answer:
      "Modul > Layanan Pelanggan > Booking. Booking adalah pesanan jemput (pickup) yang berdiri sendiri, tidak tertaut ke AWB. Klik Tambah Booking: form-nya sama seperti di aplikasi lama (Asal, Tujuan, Customer, data pengirim dan penerima, Layanan, DOC/PAC, Kurir, Via Moda, Pembayaran, Isi Barang, Keterangan, Koli/Volume/Berat, Harga/Kg, Min KG, Total harga, Grand Total dan Ganti Harga). Asal langsung terisi cabang Anda dan AWB No. booking langsung berisi nomor otomatis (B- + kode cabang + tahun bulan + nomor urut) yang terkunci; tekan Manual AWB untuk mengosongkan kolom dan mengetik nomor sendiri (tidak boleh dobel di cabang yang sama). Kolom wajib (bertanda *): Asal, Tujuan, Nama, Alamat dan No. Telp Pengirim (untuk penjemputan) serta Koli minimal 1; berat dan data penerima boleh menyusul. Tombol Dimensi menghitung Volume per koli (P x L x T dibagi pembagi Via Moda) dan Berat, sama seperti di Entry AWB. Memilih Kurir di form langsung menugaskan booking ke kurir itu (kurir harus dari cabang Asal). Status awal WAITING TO PICKUP. Admin cabang dengan hak Booking: Setujui menekan ✔ Tugaskan (pilih kurir dari cabang booking) atau ✖ Batal (wajib alasan, status CANCEL PICKUP). Kurir membuka Scan AWB, memilih mode Booking (jemput), scan barcode slip booking lalu Konfirmasi Jemput: status menjadi PROGRESS PICKUP. Booking cabang lain ditolak dengan pesan No. Booking tidak sesuai dengan cabang asal kurir; booking yang belum ditugaskan kurir belum bisa dijemput. AWB dibuat terpisah oleh admin setelah barang tiba. Print atau Print terpilih (barcode) mencetak slip booking dengan barcode dan QR. Tab Inbound Booking menampilkan booking yang Tujuannya cabang Anda.",

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
      "Modul > Layanan Pelanggan > Transaksi > On Site Outbound, lalu Tambah AWB. Asal langsung terisi cabang Anda dan kolom AWB No. langsung berisi nomor otomatis (kode cabang asal + tahun bulan + nomor urut, contoh JKT261100001); nomor dikunci saat disimpan sehingga tidak bentrok dengan pengguna lain. Untuk nomor sendiri tekan Manual AWB: kolom dikosongkan dan bisa diketik (tidak boleh dobel di cabang asal); Nomor Otomatis mengembalikannya. DO / Reff boleh berisi beberapa nomor DO (maks. 255 karakter). Kolom wajib (bertanda *): Asal, Tujuan, Nama Pengirim, Nama, Alamat dan No. Telp Penerima, Layanan, Pembayaran, Koli (minimal 1) dan Berat (Kg); bila ada yang kosong muncul pesan Wajib diisi beserta daftar kolomnya. Pilih Pricing Type (Harga/Kg, Harga/Koli, Trucking), Pickup By, Asal, Tujuan, Customer, Marketing, data pengirim dan penerima (pilih Penerima untuk mengisi otomatis), Layanan, DOC/PAC, Via Moda, Pembayaran, koli, volume dan berat. Harga/Kg dan Min KG terisi dari tarif Cek Ongkir bila ada. Grand Total = harga x Terberat (minimal Min KG) / koli / tarif tetap + biaya lain, packing, pickup - discount + PPN, dihitung ulang oleh server. Ganti Harga = isi Grand Total manual. Kirim ulang form yang sama tidak membuat AWB ganda. Tombol Dimensi (di samping Koli) membuka tabel per koli: isi Panjang, Lebar, Tinggi (cm), Berat, centang Packing dan Biaya Packing; Volume = P x L x T dibagi pembagi Via Moda dari Master Moda (DARAT 4000, UDARA 6000, LAUT 1.000.000); Berat diambil per koli = nilai terbesar antara volume dan berat koli itu, dan Terberat = jumlah Berat diambil semua koli (seperti aplikasi lama). Copy menyalin ukuran ke koli berikutnya, Copy All menyalin koli 1 ke semua koli. Berikutnya mengisi Volume, Berat, Terberat dan Biaya Packing form (pilih Via Moda dulu); mengubah Koli/Berat/Volume secara manual membuang Terberat dari Dimensi. Tab On Site Inbound menampilkan AWB yang menuju cabang Anda.",
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
      "Modul > Layanan Pelanggan > Inbound Booking (tab di halaman Booking) menampilkan booking yang menuju cabang Anda: tujuan booking sama dengan nama cabang Anda.",
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
    id: "scan-awb",
    title: "Scan AWB (Scan & Konfirmasi)",
    keywords: [
      "scan",
      "scanner",
      "kamera",
      "barcode",
      "update status",
      "diterima",
      "retur",
      "tanda tangan",
      "progi",
      "kurir",
    ],
    answer:
      'Fitur ini tersembunyi sampai admin server mengisi FEATURE_AWB_SCAN="true" dan grup Anda diberi hak Scan AWB (Pakai) di Hak Akses Menu. Bila aktif, tombol Scan AWB muncul di daftar AWB. Pilih yang di-scan: AWB / Resi atau Booking (jemput). Mode Booking menampilkan data booking dan tombol Konfirmasi Jemput (lihat penjelasan Booking). Untuk AWB: scan barcode/QR resi dengan scanner genggam, kamera HP (Chrome Android) atau ketik nomor lalu Enter. Muncul data Pengirim, Penerima, Tracking details dan foto/tanda tangan terakhir. Klik Update Status: pilih DITERIMA (nama penerima wajib) atau RETUR, isi keterangan, foto 1–5 dan tanda tangan (opsional, digores di kotak putih). DITERIMA mengubah AWB menjadi Delivered; RETUR mengubah AWB menjadi Returned. AWB Returned bisa dikirim ulang: ubah ke In Transit atau langsung scan DITERIMA (riwayat mencatat Returned → In Transit → Delivered). Hasilnya ikut tercatat di DRS dan detail AWB. Hanya AWB cabang Anda yang bisa di-scan.',
    href: "/transactions",
  },
  {
    id: "barcode",
    title: "Barcode dan QR (AWB, booking, manifest, DRS)",
    keywords: [
      "barcode",
      "qr",
      "label",
      "cetak",
      "print",
      "koli label",
      "scan",
    ],
    answer:
      "Resi AWB, slip booking, manifest dan DRS dicetak dengan barcode Code 128 dan QR berisi nomornya, sehingga bisa dibaca scanner genggam, kamera HP atau aplikasi kurir. Cetak AWB dari daftar Transaksi (centang lalu Print terpilih; tiap AWB dicetak 3 rangkap SHIPPER/OPERATIONAL/BILLING dalam satu lembar A4), slip booking dari daftar Booking, manifest dan DRS dari daftar/detail manifest. Label per koli: centang AWB di daftar Transaksi lalu Print label koli, atau Print label koli di detail AWB. Setiap koli mendapat label sendiri bernomor AWB-1, AWB-2, … (Koli n dari N) dengan barcode dan QR; scan label koli di Scan AWB membuka AWB induknya.",
    href: "/transactions",
  },
  {
    id: "relations",
    title: "Alur dan relasi antar fitur",
    keywords: [
      "alur",
      "relasi",
      "hubungan",
      "proses",
      "urutan",
      "flow",
      "cara kerja",
    ],
    answer:
      "Alur utama: Booking (pesanan jemput: WAITING TO PICKUP → kurir ditugaskan → scan jemput PROGRESS PICKUP, atau CANCEL PICKUP; berdiri sendiri) → AWB/Transaksi (dibuat admin di kantor, terpisah dari booking; label per koli AWB-n; harga dari tarif Cek Ongkir) → Manifest (AWB dimuat ke kendaraan/vendor) → DRS/Lembar Pengantaran (dari detail manifest, atau DRS Kurir Kota tanpa manifest) → Hasil antar dan Bukti Terima (DRS, detail AWB atau Scan AWB) → POD Kembali (bukti dikirim balik ke cabang asal, disetujui cabang tujuan) → Invoice dan pembayaran customer. Pendukung: Proses Vendor untuk AWB yang diteruskan ke vendor, Persetujuan Edit/delete AWB untuk mengubah atau menghapus AWB, Pembayaran Hutang untuk invoice vendor/agen, laporan cabang/kurir/keuangan membaca data dari alur ini. Hak akses per grup menentukan menu dan cabang yang bisa dibuka.",
  },
  {
    id: "access",
    title: "Hak akses, Akses ditolak dan notifikasi",
    keywords: [
      "akses",
      "hak akses",
      "ditolak",
      "izin",
      "permission",
      "role",
      "grup",
      "notifikasi",
      "lonceng",
    ],
    answer:
      "Menu dan halaman mengikuti hak grup di Sistem Setting > Hak Akses Menu (kolom Lihat, Tambah, Ubah, Hapus, Setujui, Ajukan, Ekspor, Pakai, dll). Bila hak kurang, halaman menampilkan Akses ditolak beserta hak yang dibutuhkan; data cabang lain tampil sebagai Data tidak ditemukan. Lonceng di kanan atas menunjukkan jumlah Persetujuan Edit/delete AWB dan POD Kembali yang menunggu keputusan Anda (diperbarui tiap pindah halaman dan setiap menit).",
    href: "/hak-akses-menu",
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
      "bukti terima",
      "tanda tangan",
      "foto penerima",
      "resi",
    ],
    answer:
      "Buka AWB dari daftar Transaksi. Halaman detail menampilkan barcode Code 128 nomor AWB, semua data pengiriman dan harga (format Rupiah), bagian Bukti Terima (POD) berisi hasil antar, nama penerima, keterangan, foto penerima 1–5 dan tanda tangan (dari DRS atau Scan AWB), panel Edit/Hapus AWB (lewat persetujuan) beserta riwayat sebelum → sesudah, dan riwayat status. Print AWB membuka resi di tab baru: satu lembar A4 per AWB berisi 3 rangkap (SHIPPER, OPERATIONAL, BILLING) seperti aplikasi lama, masing-masing dengan kop dan logo perusahaan, barcode dan QR, pengirim, penerima, Origin, Destination, No. Reff, Weight, Volume, Payment, Service, rincian harga, isi kiriman, instruksi khusus, kolom tanda tangan dan nama pembuat AWB. Di atas resi pilih Tipe print: Harga (nilai harga dicetak) atau Non Harga (kotak harga tetap ada tetapi kosong). Harga tidak pernah dicetak bila master Perusahaan tidak mengizinkannya.",

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
      "Di detail AWB, bagian Ubah Status (hanya tampil untuk grup yang punya hak Transaksi: ubah). Urutan yang diizinkan: Open → In Transit → Delivered, atau Open/In Transit → Cancelled. Setiap perubahan tercatat (siapa, kapan, alasan) dan tampil di tracking. Kurir mencatat hasil antar lewat DRS di detail manifest atau lewat Scan AWB (bila diaktifkan); DITERIMA lewat scan otomatis mengubah AWB menjadi Delivered.",

    href: "/transactions",
  },
  {
    id: "tracking",
    title: "Tracking AWB",
    keywords: ["tracking", "lacak", "cek resi", "cari awb", "lookup"],
    answer:
      "Gunakan Tracking AWB (Quick Action di Dashboard atau Cek Resi). Cari dengan No. AWB (label koli AWB-n juga bisa) atau No. DO; bila ada beberapa hasil, pilih salah satu. Hasilnya seperti di aplikasi lama: AWB, DO, pengirim/penerima dan alamatnya, asal/tujuan, layanan, moda, koli, kilo, No. Manifest, Driver (kurir manifest dan nopol), No. DRS, No. Invoice, tanggal diterima, diterima oleh, lead time (hari dari tanggal AWB sampai diterima), catatan AWB, Foto dan Foto II bukti terima, serta Tracking Details (input, masuk manifest, perubahan status, DITERIMA/RETUR). Hanya AWB dari/ke cabang Anda yang tampil.",

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
      "Modul > Operasional > Manifest. Tambah Manifest: isi nomor, tanggal, jenis, cabang pemilik, asal, tujuan, kendaraan, kurir dan vendor. Manifest dibuat berstatus Draft. Di detail manifest, ketik nomor AWB lalu Tambahkan. Satu AWB hanya boleh di satu manifest aktif; total koli/berat/volume dihitung otomatis. Tab Transit (Cek Transit) menampilkan kolom Transit1 sampai Transit5, tab Inbound (Cek Inbound) satu kolom Transit berisi rute transit; kolom Kendaraan dan Driver (kurir manifest) tampil di semua tab.",
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
      "foto",
      "bukti terima",
    ],
    answer:
      "Di detail manifest, bagian Lembar Pengantaran: klik Buat DRS (satu DRS per manifest). Lalu di tabel AWB pilih hasil antar (Terkirim, Gagal, Retur) dan nama penerima, klik Simpan. Foto bukti terima (opsional) diunggah di detail AWB, bagian Bukti Terima (POD): pilih foto atau buka kamera, foto dikompres ke WebP lalu disimpan di Cloudinary; foto yang sudah ada tidak bisa diganti. Konfirmasi DITERIMA/RETUR lewat Scan AWB otomatis mengisi hasil antar di DRS yang sama. Cetak manifest/DRS memuat barcode dan QR. Terkirim mengubah status AWB menjadi Delivered; Terkirim dan Retur bersifat final.",

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
      "Modul > Pemasaran/Penjualan. Tab Customer dan Penerima: cari, tambah (klik + Tambah), ubah dan hapus. Isian WA Notif (Aktif/Nonaktif) menentukan apakah customer itu boleh menerima notifikasi WhatsApp; default Nonaktif. Pengguna cabang hanya bisa mengubah data cabangnya sendiri; data 'Semua cabang' hanya bisa dibuat admin. Data yang dihapus tetap tercatat di AWB lama.",
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
      "Modul > Keuangan > Invoice (atau Invoice (New)). Buat draft dengan memilih customer dan AWB (satu AWB hanya di satu invoice aktif), lalu Terbitkan (nomor INV-…). Catat pembayaran sebagian atau penuh; status Belum dibayar/Sebagian/Lunas dihitung otomatis. Setelah faktur diterima pelanggan, isi Serah Terima Faktur di detail invoice (tanggal terima dan nama penerima, hak Invoice: ubah; tanggal tidak boleh sebelum tanggal invoice atau di masa depan); datanya tampil di Report AR. Di daftar invoice, filter Status bayar: Lunas (Invoice Paid, juga dari Quick Action) atau Belum lunas (terbit tapi belum dibayar penuh). Koreksi: balik pembayaran, lalu VOID dengan alasan dan buat invoice baru.",
    href: "/finance/invoices",
  },
  {
    id: "accounting",
    title: "Akunting (menu seperti web sandbox)",
    keywords: [
      "akunting",
      "akuntansi",
      "jurnal",
      "akun",
      "perkiraan",
      "biaya aktual",
      "tutup periode",
      "cover",
      "laba rugi",
      "arus kas",
      "gp",
      "neraca",
      "neraca saldo",
      "buku besar",
      "general ledger",
    ],
    answer:
      "Menu Akunting mengikuti web sandbox (web asli tidak punya menu Akunting): Data Akun; Assets; Master (General Ledger = akun tanpa induk, Kategori Akun, Kategori Rugi Laba, Master Arus Kas, Master Rugi Laba, Cost Centre, Kategori Assets); Kas Bank (Buku Bank, Kasir Penerimaan Lainnya, Kasir Penerimaan Invoice, Kasir Pembayaran Lainnya, Kasir Pembayaran Vendor, Bukti Jurnal Umum, Rekonsiliasi Bank); Penyesuaian (Kasir = List Posting, Memorial, Penyesuaian Penjualan, Biaya Aktual); Laporan (Neraca, Buku Besar, Rugi Laba, Neraca Saldo, Cover = tutup periode, Arus Kas & Gross Profit). Semua laporan memakai jurnal terposting di cabang yang boleh Anda lihat. Jurnal terposting tidak bisa dihapus; koreksi dengan balik jurnal.",
    href: "/akunting/posting",
  },
  {
    id: "kas-bank",
    title: "Kas Bank: kasir penerimaan dan pembayaran",
    keywords: [
      "kas bank",
      "kasir",
      "penerimaan lainnya",
      "pembayaran lainnya",
      "pembayaran vendor",
      "bukti jurnal umum",
      "nomor bukti",
      "posting",
      "buku bank",
      "rekonsiliasi",
      "saldo bank",
    ],
    answer:
      "Akunting > Kas Bank. Kasir Penerimaan Lainnya (uang masuk selain invoice), Kasir Pembayaran Lainnya (uang keluar), Kasir Pembayaran Vendor (wajib pilih vendor) dan Bukti Jurnal Umum (Kas/Bank di Kredit): isi Cabang, Nomor Bukti (kosong = otomatis BKM/BKK/BKV/BJU-YYMM-urut), Tanggal, Kas & Bank, Keterangan, Cost Centre (opsional, harus cabang yang sama), lalu baris Kode Rekening, Keterangan, Jumlah dan Posisi (Debet/Kredit). Kas/Bank otomatis mengambil selisih baris (penerimaan: Debet; pembayaran: Kredit). Masukan menyimpan Draft; Posting dan Hapus Nomor Bukti ada di bukti itu atau di Penyesuaian > Kasir. Akun kontrol (piutang, pendapatan, biaya, hutang yang dipetakan cabang) hanya lewat invoice/pembayaran/biaya. Kasir Penerimaan Invoice: pilih invoice belum lunas lalu Terima Pembayaran (jurnal Kas D / Piutang K otomatis). Buku Bank: mutasi akun kas/bank dengan saldo berjalan dan akun lawan. Rekonsiliasi Bank: isi Saldo di Bank per tanggal; Saldo di Sistem dan Selisih tampil otomatis. Hak: Jurnal buat (simpan/hapus draft), Jurnal posting (posting, saldo bank), Jurnal balik.",
    href: "/akunting/kasir-penerimaan",
  },
  {
    id: "laporan-akunting",
    title: "Neraca, Neraca Saldo, Buku Besar, Assets dan Cost Centre",
    keywords: [
      "neraca",
      "neraca saldo",
      "trial balance",
      "buku besar",
      "aktiva",
      "passiva",
      "assets",
      "aset",
      "penyusutan",
      "cost centre",
      "kategori assets",
    ],
    answer:
      "Akunting > Laporan. Neraca: AKTIVA vs PASSIVA (kewajiban, ekuitas dan laba/rugi berjalan) per tanggal, filter Cabang dan Cost Centre, centang Masukan Saldo Kosong untuk akun bersaldo 0. Neraca Saldo: Saldo Awal Debet/Kredit, Mutasi Debet/Kredit dan Saldo per akun untuk periode; Tampil Induk/Anak (induk menjumlahkan anaknya). Buku Besar: pilih akun, periode dan Cost Centre untuk mutasi dan saldo berjalan. Assets: daftar aktiva tetap (Jenis Aktiva, Kategori, Unit, Tgl/Hrg Perolehan, Kel, Penambahan, Pengurangan, Masa Bulan) dengan penyusutan garis lurus per bulan, akumulasi dan nilai buku dihitung otomatis (tampilan, belum diposting ke jurnal). Kategori Assets berisi COA dan COA Lawan. Cost Centre: kode, nama, cabang dan status; dipakai di kasir dan filter laporan. Hak: Akun dan kategori kelola untuk master; Laporan keuangan lihat untuk laporan.",
    href: "/akunting/neraca",
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
      "Laporan Keuangan menampilkan saldo invoice terbit yang belum lunas per customer per hari ini, dikelompokkan: belum jatuh tempo, 1–30, 31–60, 61–90, lebih dari 90 hari. Hutang vendor/agen ada di Laporan Keuangan > Laporan AP.",
    href: "/financial-reports",
  },
  {
    id: "kurir-kota",
    title: "Kurir Kota (DRS tanpa manifest) dan Print DRS",
    keywords: [
      "kurir kota",
      "drs",
      "lembar pengantaran",
      "delivery sheet",
      "print drs",
      "antar kota",
    ],
    answer:
      "Modul > Operasional / Lembar Pengantaran > Kurir Kota: isi Tanggal, Cabang, Kurir (wajib), Driver, Nopol, Agen dan Keterangan lalu Simpan; DRS No. otomatis (DRS-kode cabang-tahun bulan-urut) bila dikosongkan. Di detail DRS ketik atau scan nomor AWB lalu Tambahkan. AWB harus dalam cakupan cabang Anda, belum Delivered/Cancelled, dan tidak sedang menunggu hasil di DRS lain. Catat hasil antar (Terkirim, Gagal, Retur) per AWB; Terkirim mengubah AWB menjadi Delivered. AWB yang belum punya hasil bisa dihapus dari DRS; DRS tanpa hasil antar bisa dihapus. Print DRS mencetak daftar AWB untuk ditandatangani penerima. Konfirmasi lewat Scan AWB juga mengisi hasil di DRS ini.",
    href: "/delivery-sheets",
  },
  {
    id: "proses-vendor",
    title: "Proses Vendor",
    keywords: ["proses vendor", "vendor", "awb vendor", "pihak ketiga"],
    answer:
      "Modul > Operasional > Proses Vendor: catat AWB yang diteruskan ke vendor (Tanggal, AWB, Vendor, AWB Vendor, Keterangan). Satu AWB hanya boleh punya satu proses vendor aktif; bila salah, hapus lalu catat ulang. Data milik cabang asal atau tujuan AWB yang ada di cakupan Anda. Hak akses: Proses Vendor lihat/tambah/hapus.",
    href: "/vendor-processes",
  },
  {
    id: "rekap-manifest",
    title: "Rekap Manifest",
    keywords: ["rekap manifest", "recap manifest", "manifest bulanan"],
    answer:
      "Laporan > Laporan Cabang > Rekap Manifest: pilih Bulan, Tahun, Cabang (atau semua cabang Anda) dan Jenis Lembar, klik Tampilkan. Tabel menampilkan per manifest total AWB aktif, koli, berat, volume, kendaraan, kurir, vendor dan status. Ekspor Excel: Multiple Sheet = satu sheet per tanggal manifest, One Sheet = semua dalam satu sheet.",
    href: "/branch-reports/rekap-manifest",
  },
  {
    id: "detail-kurir",
    title: "Laporan Detail Kurir",
    keywords: ["detail kurir", "laporan kurir", "sukses", "pending", "failed"],
    answer:
      "Laporan > Laporan Kurir > Laporan Detail Kurir: setiap AWB di DRS (dari manifest maupun Kurir Kota) dengan kurir, asal, tujuan, pengirim, layanan, status, penerima, diterima oleh, tanggal diterima dan L.Time (Lead Time AWB). Status: Sukses = Terkirim, Failed = Gagal atau Retur, Pending = belum dicatat. Filter periode, cabang, kurir dan status; total Sukses/Pending/Failed di atas tabel.",
    href: "/courier-reports/detail",
  },
  {
    id: "cod-asuransi",
    title: "COD, asuransi, PIC dan Lead Time di Entry AWB",
    keywords: [
      "cod",
      "asuransi",
      "nilai barang",
      "biaya cod",
      "pic",
      "lead time",
      "show price",
      "harga di resi",
    ],
    answer:
      "Di Entry AWB isi PIC 1, PIC 2 dan Lead Time setelah data penerima. Di bagian harga: Nilai Barang dan Nilai COD hanya dicatat (tidak menambah Grand Total); Biaya Asuransi dan Biaya COD ikut dijumlahkan ke Total Biaya seperti Biaya Lain, lalu dipotong Discount dan ditambah PPN. Nilai COD tercetak di resi dan di DRS supaya kurir menagih penerima. Show Price Print AWB = Tidak menyembunyikan harga di resi AWB ini, walaupun dicetak dengan tipe Harga.",
    href: "/transactions/new",
  },
  {
    id: "whatsapp-cabang",
    title: "WhatsApp per cabang",
    keywords: ["whatsapp", "wa", "qr", "nomor wa", "notifikasi wa", "wa notif"],
    answer:
      "Kantor > Perusahaan > WA Notifikasi > WhatsApp per cabang: satu gateway WhatsApp melayani semua cabang, tiap cabang memakai nomornya sendiri. Admin memilih cabang dan klik Hubungkan nomor; QR muncul sendiri dan diperbarui otomatis selama 2 menit. Di HP cabang buka WhatsApp > Perangkat tertaut > Tautkan perangkat lalu pindai QR; status menjadi Terhubung. Putuskan koneksi = logout dan hapus sesi cabang itu. Satu nomor tidak bisa dipakai dua cabang. Pesan WhatsApp dari satu cabang dikirim berurutan dengan jeda minimal 10 detik.",
    href: "/office/company",
  },
  {
    id: "whatsapp-notifikasi",
    title: "Notifikasi WhatsApp otomatis",
    keywords: [
      "pesan whatsapp",
      "pesan wa",
      "template wa",
      "notif wa",
      "wa otomatis",
      "kirim wa",
      "customer aktif wa",
    ],
    answer:
      "Sama seperti web asli, ada 4 pesan otomatis di Kantor > Perusahaan > WA Notifikasi > Lihat Pesan Whatsapp: (1) Transaksi ke Pengirim dan (2) Transaksi ke Penerima saat AWB disimpan; (3) Shipment Status ke Pengirim saat AWB berstatus Delivered (diterima, lewat Scan & Konfirmasi, import status, hasil DRS, atau ubah status); (4) Delivery Sheet ke Penerima saat AWB masuk DRS (Kurir Kota) atau DRS manifest dibuat. Penerima tiap pesan tetap; isi pesan dan Status on/off bisa diubah (hak Konfigurasi WhatsApp: update). Variabel seperti {awb}, {namaPengirim}, {namaPenerima}, {alamatPenerima}, {cabangAsal}, {cabangTujuan}, {tglKonos}, {diterima}, {tglDiterima}, {jamDiterima}, {namaKurir}, {namaPerusahaan} diisi dari AWB. Pesan hanya dikirim untuk AWB milik customer yang WA Notif-nya Aktif (Pemasaran > Customer; daftarnya tampil di List Customer Aktif WA Notifikasi) dan bila nomor pengirim/penerima di AWB valid (08…/62…). Nomor pengirim pesan adalah WA cabang yang melakukan kejadian; bila belum terhubung dipakai cabang asal/tujuan AWB. Pesan diantrekan setelah data tersimpan dan dikirim berjeda ±10 detik; gagal kirim dicoba ulang sampai 5 kali dalam 24 jam.",
    href: "/office/company",
  },
  {
    id: "ticketing",
    title: "Ticketing",
    keywords: ["tiket", "ticket", "ticketing", "keluhan", "support", "bantuan"],
    answer:
      "Menu Ticketing > Tiket Support: buat tiket (cabang, prioritas, judul, menu, link halaman, catatan), lihat daftar dan detail. Status tiket Open → In Progress → Finish diubah tim support (hak Ticketing: manage) di detail tiket. Setelah Finish, pembuat tiket membuka Ticketing > Persetujuan Tiketing lalu memilih Approve Finish (selesai, final) atau Revisi (wajib catatan; tiket kembali Open). Pembuat melihat tiketnya sendiri; tim support melihat tiket cabangnya; admin melihat semua.",
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
      "Menu Kantor: Perusahaan, Kantor Cabang, Kantor dan Agen. Sistem memakai satu perusahaan: di menu Perusahaan datanya hanya bisa diubah (nama, alamat, logo, pengaturan harga di resi), tidak bisa ditambah atau dihapus. Semua data operasional dan laporan dibatasi ke cabang yang ditugaskan ke user.",
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
      "Tanggal dan waktu bisnis di seluruh sistem memakai Asia/Jakarta. Timestamp teknis tetap dikirim sebagai UTC dan ditampilkan dalam waktu Jakarta. Laporan operasional dibatasi 31 hari per tampilan, laporan rekap 92 hari. Jika periode kosong, laporan dan dashboard memakai bulan berjalan.",
  },
  {
    id: "help",
    title: "Tentang chat bantuan",
    keywords: ["chat", "bantuan", "help", "tanya", "riwayat"],
    answer:
      "Chat ini menjawab dari daftar penjelasan fitur di aplikasi (tidak dikirim ke layanan luar). Riwayat chat tersimpan di browser Anda dan terhapus otomatis setelah 10 menit.",
  },
];
