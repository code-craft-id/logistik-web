import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Container,
  Globe2,
  Package,
  Truck,
} from "lucide-react";
import TrackingPanel from "./tracking-panel";

export const metadata: Metadata = {
  title: "RED Logistik | Solusi Pengiriman Barang",
  description:
    "Jelajahi layanan Delivery Express, Trucking, Cargo, serta Export & Import dari RED Logistik.",
};

const containerClass =
  "mx-auto w-[calc(100%-64px)] max-w-[1320px] max-[1050px]:w-[calc(100%-40px)] max-[760px]:w-[calc(100%-32px)]";

const actionClass =
  "inline-flex min-h-[46px] items-center justify-center gap-3 border border-[var(--redlogistik-green,#0f5c4c)] bg-[var(--redlogistik-green,#0f5c4c)] px-[18px] text-sm font-bold text-white transition-colors duration-150 hover:border-[var(--redlogistik-red,#b42332)] hover:bg-[var(--redlogistik-red,#b42332)] motion-reduce:transition-none";

const textActionClass =
  "inline-flex items-center gap-[9px] text-sm font-bold text-[var(--redlogistik-green,#0f5c4c)] transition-colors hover:text-[var(--redlogistik-red,#b42332)] motion-reduce:transition-none";

const microLabelClass =
  "text-[11px] font-bold tracking-[0.12em] uppercase";

const serviceZones = [
  { code: "A1", label: "Delivery Express", href: "#delivery-express" },
  { code: "B2", label: "Trucking", href: "#trucking" },
  { code: "C3", label: "Cargo", href: "#cargo" },
  { code: "D4", label: "Export & Import", href: "#export-import" },
];

const services = [
  {
    id: "delivery-express",
    number: "01",
    name: "Delivery Express",
    description:
      "Pilihan pengiriman untuk kebutuhan yang mengutamakan kecepatan dan efisiensi biaya.",
    detail: [
      "Reguler dengan estimasi 2–7 hari melalui jalur darat, laut, atau udara.",
      "Satu Hari Sampai untuk kota-kota besar melalui prioritas udara.",
      "Sameday untuk pengiriman dalam kota dengan proses hingga 24 jam.",
    ],
    icon: Package,
  },
  {
    id: "trucking",
    number: "02",
    name: "Trucking",
    description:
      "Solusi pengiriman door-to-door dan kebutuhan sewa armada dalam kota maupun luar kota.",
    detail: [
      "Pilihan armada Carter Truck: Blindvan, CDE, CDD, FUSO, dan wingbox.",
      "Cocok untuk kebutuhan distribusi yang memerlukan kendaraan khusus.",
    ],
    icon: Truck,
  },
  {
    id: "cargo",
    number: "03",
    name: "Cargo",
    description:
      "Pengiriman barang dalam jumlah lebih besar dengan pilihan moda transportasi darat.",
    detail: [
      "Menggunakan kereta api dan truk sesuai kebutuhan pengiriman.",
      "Pilihan pengiriman darat ditujukan untuk kebutuhan yang lebih ekonomis dan fleksibel.",
    ],
    icon: Container,
  },
  {
    id: "export-import",
    number: "04",
    name: "Export & Import",
    description:
      "Layanan pengiriman untuk kebutuhan perdagangan lintas negara.",
    detail: [
      "Pengiriman dari luar negeri menuju Indonesia.",
      "Pengiriman dari Indonesia menuju luar negeri.",
    ],
    icon: Globe2,
  },
];

function Brand() {
  return (
    <Link
      href="/landing"
      className="inline-flex flex-[0_0_auto] items-baseline gap-[3px] text-[25px] font-extrabold tracking-[-0.055em] text-[var(--redlogistik-ink,#17231e)] max-[760px]:text-[22px]"
      aria-label="RED Logistik, beranda"
    >
      <span className="font-black text-[var(--redlogistik-red,#b42332)]">RED</span>
      <span
        className="-ml-1 text-[30px] font-black leading-[0.8] tracking-[-0.16em] text-[var(--redlogistik-red,#b42332)]"
        aria-hidden="true"
      >
        »
      </span>
      <span className="ml-[5px] tracking-[-0.045em]">Logistik</span>
    </Link>
  );
}

