import { describe, expect, it } from "vitest";
import { inputError } from "../../src/features/identity/server/input-error";
import { userCreateSchema } from "../../src/features/identity/validation";

describe("user form errors", () => {
  it("names each wrong field in Indonesian", () => {
    const result = userCreateSchema.safeParse({
      name: "FAKE Nama Besar",
      username: "ab",
      email: "salah",
      password: "123",
      branchIds: [],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(inputError(result.error).fields).toEqual({
      username: "Username minimal 3 karakter",
      email: "Email tidak valid, contoh nama@perusahaan.com",
      password: "Password minimal 8 karakter",
      groupId: "Grup User belum diisi dengan benar",
    });
  });
});
