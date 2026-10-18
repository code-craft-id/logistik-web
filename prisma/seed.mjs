import "dotenv/config";
import { localDatabaseUrl } from "./local-database.mjs";

// Fixed fake IDs keep reruns deterministic without adding business uniqueness.
// Explicit IDs do not advance PostgreSQL sequences. Existing rows are never updated.
const firstId = 9_100_001n;
const secondId = 9_100_002n;

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
  await delegate.create({ data });
}

let prisma;
try {
  const connectionString = localDatabaseUrl(process.env.DATABASE_URL, {
    purpose: "seed",
    nodeEnv: process.env.NODE_ENV,
  });
  // The guard must pass before importing the client or creating the adapter.
  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import("../src/lib/db/generated/client.ts"),
    import("@prisma/adapter-pg"),
  ]);
  prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 3000 }),
  });

  await prisma.$transaction(async (tx) => {
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

    for (const [id, suffix, status] of [
      [firstId, "001", "ACTIVE"],
      [secondId, "002", "INACTIVE"],
    ]) {
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
    }
  });
  console.log(
    "Fake development seed complete: 18 fixtures; existing rows unchanged.",
  );
} catch {
  // Avoid exposing connection strings, database errors, or personal data.
  console.error(
    "Seed refused or failed. Require non-production, localhost/127.0.0.1, logistik_web, no connection overrides, applied migrations, and unmodified fake IDs 9100001-9100002. No partial seed writes are committed.",
  );
  process.exitCode = 1;
} finally {
  if (prisma) await prisma.$disconnect();
}