function YardMap() {
  return (
    <div className={`${containerClass} border-t border-[var(--redlogistik-line,#dce3df)] py-[18px] pb-[25px] max-[760px]:pt-[15px]`}>
      <div className="mb-3 flex justify-between gap-3 text-[10px] font-bold tracking-[0.12em] text-[var(--redlogistik-muted,#64746b)] uppercase">
        <span>AREA LAYANAN</span>
        <span>4 ZONA PENGIRIMAN</span>
      </div>
      <nav
        className="grid grid-cols-4 border border-[var(--redlogistik-line,#dce3df)] bg-[var(--redlogistik-paper,#fff)] max-[760px]:grid-cols-2"
        aria-label="Navigasi empat kategori layanan RED Logistik"
      >
        {serviceZones.map((zone, index) => (
          <Link
            className={`relative grid min-h-[78px] grid-cols-[auto_1fr_auto] items-center gap-[13px] px-[17px] py-[14px] text-[var(--redlogistik-ink,#17231e)] transition-colors hover:bg-[var(--redlogistik-tint,#e8f2ef)] motion-reduce:transition-none max-[760px]:min-h-[70px] max-[760px]:gap-[9px] max-[760px]:p-[11px] ${
              index > 0 ? "border-l border-[var(--redlogistik-line,#dce3df)]" : ""
            } ${
              index === 2
                ? "max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:border-[var(--redlogistik-line,#dce3df)]"
                : ""
            } ${
              index === 3
                ? "max-[760px]:border-t max-[760px]:border-[var(--redlogistik-line,#dce3df)]"
                : ""
            }`}
            href={zone.href}
            key={zone.code}
          >
            <span className="grid size-[34px] place-items-center border border-[var(--redlogistik-red,#b42332)] text-[10px] font-bold tracking-normal text-[var(--redlogistik-red,#b42332)]">
              {zone.code}
            </span>
            <span className="text-[13px] font-bold max-[760px]:text-[11px]">
              {zone.label}
            </span>
            <ArrowUpRight
              className="text-[var(--redlogistik-green,#0f5c4c)]"
              aria-hidden="true"
            />
          </Link>
        ))}
      </nav>
      <p className="mt-[9px] text-[10px] text-[var(--redlogistik-muted,#64746b)]">
        Penanda kategori layanan, bukan peta rute atau jaringan operasional.
      </p>
    </div>
  );
}

