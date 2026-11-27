import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ prisma: {} }));
const { customerReportLine } = await import(
  "../../src/features/reports/customer-report/server"
);

const row = {
  awb_no: "JKT261100001",
  transaction_date: new Date("2026-11-02T03:00:00Z"),
  do_no: null,
  origin: "JAKARTA",
  destination: "BANDUNG",
  customer: "PT A",
  service: "Cargo",
  mode: "DARAT",
  sender_name: "S",
  sender_address: null,
  sender_phone: null,
  receiver_name: "R",
  receiver_address: null,
  receiver_phone: null,
  goods: null,
  koli: 2,
  kilo: "10.00",
  volume: "0",
  chargeable: "10.00",
  price_per_kg: "5000.00",
  other_fee: null,
  packing_fee: null,
  pickup_fee: null,
  insurance_fee: null,
  discount: null,
  ppn: null,
  biaya: "50000.00",
  cost_type: " trf ",
  cod_value: null,
  cod_fee: null,
  status: "In Transit",
};

it("puts the Grand Total only in the matching payment column", () => {
  const line = customerReportLine(row, 1);
  expect(line[2]).toBe("2026-11-02 10:00");
  expect(line[27]).toBe(50000);
  expect(line.slice(28, 32)).toEqual([0, 50000, 0, 0]);
  expect(line.at(-1)).toBe("In Transit");
});
