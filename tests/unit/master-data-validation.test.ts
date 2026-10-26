import { describe, expect, it } from "vitest";
import { identityId } from "../../src/features/identity/validation";
import {
  postalCodeInput,
  transportModeInput,
  vehicleInput,
  vendorInput,
} from "../../src/features/master-data/contracts";
import { agentInput } from "../../src/features/organization/contracts";
import { customerWhatsAppNotificationInput } from "../../src/features/organization/settings-contracts";

const vehicle = {
  name: "FAKE Vehicle",
  truckingTypeId: null,
  year: 2026,
  licensePlate: "INVALID",
  registrationHolderName: "",
  registrationNumber: "",
  registrationDate: "2026-10-25",
  cylinderCapacity: "",
  color: "",
  insuranceName: "",
  insuranceExpiry: null,
  description: "",
  chassisNumber: "",
  engineNumber: "",
  serviceTrucking: false,
  branchId: null,
  status: "ACTIVE",
};
describe("Dev 1 validation boundaries", () => {
  it("rejects booleans, nulls and arrays masquerading as record identifiers", () => {
    for (const value of [true, null, [1], {}, "", 0, -1, 1.5])
      expect(identityId.safeParse(value).success).toBe(false);
    expect(identityId.parse("123")).toBe(123);
  });
  it("preserves date-only values as UTC dates and rejects impossible dates or missing numeric inputs", () => {
    expect(vehicleInput.parse(vehicle).registrationDate?.toISOString()).toBe(
      "2026-10-25T00:00:00.000Z",
    );
    for (const registrationDate of ["2026-02-30", "2026-10-25T00:00:00Z", ""])
      expect(
        vehicleInput.safeParse({ ...vehicle, registrationDate }).success,
      ).toBe(false);
    for (const year of [null, true, "", "bad", 1.5])
      expect(vehicleInput.safeParse({ ...vehicle, year }).success).toBe(false);
  });
  it("keeps flat postal codes and legacy divider text without interpreting them as calculations", () => {
    expect(
      transportModeInput.parse({
        name: "FAKE Mode",
        divider: "LEGACY-TEXT",
        status: "ACTIVE",
      }).divider,
    ).toBe("LEGACY-TEXT");
    expect(
      postalCodeInput.parse({ code: "00123", status: "ACTIVE" }).code,
    ).toBe("00123");
    expect(
      postalCodeInput.safeParse({
        code: "00123",
        provinceId: 1,
        status: "ACTIVE",
      }).success,
    ).toBe(false);
  });
  it("rejects attempts to inject balance edits, financial children or unsupported templates", () => {
    const agent = {
      name: "FAKE Agent",
      code: "FAKE",
      initials: "F",
      category: "",
      branchId: 1,
      phoneNumber: null,
      managerName: null,
      mobileNumber: null,
      status: "ACTIVE",
    };
    expect(agentInput.safeParse({ ...agent, balance: "999" }).success).toBe(
      false,
    );
    const vendor = {
      name: "FAKE Vendor",
      address1: "",
      address2: "",
      city: "",
      postalCode: "",
      phone: "",
      fax: "",
      email: "",
      contactName: "",
      branch: "",
      status: "ACTIVE",
    };
    expect(vendorInput.safeParse({ ...vendor, accounting: {} }).success).toBe(
      false,
    );
    expect(
      customerWhatsAppNotificationInput.safeParse({
        companyId: 1,
        customerId: null,
        isEnabled: true,
        messageTemplates: {},
      }).success,
    ).toBe(false);
  });
});
