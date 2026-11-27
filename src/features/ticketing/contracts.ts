import { z } from "zod";

const integer = (maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value,
    z.number().int().positive().max(maximum),
  );
export const ticketId = integer(2_147_483_647);
const relatedPageUrl = z
  .string()
  .refine(
    (value) =>
      Array.from(value).every((character) => {
        const code = character.charCodeAt(0);
        return code > 31 && (code < 127 || code > 159) && character !== "\\";
      }),
    "URL tidak aman.",
  )
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => {
    if (value.startsWith("/")) return !value.startsWith("//");
    try {
      const url = new URL(value);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Gunakan URL http(s) tanpa kredensial atau path yang dimulai satu garis miring.");

export const ticketCreateInput = z.strictObject({
  branchId: ticketId,
  subject: z.string().trim().min(1).max(200),
  menuName: z.string().trim().min(1).max(200),
  relatedPageUrl,
  remarks: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional()
    .transform((value) => value || null),
  priority: z.enum(["Low", "Normal", "High"]),
  idempotencyKey: z.uuid().max(64),
});
export const ticketListInput = z.strictObject({
  page: integer(100_000).default(1),
  pageSize: integer(100).default(20),
  search: z.string().trim().max(100).default(""),
  /** "approval": Persetujuan Tiketing (my finished tickets to approve). */
  tab: z.enum(["all", "approval"]).default("all"),
});
export const TICKET_STATUSES = ["Open", "In Progress", "Finish"] as const;
export const ticketStatusInput = z.strictObject({
  id: ticketId,
  status: z.enum(TICKET_STATUSES),
});
export const ticketMessageInput = z.strictObject({
  id: ticketId,
  body: z.string().trim().min(1, "Tulis pesan.").max(2000),
});
export type TicketMessageDTO = {
  id: number;
  author: string;
  body: string;
  createdAt: string;
};
export const ticketDecisionInput = z.strictObject({
  id: ticketId,
  decision: z.enum(["Approved", "Revision"]),
  note: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || null),
});
export type TicketCreateInput = z.infer<typeof ticketCreateInput>;
export type TicketDTO = {
  id: number;
  branchId: number;
  createdById: number;
  subject: string;
  menuName: string;
  relatedPageUrl: string;
  remarks: string | null;
  priority: string;
  createdAt: string;
  status: string;
  approval: string | null;
  approvalNote: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  createdBy: string | null;
  /** Chat, oldest first; only on the detail page. */
  messages?: TicketMessageDTO[];
};
