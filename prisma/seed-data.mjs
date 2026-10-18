// Stable fake fixtures. No credentials or financial behavior.
const firstId = 9_100_001;
async function ensureFakeRecord(delegate, data) {
  const existing = await delegate.findUnique({ where: { id: data.id } });
  if (existing) {
    const matches = Object.entries(data).every(([key, expected]) => {
      const actual = existing[key];
      return expected instanceof Date
        ? actual instanceof Date && actual.getTime() === expected.getTime()
        : actual === expected;
    });
    if (!matches) {
      // Never overwrite a real row or a changed fixture occupying the reserved ID.
      throw new Error("Fake seed ID collision; transaction aborted.");
    }
    return;
  }
  await delegate.create({
    data: {
      createdAt: new Date("2000-01-01T00:00:00Z"),
      updatedAt: new Date("2000-01-01T00:00:00Z"),
      ...data,
    },
  });
}

export async function seedFakeRecords(tx) {
  await ensureFakeRecord(tx.company, {
    id: firstId,
    name: "FAKE COMPANY 001",
    address: "FAKE ADDRESS - NO REAL LOCATION",
    isDepositAgent: false,
    showPriceOnPrint: false,
  });
  await ensureFakeRecord(tx.office, {
    id: firstId,
    companyId: firstId,
    code: "FAKE-OFFICE-001",
    name: "FAKE OFFICE 001",
    status: "ACTIVE",
  });

  for (let i = 1; i <= 30; i++) {
    const id = 9_100_000 + i;
    const suffix = String(i).padStart(3, "0");
    const status = i % 2 ? "ACTIVE" : "INACTIVE";
    await ensureFakeRecord(tx.branch, {
      id,
      officeId: firstId,
      code: `FAKE-BRANCH-${suffix}`,
      name: `FAKE BRANCH ${suffix}`,
      address: "FAKE ADDRESS - NO REAL LOCATION",
      phoneNumber: `INVALID-PHONE-${suffix}`,
      status,
    });
    for (const [delegate, label] of [
      [tx.goodsType, "GOODS TYPE"],
      [tx.serviceCategory, "SERVICE CATEGORY"],
      [tx.truckingType, "TRUCKING TYPE"],
    ]) {
      await ensureFakeRecord(delegate, {
        id,
        name: `FAKE ${label} ${suffix}`,
        status,
      });
    }
    await ensureFakeRecord(tx.term, {
      id,
      name: `FAKE TERM ${suffix}`,
      description: "FAKE DISPLAY DATA - NO BUSINESS TERMS",
      status,
    });
    await ensureFakeRecord(tx.vehicle, {
      id,
      name: `FAKE VEHICLE ${suffix}`,
      truckingTypeId: id,
      year: 2000,
      licensePlate: `INVALID-PLATE-${suffix}`,
      registrationHolderName: `FAKE HOLDER ${suffix}`,
      registrationNumber: `INVALID-REG-${suffix}`,
      registrationDate:
        suffix === "001" ? new Date("2000-01-01T00:00:00Z") : null,
      cylinderCapacity: "FAKE-CAPACITY",
      color: "FAKE COLOR",
      insuranceName: "FAKE INSURANCE",
      insuranceExpiry:
        suffix === "001" ? new Date("2099-01-01T00:00:00Z") : null,
      description: "FAKE VEHICLE - NOT FOR OPERATIONS",
      chassisNumber: `INVALID-CHASSIS-${suffix}`,
      engineNumber: `INVALID-ENGINE-${suffix}`,
      status,
      serviceTrucking: false,
      branchId: id,
    });
    const personnel = {
      id,
      address: "FAKE ADDRESS - NO REAL LOCATION",
      nationalIdNumber: `INVALID-ID-${suffix}`,
      phone: `INVALID-PHONE-${suffix}`,
      branchId: suffix === "001" ? id : null,
      status,
    };
    await ensureFakeRecord(tx.driver, {
      ...personnel,
      name: `FAKE DRIVER ${suffix}`,
      driverLicenseNumber: `INVALID-LICENSE-${suffix}`,
    });
    await ensureFakeRecord(tx.courier, {
      ...personnel,
      name: `FAKE COURIER ${suffix}`,
    });
    // Flat synthetic dictionaries; these do not define a region hierarchy.
    for (const [delegate, label] of [
      [tx.costType, "COST TYPE"],
      [tx.vehicleType, "VEHICLE TYPE"],
      [tx.province, "PROVINCE"],
      [tx.regency, "REGENCY"],
      [tx.district, "DISTRICT"],
      [tx.village, "VILLAGE"],
    ]) {
      await ensureFakeRecord(delegate, {
        id,
        name: `FAKE ${label} ${suffix}`,
        status,
      });
    }
    await ensureFakeRecord(tx.postalCode, {
      id,
      code: `FAKE${suffix}`,
      status,
    });
    await ensureFakeRecord(tx.transportMode, {
      id,
      name: `FAKE MODE ${suffix}`,
      divider: "FAKE-UNITS-TBD",
      status,
    });
    await ensureFakeRecord(tx.deliveryService, {
      id,
      name: `FAKE SERVICE ${suffix}`,
      serviceCategoryId: id,
      transportModeId: i % 3 ? id : null,
      status,
    });
    await ensureFakeRecord(tx.shipmentStatus, {
      id,
      code: `FAKE-${suffix}`,
      name: `FAKE DISPLAY STATUS ${suffix}`,
      status,
    });
    await ensureFakeRecord(tx.marketingPerson, {
      ...personnel,
      name: `FAKE MARKETING ${suffix}`,
    });
    const longText = "FAKE ADDRESS - NO REAL LOCATION. ".repeat(12);
    const extendedName =
      i % 5 === 0 ? " - EXTENDED DISPLAY NAME FOR WRAPPING AND SEARCH" : "";
    const deletedAt = i === 30 ? new Date("2001-01-01T00:00:00Z") : null;
    await ensureFakeRecord(tx.vendor, {
      id,
      name: `FAKE VENDOR ${suffix}${extendedName}`,
      address1: i % 5 === 0 ? longText : "FAKE ADDRESS - NO REAL LOCATION",
      address2: i % 3 ? "FAKE SECOND ADDRESS" : "",
      city: "FAKE CITY",
      postalCode: `FAKE${suffix}`,
      phone: `INVALID-PHONE-${suffix}`,
      fax: i % 3 ? `INVALID-FAX-${suffix}` : "",
      email: `fake-vendor-${suffix}@example.invalid`,
      contactName: `FAKE CONTACT ${suffix}`,
      branch: `FAKE BRANCH ${suffix}`,
      status,
      deletedAt,
    });
    await ensureFakeRecord(tx.customer, {
      id,
      name: `FAKE CUSTOMER ${suffix}${extendedName}`,
      address: i % 5 === 0 ? longText : "FAKE ADDRESS - NO REAL LOCATION",
      regencyId: i % 3 ? id : null,
      phone: i % 3 ? `INVALID-PHONE-${suffix}` : null,
      fax: i % 3 ? `INVALID-FAX-${suffix}` : null,
      contactPerson: `FAKE CONTACT ${suffix}`,
      email: i % 3 ? `fake-customer-${suffix}@example.invalid` : null,
      marketingPersonId: i % 3 ? id : null,
      branchId: i % 3 ? id : null,
      termId: i % 3 ? id : null,
      costTypeId: i % 3 ? id : null,
      podRequired: i % 3 ? i % 2 === 1 : null,
      // No integration behavior or affirmative notification preference is seeded.
      whatsAppNotificationEnabled: null,
      deletedAt,
    });
    await ensureFakeRecord(tx.consignee, {
      id,
      name: `FAKE CONSIGNEE ${suffix}${extendedName}`,
      address1: i % 5 === 0 ? longText : "FAKE ADDRESS - NO REAL LOCATION",
      address2: i % 3 ? "FAKE SECOND ADDRESS" : null,
      regencyId: i % 3 ? id : null,
      phone: i % 3 ? `INVALID-PHONE-${suffix}` : null,
      pic: i % 3 ? `FAKE PIC ${suffix}` : null,
      customerId: i % 3 ? id : null,
      branchId: i % 3 ? id : null,
      status,
      deletedAt,
    });
  }
}
