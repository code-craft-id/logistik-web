import { expect, it } from "vitest";
import {
  missingAwbFields,
  missingBookingFields,
} from "../../src/features/bookings/required-fields";

it("lists the empty required AWB fields", () => {
  expect(missingAwbFields({})).toEqual([
    "Asal",
    "Tujuan",
    "Nama Pengirim",
    "Nama Penerima",
    "Alamat Penerima",
    "No. Telp Penerima",
    "Layanan",
    "Pembayaran",
    "Koli (minimal 1)",
    "Berat (Kg)",
  ]);
  expect(
    missingAwbFields({
      originBranchId: "1",
      destinationBranchId: "2",
      senderName: "A",
      receiverName: "B",
      receiverAddress: "Jl. 1",
      receiverPhone: "08",
      deliveryServiceId: "3",
      costTypeId: "4",
      koli: "0",
      kilo: " ",
    }),
  ).toEqual(["Koli (minimal 1)", "Berat (Kg)"]);
});

it("lists the empty required booking fields (pickup data)", () => {
  expect(
    missingBookingFields({
      branchId: "1",
      destinationBranchId: "2",
      senderName: "A",
      senderAddress: "Jl. 1",
      senderPhone: "08",
      koli: "2",
    }),
  ).toEqual([]);
  expect(missingBookingFields({ branchId: "1", koli: "1" })).toEqual([
    "Tujuan",
    "Nama Pengirim",
    "Alamat Pengirim",
    "No. Telp Pengirim",
  ]);
});
