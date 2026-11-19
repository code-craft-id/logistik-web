import { expect, it } from "vitest";
import { slaLabel, slaTargetDays } from "../../src/features/shipments/sla";

it("reads the SLA target from the Cek Ongkir estimate", () => {
  expect(slaTargetDays("1-2 hari")).toBe(2);
  expect(slaTargetDays("1-2hari")).toBe(2);
  expect(slaTargetDays("3 hari")).toBe(3);
  expect(slaTargetDays("")).toBeNull();
  expect(slaTargetDays(null)).toBeNull();
});

it("labels SLA: In Progress until received, then On Time / Late", () => {
  expect(slaLabel(null, 2, "In Transit")).toBe("In Progress");
  expect(slaLabel(2, 2, "Delivered")).toBe("On Time");
  expect(slaLabel(3, 2, "Delivered")).toBe("Late");
  expect(slaLabel(1, null, "Delivered")).toBe("-");
  expect(slaLabel(null, 2, "Returned")).toBe("Retur");
});
