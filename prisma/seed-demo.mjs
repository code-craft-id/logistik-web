import "dotenv/config";
import { localDatabaseUrl } from "./local-database.mjs";

/**
 * Realistic-looking demo data: two records per feature, linked end to end
 * (branches JKT/BDG, masters, customers, consignees, tariffs, bookings,
 * priced AWBs, manifests, delivery sheets, POD Kembali, AWB change requests
 * and vendor invoices). All names, numbers and addresses are fictional; no
 * provider or customer data is copied. Idempotent: rows are found by their
 * natural key and reused, never duplicated. Rows from the earlier DEMO-*
 * version of this seed are removed first.
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
      // Remove the earlier placeholder demo rows (this seed's own data).
      const old = await tx.transaction.findMany({
        where: { awbNo: { startsWith: "DEMO-AWB-" } },
        select: { id: true },
      });
      const oldIds = old.map((t) => t.id);
      if (oldIds.length) {
        await tx.deliverySheetItem.deleteMany({
          where: { transactionId: { in: oldIds } },
        });
        await tx.manifestItem.deleteMany({
          where: { transactionId: { in: oldIds } },
        });
        await tx.transactionStatusHistory.deleteMany({
          where: { transactionId: { in: oldIds } },
        });
        await tx.transaction.deleteMany({ where: { id: { in: oldIds } } });
      }
      await tx.deliverySheet.deleteMany({
        where: { sheetNo: { startsWith: "DEMO-DRS-" } },
      });
      await tx.manifest.deleteMany({
        where: { manifestNo: { startsWith: "DEMO-MAN-" } },
      });
      await tx.consignee.deleteMany({
        where: { name: { in: ["DEMO PENERIMA A", "DEMO PENERIMA B"] } },
      });
      await tx.customer.deleteMany({
        where: { name: { in: ["DEMO CUSTOMER A", "DEMO CUSTOMER B"] } },
      });

      // A fictional company and head office for the demo branches.
      const company =
        (await tx.company.findFirst({
          where: { name: "PT Nusantara Kirim Cepat", deletedAt: null },
        })) ??
        (await tx.company.create({
          data: {
            name: "PT Nusantara Kirim Cepat",
            address: "Jl. Gunung Sahari Raya No. 18",
            city: "Jakarta Pusat",
            postalCode: "10720",
            phoneNumber: "0216241188",
            email: "cs@nusantarakirim.example",
            website: "nusantarakirim.example",
            isDepositAgent: false,
            showPriceOnPrint: true,
          },
        }));
      const office =
        (await tx.office.findFirst({
          where: { companyId: company.id, code: "HO-JKT", deletedAt: null },
        })) ??
        (await tx.office.create({
          data: {
            companyId: company.id,
            code: "HO-JKT",
            name: "Kantor Pusat Jakarta",
            address: "Jl. Gunung Sahari Raya No. 18",
            city: "Jakarta Pusat",
            phoneNumber: "0216241188",
            status: "ACTIVE",
          },
        }));
      const admin = await tx.user.findFirst({ orderBy: { id: "asc" } });
      const reviewer = await tx.user.findFirst({
        where: { id: { not: admin?.id ?? 0 } },
        orderBy: { id: "asc" },
      });

      const ensure = async (model, where, data) =>
        (await model.findFirst({ where })) ?? (await model.create({ data }));

      // Branches and masters.
      const branch = {};
      for (const [code, name, city, address, phone] of [
        [
          "JKT",
          "JAKARTA",
          "Jakarta",
          "Jl. Gunung Sahari Raya No. 18, Jakarta Pusat",
          "0216241188",
        ],
        [
          "BDG",
          "BANDUNG",
          "Bandung",
          "Jl. Soekarno-Hatta No. 412, Bandung",
          "0227561290",
        ],
      ])
        branch[code] = await ensure(
          tx.branch,
          { code, deletedAt: null },
          {
            officeId: office.id,
            code,
            name,
            city,
            address,
            phoneNumber: phone,
            status: "ACTIVE",
          },
        );
      // Demo branches created by an earlier run belong to this office too.
      await tx.branch.updateMany({
        where: {
          id: { in: Object.values(branch).map((b) => b.id) },
          officeId: { not: office.id },
        },
        data: { officeId: office.id },
      });
      const named = async (model, names, extra = () => ({})) => {
        const out = [];
        for (const [i, name] of names.entries())
          out.push(
            await ensure(
              model,
              { name, deletedAt: null },
              { name, ...extra(i) },
            ),
          );
        return out;
      };
      const [darat, udara] = await named(
        tx.transportMode,
        ["DARAT", "UDARA"],
        (i) => ({
          divider: i ? "6000" : "4000",
        }),
      );
      const [reguler, express] = await named(
        tx.deliveryService,
        ["REGULER", "EXPRESS"],
        (i) => ({
          transportModeId: i ? udara.id : darat.id,
        }),
      );
      const [doc, pac] = await named(tx.goodsType, ["DOC", "PAC"]);
      const [cash, kredit] = await named(tx.costType, ["CASH", "KREDIT"]);
      const [kurirJkt, kurirBdg] = await named(
        tx.courier,
        ["Andi Pratama", "Rudi Hartono"],
        (i) => ({
          address: i
            ? "Jl. Kiaracondong No. 77, Bandung"
            : "Jl. Pramuka No. 21, Jakarta Timur",
          nationalIdNumber: i ? "3273011204900002" : "3175021508910001",
          phone: i ? "081322004512" : "081210338841",
          branchId: i ? branch.BDG.id : branch.JKT.id,
        }),
      );
      const [driverJkt, driverBdg] = await named(
        tx.driver,
        ["Slamet Riyadi", "Joko Susilo"],
        (i) => ({
          address: i
            ? "Jl. Cibaduyut No. 5, Bandung"
            : "Jl. Raya Bekasi KM 18, Jakarta Timur",
          nationalIdNumber: i ? "3273050307850004" : "3175070912820003",
          driverLicenseNumber: i ? "8507-1234-000412" : "8203-5678-000981",
          phone: i ? "085721114490" : "081398126677",
          branchId: i ? branch.BDG.id : branch.JKT.id,
        }),
      );
      const [mktJkt, mktBdg] = await named(
        tx.marketingPerson,
        ["Dewi Lestari", "Rina Marlina"],
        (i) => ({
          address: i
            ? "Jl. Buah Batu No. 101, Bandung"
            : "Jl. Kemang Raya No. 9, Jakarta Selatan",
          nationalIdNumber: i ? "3273046110930006" : "3174055203940005",
          phone: i ? "082119874420" : "081287553301",
          branchId: i ? branch.BDG.id : branch.JKT.id,
        }),
      );
      const [vendorA, vendorB] = await named(
        tx.vendor,
        ["PT Cahaya Ekspres Nusantara", "CV Sinar Logistik Mandiri"],
        (i) => ({
          address1: i ? "Jl. Moh. Toha No. 210" : "Jl. Daan Mogot KM 11 No. 8",
          address2: i ? "Kel. Pelindung Hewan" : "Kel. Kedaung Kali Angke",
          city: i ? "Bandung" : "Jakarta Barat",
          postalCode: i ? "40243" : "11710",
          phone: i ? "0225201144" : "0215441290",
          fax: i ? "0225201145" : "0215441291",
          email: i
            ? "ops@sinarlogistik.example"
            : "admin@cahayaekspres.example",
          contactName: i ? "Hendra Wijaya" : "Agus Salim",
          branch: i ? "BANDUNG" : "JAKARTA",
        }),
      );
      const vehicles = [];
      for (const [i, v] of [
        ["Mitsubishi L300 Box", "B 9012 KXA", 2021, "Putih"],
        ["Isuzu Elf NMR 71", "D 8123 VB", 2019, "Kuning"],
      ].entries())
        vehicles.push(
          await ensure(
            tx.vehicle,
            { licensePlate: v[1], deletedAt: null },
            {
              name: v[0],
              licensePlate: v[1],
              year: v[2],
              color: v[3],
              registrationHolderName: "PT Logistik Demo Indonesia",
              registrationNumber: i ? "STNK-BDG-554120" : "STNK-JKT-118845",
              cylinderCapacity: i ? "4570 cc" : "2268 cc",
              insuranceName: "Asuransi Kendaraan Demo",
              description: i
                ? "Armada antar kota Bandung"
                : "Armada pickup Jakarta",
              chassisNumber: i ? "MHCNMR71HKJ004512" : "MK2L0PU39MJ001288",
              engineNumber: i ? "4HK1-554120" : "4N15-118845",
              branchId: i ? branch.BDG.id : branch.JKT.id,
            },
          ),
        );

      // Customers, consignees, tariffs, bookings.
      const [custA, custB] = [
        await ensure(
          tx.customer,
          { name: "PT Maju Bersama Elektronik", deletedAt: null },
          {
            name: "PT Maju Bersama Elektronik",
            address: "Jl. Mangga Dua Raya Blok C No. 12, Jakarta Utara",
            phone: "0216125588",
            contactPerson: "Bapak Herman",
            email: "purchasing@majubersama.example",
            branchId: branch.JKT.id,
            marketingPersonId: mktJkt.id,
            costTypeId: kredit.id,
          },
        ),
        await ensure(
          tx.customer,
          { name: "CV Sumber Rejeki Textile", deletedAt: null },
          {
            name: "CV Sumber Rejeki Textile",
            address: "Jl. Cigondewah Kaler No. 45, Bandung",
            phone: "0225403312",
            contactPerson: "Ibu Siti Rahma",
            email: "admin@sumberrejeki.example",
            branchId: branch.BDG.id,
            marketingPersonId: mktBdg.id,
            costTypeId: cash.id,
          },
        ),
      ];
      const [consA, consB] = [
        await ensure(
          tx.consignee,
          { name: "Toko Sinar Jaya Elektronik", deletedAt: null },
          {
            name: "Toko Sinar Jaya Elektronik",
            address1: "Jl. Otto Iskandardinata No. 88, Bandung",
            phone: "081322778810",
            pic: "Bapak Yusuf",
            customerId: custA.id,
            branchId: branch.JKT.id,
          },
        ),
        await ensure(
          tx.consignee,
          { name: "PT Andalan Busana Indonesia", deletedAt: null },
          {
            name: "PT Andalan Busana Indonesia",
            address1: "Jl. Tanah Abang II No. 31, Jakarta Pusat",
            phone: "081511908877",
            pic: "Ibu Maya",
            customerId: custB.id,
            branchId: branch.BDG.id,
          },
        ),
      ];
      for (const t of [
        [branch.JKT, branch.BDG, reguler, "3", "8500", "1-2 hari"],
        [branch.BDG, branch.JKT, express, "1", "12000", "1 hari"],
      ])
        await ensure(
          tx.tariff,
          {
            originBranchId: t[0].id,
            destinationBranchId: t[1].id,
            deliveryServiceId: t[2].id,
            deletedAt: null,
          },
          {
            originBranchId: t[0].id,
            destinationBranchId: t[1].id,
            deliveryServiceId: t[2].id,
            minWeight: t[3],
            pricePerKg: t[4],
            eta: t[5],
          },
        );
      for (const b of [
        [
          "BKG-JKT-2611-0001",
          branch.JKT,
          custA,
          "Toko Sinar Jaya Elektronik",
          "BANDUNG",
          3,
          "12.50",
          "125000.00",
          "2026-11-17",
        ],
        [
          "BKG-BDG-2611-0001",
          branch.BDG,
          custB,
          "PT Andalan Busana Indonesia",
          "JAKARTA",
          2,
          "8.00",
          "96000.00",
          "2026-11-18",
        ],
      ])
        await ensure(
          tx.booking,
          { bookingNo: b[0], deletedAt: null },
          {
            bookingNo: b[0],
            branchId: b[1].id,
            customerId: b[2].id,
            senderName: b[2].name,
            receiverName: b[3],
            destination: b[4],
            koli: b[5],
            kilo: b[6],
            biaya: b[7],
            bookingDate: new Date(`${b[8]}T02:00:00Z`),
            createdById: admin?.id ?? null,
          },
        );

      // AWBs (priced like the Entry AWB form; Grand Total stored as biaya).
      const awbs = {};
      const plan = [
        {
          no: "JKT261100001",
          from: branch.JKT,
          to: branch.BDG,
          date: "2026-11-12",
          cust: custA,
          cons: consA,
          mkt: mktJkt,
          courier: kurirJkt,
          svc: reguler,
          mode: darat,
          goods: pac,
          cost: kredit,
          koli: 3,
          kilo: "12.50",
          volume: "10.000",
          pricing: "KG",
          price: "8500",
          min: "3",
          packing: "15000",
          total: "121250",
          biaya: "121250",
          heavy: "12.50",
          desc: "Televisi LED 43 inch",
          steps: ["Open", "In Transit", "Delivered"],
        },
        {
          no: "JKT261100002",
          from: branch.JKT,
          to: branch.BDG,
          date: "2026-11-14",
          cust: custA,
          cons: consA,
          mkt: mktJkt,
          courier: kurirJkt,
          svc: reguler,
          mode: darat,
          goods: pac,
          cost: kredit,
          koli: 4,
          kilo: "20.00",
          volume: "18.000",
          pricing: "KOLI",
          price: "25000",
          pickup: "10000",
          discount: "5",
          total: "110000",
          biaya: "104500",
          heavy: "20.00",
          desc: "Speaker aktif",
          steps: ["Open", "In Transit"],
        },
        {
          no: "BDG261100001",
          from: branch.BDG,
          to: branch.JKT,
          date: "2026-11-13",
          cust: custB,
          cons: consB,
          mkt: mktBdg,
          courier: kurirBdg,
          svc: express,
          mode: udara,
          goods: pac,
          cost: cash,
          koli: 2,
          kilo: "3.20",
          volume: "4.000",
          pricing: "KG",
          price: "12000",
          min: "1",
          ppn: "11",
          total: "48000",
          biaya: "53280",
          heavy: "4.00",
          desc: "Kain katun 2 roll",
          steps: ["Open", "In Transit", "Delivered"],
        },
        {
          no: "BDG261100002",
          from: branch.BDG,
          to: branch.JKT,
          date: "2026-11-18",
          cust: custB,
          cons: consB,
          mkt: mktBdg,
          courier: kurirBdg,
          svc: express,
          mode: udara,
          goods: doc,
          cost: cash,
          koli: 1,
          kilo: "1.50",
          volume: "0.500",
          pricing: "KG",
          price: "12000",
          min: "1",
          total: "18000",
          biaya: "18000",
          heavy: "1.50",
          desc: "Dokumen kontrak",
          steps: ["Open"],
        },
      ];
      for (const p of plan) {
        let t = await tx.transaction.findFirst({
          where: { awbNo: p.no, originBranchId: p.from.id },
        });
        if (!t) {
          const at = new Date(`${p.date}T03:00:00Z`);
          t = await tx.transaction.create({
            data: {
              awbNo: p.no,
              transactionDate: at,
              doNo: `DO/${p.cust.id}/${p.no.slice(-4)}`,
              originBranchId: p.from.id,
              destinationBranchId: p.to.id,
              customerId: p.cust.id,
              marketingPersonId: p.mkt.id,
              pickupCourierId: p.courier.id,
              senderName: p.cust.name,
              senderAddress: p.cust.address,
              senderPhone: p.cust.phone,
              consigneeId: p.cons.id,
              receiverName: p.cons.name,
              receiverAddress: p.cons.address1,
              receiverPhone: p.cons.phone,
              deliveryServiceId: p.svc.id,
              transportModeId: p.mode.id,
              goodsTypeId: p.goods.id,
              costTypeId: p.cost.id,
              koli: p.koli,
              kilo: p.kilo,
              volume: p.volume,
              chargeableWeight: p.heavy,
              pricingType: p.pricing,
              pricePerKg: p.price,
              minWeight: p.min ?? null,
              insured: false,
              packingFee: p.packing ?? null,
              pickupFee: p.pickup ?? null,
              discountPercent: p.discount ?? null,
              ppnPercent: p.ppn ?? null,
              totalCost: p.total,
              biaya: p.biaya,
              description: p.desc,
              remarks: "Barang mudah pecah, jangan ditumpuk",
              status: p.steps.at(-1),
              createdById: admin?.id ?? null,
            },
          });
          for (const [k, newStatus] of p.steps.entries())
            await tx.transactionStatusHistory.create({
              data: {
                transactionId: t.id,
                priorStatus: k ? p.steps[k - 1] : null,
                newStatus,
                reason: [
                  "AWB dibuat",
                  "Berangkat dari gudang",
                  "Diterima penerima",
                ][k],
                actorId: admin?.id ?? null,
                changedAt: new Date(at.getTime() + k * 86_400_000),
              },
            });
        }
        awbs[p.no] = t;
      }

      // Manifests, delivery sheets.
      const manifests = [
        [
          "MNF-JKT-2611-0001",
          branch.JKT,
          branch.BDG,
          null,
          vehicles[0],
          kurirJkt,
          ["JKT261100001", "JKT261100002"],
          "2026-11-14",
        ],
        [
          "MNF-BDG-2611-0001",
          branch.BDG,
          branch.JKT,
          vendorA,
          vehicles[1],
          kurirBdg,
          ["BDG261100001"],
          "2026-11-13",
        ],
      ];
      const sheets = [];
      for (const [
        no,
        from,
        to,
        vendor,
        vehicle,
        courier,
        items,
        date,
      ] of manifests) {
        const manifest = await ensure(
          tx.manifest,
          { manifestNo: no },
          {
            manifestNo: no,
            manifestDate: new Date(`${date}T05:00:00Z`),
            type: "Outbound",
            branchId: from.id,
            originBranchId: from.id,
            destinationBranchId: to.id,
            vendorId: vendor?.id ?? null,
            vehicleId: vehicle.id,
            courierId: courier.id,
            status: "In Transit",
            createdById: admin?.id ?? null,
          },
        );
        for (const awbNo of items)
          await ensure(
            tx.manifestItem,
            { transactionId: awbs[awbNo].id },
            {
              manifestId: manifest.id,
              transactionId: awbs[awbNo].id,
              assignedById: admin?.id ?? null,
            },
          );
        const sheetNo = no.replace("MNF", "DRS");
        sheets.push([
          await ensure(
            tx.deliverySheet,
            { sheetNo },
            {
              sheetNo,
              manifestId: manifest.id,
              deliveryDate: new Date(`${date}T08:00:00Z`),
            },
          ),
          items,
        ]);
      }
      for (const [sheet, items] of sheets)
        for (const awbNo of items) {
          const delivered = awbs[awbNo].status === "Delivered";
          await ensure(
            tx.deliverySheetItem,
            { deliverySheetId: sheet.id, transactionId: awbs[awbNo].id },
            {
              deliverySheetId: sheet.id,
              transactionId: awbs[awbNo].id,
              outcome: delivered ? "DELIVERED" : "FAILED_DELIVERY",
              deliveredAt: delivered
                ? new Date(sheet.deliveryDate.getTime() + 4 * 3_600_000)
                : null,
              receivedBy: delivered ? "Satpam Bapak Darto" : null,
              notes: delivered ? null : "Toko tutup, dikirim ulang besok",
            },
          );
        }

      // POD Kembali: the delivering branch returns proofs to the origin.
      for (const [no, from, to, driver, awbNo, status] of [
        [
          "POD-20261116-0001",
          branch.BDG,
          branch.JKT,
          driverBdg,
          "JKT261100001",
          "PENDING",
        ],
        [
          "POD-20261115-0001",
          branch.JKT,
          branch.BDG,
          driverJkt,
          "BDG261100001",
          "APPROVED",
        ],
      ]) {
        const doc = await ensure(
          tx.podReturn,
          { returnNo: no },
          {
            returnNo: no,
            returnDate: new Date(
              `${no.slice(4, 8)}-${no.slice(8, 10)}-${no.slice(10, 12)}T00:00:00Z`,
            ),
            originBranchId: from.id,
            destinationBranchId: to.id,
            driverId: driver.id,
            notes: "POD asli dikirim bersama manifest balik",
            status,
            createdById: admin?.id ?? null,
            decidedById:
              status === "PENDING" ? null : (reviewer?.id ?? admin?.id ?? null),
            decidedAt:
              status === "PENDING" ? null : new Date("2026-11-17T04:00:00Z"),
          },
        );
        await ensure(
          tx.podReturnItem,
          { podReturnId: doc.id, transactionId: awbs[awbNo].id },
          { podReturnId: doc.id, transactionId: awbs[awbNo].id },
        );
      }

      // AWB change requests: one edit waiting, one delete rejected.
      for (const [awbNo, kind, reason, status, note] of [
        [
          "BDG261100002",
          "EDIT",
          "Nomor telepon penerima salah ketik",
          "PENDING",
          null,
        ],
        [
          "JKT261100002",
          "DELETE",
          "Customer membatalkan sebagian kiriman",
          "REJECTED",
          "Barang sudah di manifest, tidak bisa dihapus",
        ],
      ])
        await ensure(
          tx.awbChangeRequest,
          { transactionId: awbs[awbNo].id, kind },
          {
            transactionId: awbs[awbNo].id,
            kind,
            reason,
            status,
            requestedById: admin?.id ?? null,
            decidedById:
              status === "PENDING" ? null : (reviewer?.id ?? admin?.id ?? null),
            decidedAt:
              status === "PENDING" ? null : new Date("2026-11-18T06:30:00Z"),
            decisionNote: note,
          },
        );

      // Pembayaran Hutang: one open, one paid.
      for (const [
        vendor,
        invoiceNo,
        category,
        billDate,
        received,
        term,
        amount,
        status,
        awbNo,
      ] of [
        [
          vendorA,
          "INV/CEN/2611/017",
          "Agen",
          "2026-11-14",
          "2026-11-15",
          14,
          "350000.00",
          "OPEN",
          "BDG261100001",
        ],
        [
          vendorB,
          "INV-SLM-0098",
          "Vendor",
          "2026-11-03",
          "2026-11-04",
          7,
          "1250000.00",
          "PAID",
          null,
        ],
      ]) {
        const bill = await ensure(
          tx.vendorBill,
          { vendorId: vendor.id, invoiceNo },
          {
            vendorId: vendor.id,
            invoiceNo,
            category,
            billDate: new Date(`${billDate}T00:00:00Z`),
            receivedDate: new Date(`${received}T00:00:00Z`),
            termDays: term,
            amount,
            status,
            closedAt:
              status === "PAID" ? new Date("2026-11-10T09:00:00Z") : null,
            closedById: status === "PAID" ? (admin?.id ?? null) : null,
            createdById: admin?.id ?? null,
          },
        );
        if (awbNo)
          await ensure(
            tx.vendorBillItem,
            { vendorBillId: bill.id, transactionId: awbs[awbNo].id },
            { vendorBillId: bill.id, transactionId: awbs[awbNo].id },
          );
      }
    },
    { timeout: 120000 },
  );
  console.log(
    "Demo seed complete: branches JKT/BDG with 2 records per feature (masters, customers, consignees, tariffs, bookings, 4 AWB, manifests, DRS, POD Kembali, AWB requests, vendor invoices). Existing rows unchanged.",
  );
} catch (error) {
  console.error(
    "Demo seed refused or failed. Require a guarded local logistik_web database with applied migrations and the base fake seed. No partial writes are committed.",
  );
  if (process.env.DEBUG_SEED) console.error(error);
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
