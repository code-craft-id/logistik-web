-- FIN-01/FIN-02 delete guards (PR #11 review: posted records were protected
-- against UPDATE only). Additive: no table, column, index or data change.
-- Corrections stay compensating events (reversal journals, receipt reversals,
-- invoice VOID); drafts remain deletable by the application.
-- Rollback: forward-fix migration dropping these triggers and functions.

CREATE FUNCTION fin_journal_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'POSTED' THEN RAISE EXCEPTION 'Posted journal cannot be deleted'; END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER fin_journal_no_delete BEFORE DELETE ON fin_journals FOR EACH ROW EXECUTE FUNCTION fin_journal_no_delete();

CREATE FUNCTION fin_line_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM fin_journals WHERE id = OLD."journalId" AND status = 'POSTED')
  THEN RAISE EXCEPTION 'Posted journal line cannot be deleted'; END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER fin_line_no_delete BEFORE DELETE ON fin_lines FOR EACH ROW EXECUTE FUNCTION fin_line_no_delete();

CREATE FUNCTION fin_receipt_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Receipt events cannot be deleted';
END $$;
CREATE TRIGGER fin_receipt_no_delete BEFORE DELETE ON fin_receipts FOR EACH ROW EXECUTE FUNCTION fin_receipt_no_delete();

CREATE FUNCTION fin_invoice_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'DRAFT' THEN RAISE EXCEPTION 'Issued or void invoice cannot be deleted'; END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER fin_invoice_no_delete BEFORE DELETE ON fin_invoices FOR EACH ROW EXECUTE FUNCTION fin_invoice_no_delete();

CREATE FUNCTION fin_invoice_item_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM fin_invoices WHERE id = OLD."invoiceId" AND status <> 'DRAFT')
  THEN RAISE EXCEPTION 'Issued invoice item cannot be deleted'; END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER fin_invoice_item_no_delete BEFORE DELETE ON fin_invoice_items FOR EACH ROW EXECUTE FUNCTION fin_invoice_item_no_delete();
