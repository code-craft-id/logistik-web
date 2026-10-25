import { z } from "zod";

export const profileUpdateSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
});
export const profilePasswordSchema = z
  .strictObject({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });
export const sessionListSchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export const sessionRevokeSchema = z.strictObject({
  scope: z.enum(["others", "all"]),
});
export const profileSessionIdSchema = z
  .union([
    z.number().int().positive(),
    z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number),
  ])
  .pipe(z.number().int().positive().max(2_147_483_647));
