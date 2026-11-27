-- Speed up paged master lists (ORDER BY name / code LIMIT n) on large tables:
-- Kelurahan, Kecamatan, Kabupaten, Kode Pos, Customer, Penerima, Vendor.
-- Index-only change; existing rows and data are untouched.
-- Rollback: DROP INDEX each index below.

CREATE INDEX "regencies_name_idx" ON "regencies"("name");
CREATE INDEX "districts_name_idx" ON "districts"("name");
CREATE INDEX "villages_name_idx" ON "villages"("name");
CREATE INDEX "postal_codes_code_idx" ON "postal_codes"("code");
CREATE INDEX "vendors_name_idx" ON "vendors"("name");
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE INDEX "consignees_name_idx" ON "consignees"("name");
