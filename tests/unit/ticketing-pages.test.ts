import { beforeEach, expect, it, vi } from "vitest";
import {
  TicketCreatePage,
  TicketDetailPage,
  TicketListPage,
} from "../../src/features/ticketing/components/ticket-pages";

const { current, list, detail, branches, redirect, notFound } = vi.hoisted(
  () => ({
    current: vi.fn(),
    list: vi.fn(),
    detail: vi.fn(),
    branches: vi.fn(),
    redirect: vi.fn(() => {
      throw new Error("LOGIN_REDIRECT");
    }),
    notFound: vi.fn(() => {
      throw new Error("NOT_FOUND");
    }),
  }),
);
vi.mock("next/navigation", () => ({ redirect, notFound }));
vi.mock("../../src/features/identity/server/context", () => ({
  currentIdentity: current,
}));
vi.mock("../../src/features/ticketing/server/context", () => ({
  ticketService: { list, detail, branches },
}));
vi.mock("../../src/features/ticketing/components/ticket-form", () => ({
  TicketForm: () => null,
}));
const pages = [
  ["list", () => TicketListPage({ query: {} })],
  ["create", () => TicketCreatePage()],
  ["detail", () => TicketDetailPage({ id: "5" })],
] as const;
const actor = {
  id: 1,
  status: "ACTIVE",
  branchIds: [],
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: [],
  },
};
beforeEach(() => vi.resetAllMocks());
it.each(
  pages,
)("redirects anonymous %s callers before source reads", async (_, page) => {
  current.mockResolvedValue(null);
  await expect(page()).rejects.toThrow("LOGIN_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/login");
  expect(list).not.toHaveBeenCalled();
  expect(detail).not.toHaveBeenCalled();
  expect(branches).not.toHaveBeenCalled();
});
it.each(
  pages,
)("renders denied %s requests before source reads", async (_, page) => {
  current.mockResolvedValue({ actor });
  expect((await page()).props.title).toBe("Akses ditolak");
  expect(list).not.toHaveBeenCalled();
  expect(detail).not.toHaveBeenCalled();
  expect(branches).not.toHaveBeenCalled();
});
it("renders an independently authorized other-creator detail for an administrator", async () => {
  current.mockResolvedValue({
    actor: {
      ...actor,
      group: {
        ...actor.group,
        permissions: [{ resource: "system_admin", action: "manage" }],
      },
    },
  });
  const ticket = { id: 5, createdById: 2, subject: "FAKE" };
  detail.mockResolvedValue(ticket);
  expect((await TicketDetailPage({ id: "5" })).props.ticket).toBe(ticket);
  expect(detail).toHaveBeenCalledWith(5);
  expect(notFound).not.toHaveBeenCalled();
});
