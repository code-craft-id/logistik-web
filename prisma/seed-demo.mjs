import "dotenv/config";
import { localDatabaseUrl } from "./local-database.mjs";

/**
 * Two demo records per new feature (customers, consignees, complete AWBs,
 * manifests with vendor, delivery sheets with outcomes). Fake data only;
 * idempotent: existing DEMO rows are reused, never duplicated or changed.
 */
let prisma;
try {
  const connectionString = localDatabaseUrl(process.env.DATABASE_URL, {
    purpose: "seed",
    nodeEnv: process.env.NODE_ENV,
  });
  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import("../src/lib/db/generated/client.ts"),
    import("@prisma/adapter-pg"),
  ]);
  prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 3000 }),
  });

  await prisma.$transaction(
    async (tx) => {
      const active = { deletedAt: null, status: "ACTIVE" };
      const first = (model, n = 1) =>
        model.findMany({ where: active, orderBy: { id: "asc" }, take: n });
      const [origin, destination] = await first(tx.branch, 2);
      const [mode] = await first(tx.transportMode);
      const [service] = await first(tx.deliveryService);
      const [goods] = await first(tx.goodsType);
      const [cost] = await first(tx.costType);
      const [vendor] = await first(tx.vendor);
      const [vehicle] = await first(tx.vehicle);
      const [courier] = await first(tx.courier);
      if (!origin || !destination || !mode || !service || !goods || !cost)
        throw new Error("Run the base fake seed first.");

      const customers = [];
      for (const name of ["DEMO CUSTOMER A", "DEMO CUSTOMER B"]) {
        customers.push(
          (await tx.customer.findFirst({ where: { name, deletedAt: null } })) ??
            (await tx.customer.create({
              data: {
                name,
                address: "Jl. Contoh No. 1",
                phone: "0210000000",
                contactPerson: "Kontak Demo",
                branchId: origin.id,
                costTypeId: cost.id,
              },
            })),
        );
      }
      for (const [i, name] of [
        "DEMO PENERIMA A",
        "DEMO PENERIMA B",
      ].entries()) {
        if (
          !(await tx.consignee.findFirst({ where: { name, deletedAt: null } }))
        )
          await tx.consignee.create({
            data: {
              name,
              address1: "Jl. Tujuan No. 2",
              phone: "0220000000",
              pic: "PIC Demo",
              customerId: customers[i].id,
              branchId: origin.id,
            },
          });
      }

      const plan = [
        {
          n: "001",
          status: "Delivered",
          outcome: "DELIVERED",
          biaya: "125000.00",
        },
        {
          n: "002",
          status: "In Transit",
          outcome: "FAILED_DELIVERY",
          biaya: "87500.00",
        },
      ];
      for (const [i, p] of plan.entries()) {
        const awbNo = `DEMO-AWB-${p.n}`;
        let awb = await tx.transaction.findFirst({
          where: { awbNo, originBranchId: origin.id },
        });
        if (!awb) {
          awb = await tx.transaction.create({
            data: {
              awbNo,
              doNo: `DEMO-DO-${p.n}`,
              transactionDate: new Date(),
              originBranchId: origin.id,
              destinationBranchId: destination.id,
              senderName: "Pengirim Demo",
              receiverName: `DEMO PENERIMA ${i === 0 ? "A" : "B"}`,
              koli: 2 + i,
              kilo: (5 + i * 2.5).toFixed(2),
              volume: "0.120",
              biaya: p.biaya,
              status: p.status,
              customerId: customers[i].id,
              transportModeId: mode.id,
              deliveryServiceId: service.id,
              goodsTypeId: goods.id,
              costTypeId: cost.id,
              description: i === 0 ? "Dokumen kontrak" : "Sparepart mesin",
              remarks: "Data demo",
            },
          });
          const steps = [
            "Open",
            "In Transit",
            ...(p.status === "Delivered" ? ["Delivered"] : []),
          ];
          for (const [k, newStatus] of steps.entries())
            await tx.transactionStatusHistory.create({
              data: {
                transactionId: awb.id,
                priorStatus: k ? steps[k - 1] : null,
                newStatus,
                reason: k ? "DEMO" : "CREATED",
              },
            });
        }
        const manifestNo = `DEMO-MAN-${p.n}`;
        const manifest =
          (await tx.manifest.findUnique({ where: { manifestNo } })) ??
          (await tx.manifest.create({
            data: {
              manifestNo,
              manifestDate: new Date(),
              type: "Outbound",
              branchId: origin.id,
              originBranchId: origin.id,
              destinationBranchId: destination.id,
              vendorId: vendor?.id ?? null,
              vehicleId: vehicle?.id ?? null,
              courierId: courier?.id ?? null,
              status: "In Transit",
            },
          }));
        if (
          !(await tx.manifestItem.findFirst({
            where: { transactionId: awb.id },
          }))
        )
          await tx.manifestItem.create({
            data: { manifestId: manifest.id, transactionId: awb.id },
          });
        const sheetNo = `DEMO-DRS-${p.n}`;
        const sheet =
          (await tx.deliverySheet.findUnique({ where: { sheetNo } })) ??
          (await tx.deliverySheet.create({
            data: {
              sheetNo,
              manifestId: manifest.id,
              deliveryDate: new Date(),
            },
          }));
        if (
          !(await tx.deliverySheetItem.findFirst({
            where: { deliverySheetId: sheet.id, transactionId: awb.id },
          }))
        )
          await tx.deliverySheetItem.create({
            data: {
              deliverySheetId: sheet.id,
              transactionId: awb.id,
              outcome: p.outcome,
              receivedBy: p.outcome === "DELIVERED" ? "Satpam Demo" : null,
              deliveredAt: p.outcome === "DELIVERED" ? new Date() : null,
              notes: p.outcome === "DELIVERED" ? null : "Alamat tutup",
            },
          });
      }
    },
    { timeout: 60000 },
  );
  console.log(
    "Demo seed complete: 2 customers, 2 consignees, 2 AWB, 2 manifests, 2 delivery sheets (DEMO-*). Existing rows unchanged.",
  );
} catch {
  console.error(
    "Demo seed refused or failed. Require a guarded local logistik_web database with applied migrations and the base fake seed. No partial writes are committed.",
  );
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
