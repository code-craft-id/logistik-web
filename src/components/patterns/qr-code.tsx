import QRCode from "qrcode";

/**
 * Server-rendered QR code (backup for the Code 128 barcode). Error
 * correction M tolerates ~15% damage from smudged or creased labels.
 */
export async function QrCode({
  value,
  size = 96,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
  return (
    <figure className={className}>
      <span
        role="img"
        aria-label={`QR code ${value}`}
        className="block bg-white [&>svg]:h-full [&>svg]:w-full"
        style={{ width: size, height: size }}
        // Generated locally by the qrcode library from the AWB/manifest number.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted library SVG
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </figure>
  );
}
