import { describe, expect, it } from "vitest";
import {
  type AccessActor,
  permits,
} from "../../src/features/identity/permissions";
import {
  ticketCreateInput,
  ticketId,
  ticketListInput,
} from "../../src/features/ticketing/contracts";

const input = {
  branchId: 1,
  subject: " Subject ",
  menuName: " Menu ",
  relatedPageUrl: "/ticketting",
  remarks: " ",
  priority: "Normal",
  idempotencyKey: "d460cad2-5200-4a1f-8a98-9509932c93b7",
};
describe("bounded ticket validation", () => {
  it("normalizes canonical fields and requires an explicit priority", () => {
    expect(ticketCreateInput.parse(input)).toMatchObject({
      subject: "Subject",
      menuName: "Menu",
      remarks: null,
    });
    expect(
      ticketCreateInput.safeParse({ ...input, priority: undefined }).success,
    ).toBe(false);
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,a",
    "//evil.test",
    "/\\evil",
    "https://user:pass@example.test",
    "/a\nb",
    "relative",
    "ftp://example.test",
  ])("rejects unsafe URL %s", (relatedPageUrl) => {
    expect(
      ticketCreateInput.safeParse({ ...input, relatedPageUrl }).success,
    ).toBe(false);
  });
  it.each([
    "https://example.test/a?b=c",
    "http://example.test",
    "/safe/path?next=a",
  ])("accepts inert safe URL %s", (relatedPageUrl) => {
    expect(
      ticketCreateInput.safeParse({ ...input, relatedPageUrl }).success,
    ).toBe(true);
  });
  it.each([
    { createdById: 2 },
    { status: "Open" },
    { createdAt: "2026-01-01" },
    { priority: "Medium" },
    { subject: "x".repeat(201) },
    { menuName: "" },
    { remarks: "x".repeat(5001) },
    { relatedPageUrl: `/${"x".repeat(2048)}` },
    { branchId: 2147483648 },
    { idempotencyKey: "a".repeat(65) },
  ])("rejects forged or bounded fields %j", (extra) => {
    expect(ticketCreateInput.safeParse({ ...input, ...extra }).success).toBe(
      false,
    );
  });
  it("bounds IDs, paging and search", () => {
    expect(ticketListInput.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      search: "",
    });
    for (const bad of [
      { page: 0 },
      { page: 100001 },
      { pageSize: 101 },
      { search: "x".repeat(101) },
    ])
      expect(ticketListInput.safeParse(bad).success).toBe(false);
    for (const id of [0, -1, 1.2, 2147483648, "1x"])
      expect(ticketId.safeParse(id).success).toBe(false);
    expect(ticketId.parse("42")).toBe(42);
  });
  it("registers view/create only and denies unknown actions even to administrator", () => {
    const actor: AccessActor = {
      id: 1,
      status: "ACTIVE",
      branchIds: [],
      group: {
        id: 1,
        name: "irrelevant",
        status: "ACTIVE",
        deletedAt: null,
        permissions: [{ resource: "system_admin", action: "manage" }],
      },
    };
    expect(permits(actor, "view", "ticket")).toBe(true);
    expect(permits(actor, "create", "ticket")).toBe(true);
    expect(permits(actor, "approve", "ticket")).toBe(false);
    expect(permits(actor, "view", "unknown-ticket")).toBe(false);
  });
});
