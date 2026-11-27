-- Business identifiers must not repeat (user 2026-11-27): Kode Agen, Kode
-- Cabang, Kode Kantor, Kode Departemen, No. Booking, No. AWB (all branches),
-- No. Invoice Share Truck, Kode Shipment Status, No. Polisi kendaraan.
-- Checked before release: no duplicate values in existing rows.
-- Soft-deleted rows keep their value, so a deleted code is not reused.
-- Rollback: DROP INDEX each index below.

-- Stop before any change if existing rows already repeat a value.
DO $$
DECLARE t text; c text; n int;
BEGIN
  FOR t, c IN VALUES ('agents','code'), ('bookings','booking_no'), ('branches','code'),
    ('charter_invoices','invoice_no'), ('departments','code'), ('offices','code'),
    ('shipment_statuses','code'), ('transactions','awb_no'), ('vehicles','license_plate')
  LOOP
    EXECUTE format('SELECT count(*) FROM (SELECT %I FROM %I WHERE %I IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d', c, t, c) INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'Duplicate %.% values (% groups): fix them before this migration', t, c, n;
    END IF;
  END LOOP;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "agents_code_key" ON "agents"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_no_key" ON "bookings"("booking_no");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "charter_invoices_invoice_no_key" ON "charter_invoices"("invoice_no");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "offices_code_key" ON "offices"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_statuses_code_key" ON "shipment_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_awb_no_key" ON "transactions"("awb_no");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "vehicles"("license_plate");

