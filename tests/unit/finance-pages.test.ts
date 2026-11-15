import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountingHomePage } from "../../src/features/finance/components/accounting-pages";
import { currentIdentity } from "../../src/features/identity/server/context";

vi.mock("@/features/identity/server/context", () => ({
  currentIdentity: vi.fn(),
}));
vi.mock("@/features/finance/server/context", () => ({
  accountingQueries: {},
  financeService: {},
}));
vi.mock("@/features/finance/actions", () => ({
  financeCommand: vi.fn(),
  financeOptions: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  useRouter: vi.fn(),
  notFound: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
describe("finance landing authorization", () => {
  it("authenticates the landing independently and denies actors without finance rights", async () => {
    vi.mocked(currentIdentity).mockResolvedValue(null);
    await expect(AccountingHomePage()).rejects.toThrow("redirect:/login");
    vi.mocked(currentIdentity).mockResolvedValue({
      actor: {
        id: 1,
        status: "ACTIVE",
        branchIds: [1],
        group: {
          id: 1,
          name: "FAKE",
          status: "ACTIVE",
          deletedAt: null,
          permissions: [],
        },
      },
    } as unknown as Awaited<ReturnType<typeof currentIdentity>>);
    expect((await AccountingHomePage()).props.title).toBe("Akses ditolak");
  });
  it("allows a report-only actor without granting account management", async () => {
    vi.mocked(currentIdentity).mockResolvedValue({
      actor: {
        id: 1,
        status: "ACTIVE",
        branchIds: [1],
        group: {
          id: 1,
          name: "FAKE",
          status: "ACTIVE",
          deletedAt: null,
          permissions: [{ resource: "financial_report", action: "view" }],
        },
      },
    } as unknown as Awaited<ReturnType<typeof currentIdentity>>);
    expect((await AccountingHomePage()).props.title).toBe("Akuntansi");
  });
});
