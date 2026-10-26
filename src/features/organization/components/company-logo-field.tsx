"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMPANY_LOGO_MAX_BYTES, validCompanyLogo } from "../company-logo";
export function CompanyLogoField({
  value,
  disabled,
}: {
  value: string;
  disabled: boolean;
}) {
  const [logo, setLogo] = useState(value);
  const [error, setError] = useState("");
  const reader = useRef<FileReader | null>(null);
  useEffect(() => {
    setLogo(value);
    setError("");
  }, [value]);
  useEffect(() => () => reader.current?.abort(), []);
  const preview =
    logo.startsWith("data:image/") ||
    (logo.startsWith("/") && !logo.startsWith("//"));
  return (
    <div className="space-y-3 sm:col-span-2">
      <input name="logo" type="hidden" value={logo} />
      <Input
        id="org-logo"
        type="file"
        className="min-h-11"
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          reader.current?.abort();
          setError("");
          if (
            file.size > COMPANY_LOGO_MAX_BYTES ||
            !["image/png", "image/jpeg", "image/webp"].includes(file.type)
          ) {
            setError("Gunakan PNG, JPEG, atau WebP maksimal 250 KB.");
            event.target.value = "";
            return;
          }
          const next = new FileReader();
          reader.current = next;
          next.onload = () => {
            const result = String(next.result ?? "");
            if (validCompanyLogo(result)) setLogo(result);
            else setError("Isi file bukan gambar yang didukung.");
          };
          next.onerror = () => setError("Gambar gagal dibaca.");
          next.readAsDataURL(file);
        }}
      />
      <p className="text-xs text-muted-foreground">
        PNG, JPEG, atau WebP, maksimal 250 KB. Logo disimpan saat formulir
        disimpan.
      </p>
      {preview && (
        <Image
          src={logo}
          unoptimized
          width={160}
          height={64}
          className="h-16 w-40 object-contain object-left"
          alt="Logo perusahaan"
        />
      )}
      {logo && (
        <Button
          className="min-h-11"
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setLogo("")}
        >
          Hapus logo
        </Button>
      )}
      <details>
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Referensi logo yang sudah ada
        </summary>
        <Input
          className="mt-2 min-h-11"
          aria-label="Referensi logo"
          value={logo.startsWith("data:") ? "" : logo}
          disabled={disabled}
          maxLength={1000}
          onChange={(event) => {
            setLogo(event.target.value);
            setError("");
          }}
        />
      </details>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