function ServiceList() {
  return (
    <div className="border-t border-[var(--redlogistik-ink,#17231e)]">
      {services.map((service) => {
        const Icon = service.icon;

        return (
          <article
            className="grid scroll-mt-[100px] grid-cols-[42px_42px_minmax(190px,0.85fr)_minmax(280px,1.15fr)_76px] items-start gap-5 border-b border-[var(--redlogistik-line,#dce3df)] py-[29px] pb-[31px] max-[1050px]:grid-cols-[34px_36px_minmax(170px,0.8fr)_minmax(230px,1.2fr)] max-[1050px]:gap-4 max-[760px]:grid-cols-[30px_38px_minmax(0,1fr)] max-[760px]:gap-[11px] max-[760px]:py-[23px]"
            id={service.id}
            key={service.id}
          >
            <span className={`${microLabelClass} pt-[5px] text-[var(--redlogistik-red,#b42332)]`}>
              {service.number}
            </span>
            <span className="grid size-[38px] place-items-center text-[var(--redlogistik-green,#0f5c4c)]" aria-hidden="true">
              <Icon size={28} strokeWidth={1.7} />
            </span>
            <div>
              <h3 className="m-0 text-[23px] font-bold tracking-[-0.04em] max-[760px]:text-[20px]">
                {service.name}
              </h3>
              <p className="mt-2 max-w-[38ch] text-[13px] leading-[1.6] text-[var(--redlogistik-muted,#64746b)]">
                {service.description}
              </p>
            </div>
            <ul className="m-0 grid list-disc gap-2 py-0 pl-[18px] text-[12px] leading-[1.6] text-[var(--redlogistik-muted,#64746b)] marker:text-[var(--redlogistik-red,#b42332)] max-[760px]:col-[3/-1] max-[760px]:mt-px">
              {service.detail.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a
              className={`${textActionClass} justify-self-end whitespace-nowrap pt-1 max-[1050px]:col-[3/-1] max-[1050px]:justify-self-start max-[760px]:col-[3/-1] max-[760px]:mt-[3px]`}
              href="https://www.redlogistik.co.id/product"
              target="_blank"
              rel="noreferrer"
              aria-label={`Lihat detail ${service.name} di situs RED Logistik`}
            >
              Detail <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </article>
        );
      })}
    </div>
  );
}

export default function RedLogistikLandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--redlogistik-paper,#fff)] text-[var(--redlogistik-ink,#17231e)] [font-family:var(--font-geist-sans,Arial),Helvetica,sans-serif] [&_a]:no-underline [&_a:focus-visible]:outline-[3px] [&_a:focus-visible]:outline-[color:var(--redlogistik-red,#b42332)] [&_a:focus-visible]:outline-offset-[3px] [&_button:focus-visible]:outline-[3px] [&_button:focus-visible]:outline-[color:var(--redlogistik-red,#b42332)] [&_button:focus-visible]:outline-offset-[3px] [&_input:focus-visible]:outline-[3px] [&_input:focus-visible]:outline-[color:var(--redlogistik-red,#b42332)] [&_input:focus-visible]:outline-offset-[3px] [&_summary:focus-visible]:outline-[3px] [&_summary:focus-visible]:outline-[color:var(--redlogistik-red,#b42332)] [&_summary:focus-visible]:outline-offset-[3px] motion-reduce:scroll-auto">
      <a
        className="absolute left-3 top-3 z-20 h-px w-px overflow-hidden whitespace-nowrap bg-[var(--redlogistik-paper,#fff)] text-[var(--redlogistik-ink,#17231e)] [clip:rect(0,0,0,0)] [clip-path:inset(50%)] focus:h-auto focus:w-auto focus:p-3 focus:[clip:auto] focus:[clip-path:none]"
        href="#konten"
      >
        Lewati ke konten
      </a>

      <header className="relative z-[5] border-b border-[var(--redlogistik-line,#dce3df)] bg-[var(--redlogistik-paper,#fff)]">
        <div className={`${containerClass} flex min-h-[78px] items-center justify-between gap-7 max-[760px]:min-h-[68px] max-[760px]:gap-3`}>
          <Brand />

          <nav
            className="ml-auto flex items-center gap-[clamp(22px,3.2vw,52px)] max-[760px]:hidden"
            aria-label="Navigasi utama"
          >
            <a className="relative py-2 text-sm font-semibold text-[var(--redlogistik-ink,#17231e)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--redlogistik-red,#b42332)] after:transition-transform after:duration-150 after:content-[''] hover:after:scale-x-100 motion-reduce:after:transition-none" href="#layanan">
              Layanan
            </a>
            <a className="relative py-2 text-sm font-semibold text-[var(--redlogistik-ink,#17231e)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--redlogistik-red,#b42332)] after:transition-transform after:duration-150 after:content-[''] hover:after:scale-x-100 motion-reduce:after:transition-none" href="#tentang">
              Tentang RED
            </a>
            <a className="relative py-2 text-sm font-semibold text-[var(--redlogistik-ink,#17231e)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--redlogistik-red,#b42332)] after:transition-transform after:duration-150 after:content-[''] hover:after:scale-x-100 motion-reduce:after:transition-none" href="#kontak">
              Kontak
            </a>
          </nav>

          <a
            className={`${actionClass} max-[760px]:hidden`}
            href="https://wa.me/628131600668"
            target="_blank"
            rel="noreferrer"
          >
            Hubungi kami <ArrowUpRight size={16} aria-hidden="true" />
          </a>

          <details className="relative ml-auto hidden max-[760px]:block">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--redlogistik-ink,#17231e)] [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              className="absolute right-0 top-[calc(100%+20px)] grid min-w-[210px] gap-0.5 border border-[var(--redlogistik-line,#dce3df)] bg-[var(--redlogistik-paper,#fff)] p-2"
              aria-label="Navigasi ringkas"
            >
              <a className="p-3 text-sm text-[var(--redlogistik-ink,#17231e)] hover:bg-[var(--redlogistik-tint,#e8f2ef)]" href="#layanan">Layanan</a>
              <a className="p-3 text-sm text-[var(--redlogistik-ink,#17231e)] hover:bg-[var(--redlogistik-tint,#e8f2ef)]" href="#tentang">Tentang RED</a>
              <a className="p-3 text-sm text-[var(--redlogistik-ink,#17231e)] hover:bg-[var(--redlogistik-tint,#e8f2ef)]" href="#kontak">Kontak</a>
              <a className="p-3 text-sm text-[var(--redlogistik-ink,#17231e)] hover:bg-[var(--redlogistik-tint,#e8f2ef)]" href="https://www.redlogistik.co.id/cek-tarif" target="_blank" rel="noreferrer">
                Cek tarif
              </a>
            </nav>
          </details>
        </div>
      </header>

      <main id="konten" lang="id">
        <section className="border-b border-[var(--redlogistik-line,#dce3df)] bg-[var(--redlogistik-paper,#fff)] pt-[42px] max-[760px]:pt-[25px]" aria-labelledby="hero-title">
          <div className={`${containerClass} grid grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] items-stretch gap-[clamp(32px,5vw,78px)] pb-11 max-[1050px]:grid-cols-[minmax(0,1fr)_minmax(330px,0.9fr)] max-[1050px]:gap-7 max-[760px]:grid-cols-1 max-[760px]:gap-[30px] max-[760px]:pb-[30px]`}>
            <div className="flex flex-col items-start justify-center py-4 max-[760px]:pt-3 max-[760px]:pb-0">
              <div className="mb-[26px] flex flex-wrap items-center gap-[13px] text-[11px] font-bold tracking-[0.12em] text-[var(--redlogistik-green,#0f5c4c)] uppercase max-[760px]:mb-5 max-[760px]:text-[9px]">
                <span>RED LOGISTIK</span>
                <span className="h-[18px] w-px bg-[var(--redlogistik-red,#b42332)]" aria-hidden="true" />
                <span>RODA ESA DINAMIKA</span>
              </div>
              <h1 className="m-0 max-w-[11ch] text-[clamp(48px,6.3vw,88px)] leading-[0.98] font-extrabold tracking-[-0.065em] max-[760px]:max-w-[12ch] max-[760px]:text-[clamp(43px,13vw,66px)]" id="hero-title">
                Satu mitra untuk setiap kebutuhan pengiriman.
              </h1>
              <p className="mt-[25px] max-w-[54ch] text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-[var(--redlogistik-muted,#64746b)] max-[760px]:mt-[18px] max-[760px]:text-[15px]">
                Dari Delivery Express hingga Trucking, Cargo, dan Export &amp; Import.
                Temukan layanan yang sesuai dengan kebutuhan bisnis Anda.
              </p>
              <div className="mt-[31px] flex flex-wrap items-center gap-[22px] max-[760px]:mt-[23px] max-[760px]:gap-4">
                <a className={`${actionClass} min-h-[50px] px-[22px]`} href="#layanan">
                  Jelajahi layanan <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a className={textActionClass} href="https://www.redlogistik.co.id/cek-tarif" target="_blank" rel="noreferrer">
                  Cek tarif <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
              <div className="mt-[37px] flex items-center gap-[9px] text-[11px] text-[var(--redlogistik-muted,#64746b)] max-[760px]:mt-6">
                <span className="size-2 rounded-full border-2 border-[var(--redlogistik-green,#0f5c4c)]" aria-hidden="true" />
                <span>Informasi layanan bersumber dari kanal resmi RED Logistik.</span>
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center self-center">
              <TrackingPanel />
              <div className="flex flex-wrap justify-between gap-2 pt-3 text-[10px] font-bold tracking-[0.11em] text-[var(--redlogistik-muted,#64746b)]">
                <span>TRACKING / AWB</span>
                <span className="inline-flex items-center gap-1">
                  BUKA LAYANAN RESMI <ArrowUpRight size={13} aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
          <YardMap />
        </section>

        <section className={`${containerClass} py-[100px] pb-[84px] max-[760px]:py-[65px] max-[760px]:pb-[58px]`} id="layanan" aria-labelledby="services-title">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)] items-end gap-[45px] pb-[38px] max-[760px]:grid-cols-1 max-[760px]:gap-[18px] max-[760px]:pb-[25px]">
            <div>
              <p className={`${microLabelClass} mb-[17px] text-[var(--redlogistik-red,#b42332)]`}>PILIH ZONA LAYANAN</p>
              <h2 className="m-0 max-w-[15ch] text-[clamp(34px,4.4vw,58px)] leading-[1.04] font-bold tracking-[-0.055em] max-[760px]:text-[clamp(35px,9vw,48px)]" id="services-title">
                Jalur yang tepat dimulai dari kebutuhan Anda.
              </h2>
            </div>
            <p className="mb-[5px] max-w-[42ch] text-[15px] leading-[1.7] text-[var(--redlogistik-muted,#64746b)] max-[760px]:text-sm">
              Setiap jenis kiriman punya kebutuhan berbeda. Kenali pilihan layanan
              RED Logistik sebelum menentukan langkah berikutnya.
            </p>
          </div>
          <ServiceList />
          <div className="flex justify-between gap-5 pt-[18px] text-[10px] font-bold tracking-[0.12em] text-[var(--redlogistik-muted,#64746b)] uppercase max-[760px]:flex-col max-[760px]:gap-3">
            <span>RINCIAN LAYANAN DAN KETENTUAN</span>
            <a className={`${textActionClass} text-xs tracking-normal normal-case`} href="https://www.redlogistik.co.id/product" target="_blank" rel="noreferrer">
              Kunjungi halaman layanan RED <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className={`${containerClass} border-t border-[var(--redlogistik-line,#dce3df)] py-[31px] pb-[90px] max-[760px]:py-[25px] max-[760px]:pb-[60px]`} id="tentang" aria-labelledby="about-title">
          <div className="flex items-center gap-[13px] text-[10px] font-bold tracking-[0.12em] text-[var(--redlogistik-muted,#64746b)] uppercase">
            <span>PERUSAHAAN</span>
            <span className="h-px w-[52px] bg-[var(--redlogistik-red,#b42332)]" aria-hidden="true" />
            <span>RED / 01</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)] gap-[60px] pt-[38px] max-[760px]:grid-cols-1 max-[760px]:gap-[18px] max-[760px]:pt-[26px]">
            <h2 className="m-0 max-w-[12ch] text-[clamp(34px,4.4vw,58px)] leading-[1.04] font-bold tracking-[-0.055em] max-[760px]:text-[clamp(35px,9vw,48px)]" id="about-title">
              Logistik yang mengikuti cara bisnis bergerak.
            </h2>
            <div>
              <p className="m-0 max-w-[54ch] text-[15px] leading-[1.8] text-[var(--redlogistik-muted,#64746b)]">
                RED Logistik berfokus pada layanan pengiriman express, cargo, trucking,
                dan kebutuhan kendaraan pengiriman. Layanannya ditujukan untuk
                mendukung kebutuhan usaha dan bisnis.
              </p>
              <a className={`${textActionClass} mt-[23px]`} href="https://www.redlogistik.co.id/" target="_blank" rel="noreferrer">
                Kenali RED Logistik <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className={`${containerClass} mb-20 flex items-end justify-between gap-[45px] bg-[var(--redlogistik-green,#0f5c4c)] p-[clamp(30px,5vw,62px)] text-white max-[760px]:mb-[55px] max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-7 max-[760px]:px-[22px] max-[760px]:py-[27px]`} id="kontak" aria-labelledby="contact-title">
          <div>
            <p className={`${microLabelClass} mb-[17px] text-[#f0a7a0]`}>BUTUH ARAHAN?</p>
            <h2 className="m-0 max-w-[13ch] text-[clamp(34px,4.4vw,58px)] leading-[1.04] font-bold tracking-[-0.055em] max-[760px]:text-[clamp(35px,9vw,48px)]" id="contact-title">
              Ceritakan kebutuhan pengiriman Anda.
            </h2>
            <p className="mt-[17px] max-w-[48ch] text-sm leading-[1.65] text-[#dbe9e1]">
              Hubungi tim RED Logistik untuk membicarakan pilihan layanan yang
              sesuai dengan kebutuhan pengiriman Anda.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-[17px] max-[760px]:w-full">
            <a className={`${actionClass} border-[var(--redlogistik-red,#b42332)] bg-[var(--redlogistik-red,#b42332)] hover:border-white hover:bg-white hover:text-[var(--redlogistik-green,#0f5c4c)] max-[760px]:w-full max-[760px]:justify-between`} href="https://wa.me/628131600668" target="_blank" rel="noreferrer">
              Hubungi via WhatsApp <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="inline-flex items-center gap-[9px] text-sm font-bold text-white transition-colors hover:text-[#f0a7a0] motion-reduce:transition-none" href="mailto:support@red-ms.id">
              Kirim email <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--redlogistik-line,#dce3df)] bg-[var(--redlogistik-paper,#fff)]">
        <div className={`${containerClass} grid grid-cols-[0.7fr_1.3fr] gap-[60px] py-[43px] pb-9 max-[1050px]:grid-cols-1 max-[1050px]:gap-[30px] max-[760px]:py-[30px]`}>
          <div>
            <Brand />
            <p className="mt-3 text-xs text-[var(--redlogistik-muted,#64746b)]">Jasa pengiriman barang tepat waktu.</p>
          </div>
          <div className="grid grid-cols-[1.3fr_0.7fr_0.9fr] gap-6 max-[760px]:grid-cols-2 max-[760px]:gap-5">
            <div className="max-[760px]:col-span-full">
              <span className={`${microLabelClass} text-[10px] text-[var(--redlogistik-red,#b42332)]`}>ALAMAT</span>
              <p className="mt-[9px] text-xs leading-[1.6] text-[var(--redlogistik-ink,#17231e)]">Ruko Pesona Metropolitan Blok A No. 6, Rawalumbu, Kota Bekasi, Jawa Barat.</p>
            </div>
            <div>
              <span className={`${microLabelClass} text-[10px] text-[var(--redlogistik-red,#b42332)]`}>TELEPON</span>
              <a className="mt-[9px] block text-xs leading-[1.6] text-[var(--redlogistik-ink,#17231e)] hover:text-[var(--redlogistik-red,#b42332)]" href="tel:+628131600668">0813-1600-668</a>
            </div>
            <div>
              <span className={`${microLabelClass} text-[10px] text-[var(--redlogistik-red,#b42332)]`}>EMAIL</span>
              <a className="mt-[9px] block text-xs leading-[1.6] text-[var(--redlogistik-ink,#17231e)] hover:text-[var(--redlogistik-red,#b42332)]" href="mailto:support@red-ms.id">support@red-ms.id</a>
            </div>
          </div>
        </div>
        <div className={`${containerClass} flex justify-between gap-5 border-t border-[var(--redlogistik-line,#dce3df)] py-[14px] text-[9px] font-bold tracking-[0.08em] text-[var(--redlogistik-muted,#64746b)] uppercase max-[760px]:flex-col max-[760px]:gap-[7px] max-[760px]:leading-[1.5]`}>
          <span>RED LOGISTIK / RODA ESA DINAMIKA</span>
          <span>Informasi dapat berubah. Konfirmasi detail layanan kepada RED Logistik.</span>
        </div>
      </footer>
    </div>
  );
}
