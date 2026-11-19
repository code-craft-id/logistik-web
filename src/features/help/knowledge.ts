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
      "Quick Action Report AR (/financial-reports/aging). Pilih Bulan, Tahun dan Pelanggan (atau Semua) lalu Menampilkan untuk melihat tabel, atau Ekspor Excel. Isinya invoice terbit pada bulan itu yang belum lunas: tanggal faktur, No. KWT/INV, nama perusahaan, jumlah tagihan, KETENTUAN (Termin pelanggan dari master Termin, misalnya 21 Hari; bila pelanggan tidak punya termin dipakai jatuh tempo - tanggal invoice), USIA FAKTUR (hari sejak tanggal invoice) dan sisa tagihan pada kolom 0 s/d 21 hari, > 21 = 30 hari atau > 30 hari; HASIL AKHIR berisi total tiap kolom dan persentasenya terhadap total Jumlah Tagihan (NAN% bila tidak ada tagihan, seperti di aplikasi lama). Tanggal dan nama penerima faktur diambil dari Serah Terima Faktur di detail invoice ('-' bila belum dicatat). Aturan umur dan isi kolom menunggu konfirmasi bagian keuangan. Laporan umur piutang per customer (lewat jatuh tempo) tetap ada di Laporan Keuangan.",
    href: "/financial-reports/aging",
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
      "Modul > Layanan Pelanggan > Booking. Booking adalah pesanan jemput (pickup) yang berdiri sendiri, tidak tertaut ke AWB. Klik Tambah Booking: form-nya sama seperti di aplikasi lama (Asal, Tujuan, Customer, data pengirim dan penerima, Layanan, DOC/PAC, Kurir, Via Moda, Pembayaran, Isi Barang, Keterangan, Koli/Volume/Berat, Harga/Kg, Min KG, Total harga, Grand Total dan Ganti Harga). Asal langsung terisi cabang Anda dan AWB No. booking langsung berisi nomor otomatis (B- + kode cabang + tahun bulan + nomor urut) yang terkunci; tekan Manual AWB untuk mengosongkan kolom dan mengetik nomor sendiri (tidak boleh dobel di cabang yang sama). Kolom wajib (bertanda *): Asal, Tujuan, Nama, Alamat dan No. Telp Pengirim (untuk penjemputan) serta Koli minimal 1; berat dan data penerima boleh menyusul. Memilih Kurir di form langsung menugaskan booking ke kurir itu (kurir harus dari cabang Asal). Status awal WAITING TO PICKUP. Admin cabang dengan hak Booking: Setujui menekan ✔ Tugaskan (pilih kurir dari cabang booking) atau ✖ Batal (wajib alasan, status CANCEL PICKUP). Kurir membuka Scan AWB, memilih mode Booking (jemput), scan barcode slip booking lalu Konfirmasi Jemput: status menjadi PROGRESS PICKUP. Booking cabang lain ditolak dengan pesan No. Booking tidak sesuai dengan cabang asal kurir; booking yang belum ditugaskan kurir belum bisa dijemput. AWB dibuat terpisah oleh admin setelah barang tiba. Print atau Print terpilih (barcode) mencetak slip booking dengan barcode dan QR. Tab Inbound Booking menampilkan booking yang Tujuannya cabang Anda.",

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
      "Modul > Layanan Pelanggan > Transaksi > On Site Outbound, lalu Tambah AWB. Asal langsung terisi cabang Anda dan kolom AWB No. langsung berisi nomor otomatis (kode cabang asal + tahun bulan + nomor urut, contoh JKT261100001); nomor dikunci saat disimpan sehingga tidak bentrok dengan pengguna lain. Untuk nomor sendiri tekan Manual AWB: kolom dikosongkan dan bisa diketik (tidak boleh dobel di cabang asal); Nomor Otomatis mengembalikannya. DO / Reff boleh berisi beberapa nomor DO (maks. 255 karakter). Kolom wajib (bertanda *): Asal, Tujuan, Nama Pengirim, Nama, Alamat dan No. Telp Penerima, Layanan, Pembayaran, Koli (minimal 1) dan Berat (Kg); bila ada yang kosong muncul pesan Wajib diisi beserta daftar kolomnya. Pilih Pricing Type (Harga/Kg, Harga/Koli, Trucking), Pickup By, Asal, Tujuan, Customer, Marketing, data pengirim dan penerima (pilih Penerima untuk mengisi otomatis), Layanan, DOC/PAC, Via Moda, Pembayaran, koli, volume dan berat. Harga/Kg dan Min KG terisi dari tarif Cek Ongkir bila ada. Grand Total = harga x Terberat (minimal Min KG) / koli / tarif tetap + biaya lain, packing, pickup - discount + PPN, dihitung ulang oleh server. Ganti Harga = isi Grand Total manual. Kirim ulang form yang sama tidak membuat AWB ganda. Tab On Site Inbound menampilkan AWB yang menuju cabang Anda.",
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
      "Resi AWB, slip booking, manifest dan DRS dicetak dengan barcode Code 128 dan QR berisi nomornya, sehingga bisa dibaca scanner genggam, kamera HP atau aplikasi kurir. Cetak AWB dari daftar Transaksi (centang lalu Print terpilih), slip booking dari daftar Booking, manifest dan DRS dari daftar/detail manifest. Label per koli: centang AWB di daftar Transaksi lalu Print label koli, atau Print label koli di detail AWB. Setiap koli mendapat label sendiri bernomor AWB-1, AWB-2, … (Koli n dari N) dengan barcode dan QR; scan label koli di Scan AWB membuka AWB induknya.",
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
      "Alur utama: Booking (pesanan jemput: WAITING TO PICKUP → kurir ditugaskan → scan jemput PROGRESS PICKUP, atau CANCEL PICKUP; berdiri sendiri) → AWB/Transaksi (dibuat admin di kantor, terpisah dari booking; label per koli AWB-n; harga dari tarif Cek Ongkir) → Manifest (AWB dimuat ke kendaraan/vendor) → DRS/Lembar Pengantaran (dibuat dari manifest) → Hasil antar dan Bukti Terima (DRS, detail AWB atau Scan AWB) → POD Kembali (bukti dikirim balik ke cabang asal, disetujui cabang tujuan) → Invoice dan pembayaran customer. Pendukung: Persetujuan Edit/delete AWB untuk mengubah atau menghapus AWB, Pembayaran Hutang untuk invoice vendor/agen, laporan cabang/kurir/keuangan membaca data dari alur ini. Hak akses per grup menentukan menu dan cabang yang bisa dibuka.",
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
      "Buka AWB dari daftar Transaksi. Halaman detail menampilkan barcode Code 128 nomor AWB, semua data pengiriman dan harga (format Rupiah), bagian Bukti Terima (POD) berisi hasil antar, nama penerima, keterangan, foto penerima 1–5 dan tanda tangan (dari DRS atau Scan AWB), panel Edit/Hapus AWB (lewat persetujuan) beserta riwayat sebelum → sesudah, dan riwayat status. Print AWB membuka resi di tab baru dengan kop perusahaan, barcode dan QR (biaya tampil bila diizinkan di master Perusahaan).",

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
      "Akunting > Invoice. Buat draft dengan memilih customer dan AWB (satu AWB hanya di satu invoice aktif), lalu Terbitkan (nomor INV-…). Catat pembayaran sebagian atau penuh; status Belum dibayar/Sebagian/Lunas dihitung otomatis. Setelah faktur diterima pelanggan, isi Serah Terima Faktur di detail invoice (tanggal terima dan nama penerima, hak Invoice: ubah; tanggal tidak boleh sebelum tanggal invoice atau di masa depan); datanya tampil di Report AR. Di daftar invoice, filter Status bayar: Lunas (Invoice Paid, juga dari Quick Action) atau Belum lunas (terbit tapi belum dibayar penuh). Koreksi: balik pembayaran, lalu VOID dengan alasan dan buat invoice baru.",
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
