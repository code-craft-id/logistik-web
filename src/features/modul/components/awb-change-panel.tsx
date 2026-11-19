import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AccessActor, permits } from "@/features/identity/permissions";
import type { Prisma } from "@/lib/db/generated/client";
import { formatRupiah } from "@/lib/format/rupiah";
import { applyAwbEditAction, requestAwbChangeAction } from "../actions";
import {
  AWB_CHANGE_KINDS,
  AWB_CHANGE_STATUS,
  awbChangesFor,
} from "../server/awb-changes";
import { ActionForm } from "./action-form";
import { StatusText, selectClass } from "./page-bits";

/** Before/after value of a change; money fields as Rupiah. */
export function showValue(key: string, value: string | null) {
  return key === "biaya" ? formatRupiah(value) : (value ?? "-");
}

export const FIELD_LABELS: Record<string, string> = {
  senderName: "Pengirim",
  senderAddress: "Alamat Pengirim",
  senderPhone: "Telp Pengirim",
  receiverName: "Penerima",
  receiverAddress: "Alamat Penerima",
  receiverPhone: "Telp Penerima",
  doNo: "DO No.",
  koli: "Koli",
  kilo: "Berat",
  volume: "Volume",
  biaya: "Biaya",
  description: "Isi Barang",
  remarks: "Keterangan",
};

type Awb = {
  id: number;
  senderName: string | null;
  receiverName: string | null;
  senderAddress: string | null;
  senderPhone: string | null;
  receiverAddress: string | null;
  receiverPhone: string | null;
  doNo: string | null;
  koli: number | null;
  kilo: Prisma.Decimal | null;
  volume: Prisma.Decimal | null;
  biaya: Prisma.Decimal | null;
  description: string | null;
  remarks: string | null;
};

/** Ajukan Edit/Hapus AWB and, once an edit is approved, the one-time edit form. */
export async function AwbChangePanel({
  actor,
  transaction: t,
}: {
  actor: AccessActor;
  transaction: Awb;
}) {
  const canRequest = permits(actor, "request", "awb_change");
  if (!canRequest && !permits(actor, "view", "awb_change")) return null;
  const requests = await awbChangesFor(actor, t.id);
  const approvedEdit = requests.find(
    (r) => r.kind === "EDIT" && r.status === "APPROVED",
  );
  const field = (
    name: keyof Awb,
    label: string,
    extra: Record<string, string> = {},
  ) => {
    const value = t[name];
    return (
      <div className="min-w-0 space-y-2">
        <Label htmlFor={`edit-${name}`}>{label}</Label>
        <Input
          id={`edit-${name}`}
          name={name}
          defaultValue={value === null ? "" : String(value)}
          className="min-h-11"
          {...extra}
        />
      </div>
    );
  };
  return (
    <section
      aria-labelledby="awb-change"
      className="space-y-4 rounded-lg border bg-background p-4"
    >
      <h2 id="awb-change" className="font-medium">
        Edit / Hapus AWB
      </h2>
      {approvedEdit && canRequest && (
        <ActionForm action={applyAwbEditAction}>
          <p className="text-sm">
            Pengajuan edit sudah disetujui. Ubah data lalu Simpan (hanya
            sekali).
          </p>
          <input type="hidden" name="requestId" value={approvedEdit.id} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field("senderName", "Pengirim", { maxLength: "255" })}
            {field("senderPhone", "No. Telp Pengirim", { maxLength: "30" })}
            {field("senderAddress", "Alamat Pengirim", { maxLength: "500" })}
            {field("receiverName", "Penerima", { maxLength: "255" })}
            {field("receiverPhone", "No. Telp Penerima", { maxLength: "30" })}
            {field("receiverAddress", "Alamat Penerima", { maxLength: "500" })}
            {field("doNo", "DO No.", { maxLength: "50" })}
            {field("koli", "Koli", { type: "number", min: "0" })}
            {field("kilo", "Berat (kg)", {
              type: "number",
              min: "0",
              step: "0.01",
            })}
            {field("volume", "Volume", {
              type: "number",
              min: "0",
              step: "0.001",
            })}
            {field("biaya", "Biaya (Rp)", {
              type: "number",
              min: "0",
              step: "0.01",
            })}
            {field("description", "Isi Barang", { maxLength: "500" })}
            {field("remarks", "Keterangan", { maxLength: "500" })}
          </div>
        </ActionForm>
      )}
      {canRequest && (
        <ActionForm action={requestAwbChangeAction} reset>
          <input type="hidden" name="transactionId" value={t.id} />
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="awb-change-kind">Jenis</Label>
              <select
                id="awb-change-kind"
                name="kind"
                defaultValue="EDIT"
                className={selectClass}
              >
                <option value="EDIT">Ajukan Edit</option>
                <option value="DELETE">Ajukan Hapus</option>
              </select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="awb-change-reason">Alasan</Label>
              <Input
                id="awb-change-reason"
                name="reason"
                required
                minLength={5}
                maxLength={500}
                className="min-h-11"
              />
            </div>
          </div>
        </ActionForm>
      )}
      {requests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Riwayat pengajuan dan perubahan
          </h3>
          <ul className="space-y-2 text-sm">
            {requests.map((r) => {
              const changes = r.changes as Record<
                string,
                [string | null, string | null]
              > | null;
              return (
                <li key={r.id} className="rounded-md border p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums">
                      {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </span>
                    <span>{AWB_CHANGE_KINDS[r.kind as "EDIT"] ?? r.kind}</span>
                    <StatusText value={r.status} labels={AWB_CHANGE_STATUS} />
                    <span className="text-muted-foreground">
                      oleh {r.requestedBy?.name ?? "-"}
                      {r.decidedBy ? `, diputuskan ${r.decidedBy.name}` : ""}
                    </span>
                  </div>
                  <p className="text-muted-foreground [overflow-wrap:anywhere]">
                    Alasan: {r.reason}
                    {r.decisionNote ? ` · Catatan: ${r.decisionNote}` : ""}
                  </p>
                  {changes && (
                    <ul className="mt-1 list-disc pl-5">
                      {Object.entries(changes).map(([key, [before, after]]) => (
                        <li key={key} className="[overflow-wrap:anywhere]">
                          {FIELD_LABELS[key] ?? key}: {showValue(key, before)} →{" "}
                          {showValue(key, after)}
                          {r.usedAt
                            ? ` (${r.usedAt.toISOString().slice(0, 16).replace("T", " ")})`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
