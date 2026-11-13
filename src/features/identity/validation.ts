import { z } from "zod";
import { permissionGrantCount, validPermission } from "./permissions";

export const identityId = z
  .union([z.number(), z.string().trim().min(1)])
  .transform((value) => Number(value))
  .pipe(z.number().int().positive().max(2_147_483_647));
const status = z.enum(["ACTIVE", "INACTIVE"]);
const name = z.string().trim().min(1, "Nama wajib diisi").max(100);
const username = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_.]+$/)
  .toLowerCase();
const password = z.string().min(8, "Password minimal 8 karakter").max(128);
const branchIds = z
  .array(identityId)
  .max(100)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Cabang tidak boleh duplikat",
  );
export const loginSchema = z.object({ username, password });
export const userGroupCreateSchema = z.strictObject({
  name: name.max(50),
  description: z.string().trim().max(1000).default(""),
  status: status.default("ACTIVE"),
});
export const userGroupUpdateSchema = z.strictObject({
  name: name.max(50).optional(),
  description: z.string().trim().max(1000).optional(),
  status: status.optional(),
});
export const userCreateSchema = z.strictObject({
  name,
  username,
  email: z.email().max(254).toLowerCase(),
  password,
  groupId: identityId,
  branchIds: branchIds.default([]),
  status: status.default("ACTIVE"),
});
export const userUpdateSchema = z.strictObject({
  name: name.optional(),
  username: username.optional(),
  email: z.email().max(254).toLowerCase().optional(),
  password: password.optional(),
  groupId: identityId.optional(),
  branchIds: branchIds.optional(),
  status: status.optional(),
});
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: status.optional(),
  groupId: identityId.optional(),
});
export const permissionCreateSchema = z
  .strictObject({
    groupId: identityId,
    action: z.string().min(1).max(50),
    resource: z.string().min(1).max(100),
  })
  .refine(validPermission, "Hak akses tidak dikenal");
export const permissionMatrixSchema = z
  .strictObject({
    groupId: identityId,
    permissions: z
      .array(
        z
          .strictObject({
            resource: z.string().min(1).max(100),
            action: z.string().min(1).max(50),
            granted: z.boolean(),
          })
          .refine(validPermission, "Hak akses tidak dikenal"),
      )
      .max(permissionGrantCount),
  })
  .refine(
    (value) =>
      new Set(
        value.permissions.map((grant) => `${grant.resource}:${grant.action}`),
      ).size === value.permissions.length,
    "Hak akses tidak boleh duplikat",
  );
