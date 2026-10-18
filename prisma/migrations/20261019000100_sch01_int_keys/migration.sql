-- Coordinated cross-domain narrowing. Preserve rows, IDs and sequence positions.
-- Applied migrations are immutable. Abort before changes on overflow or lock contention.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE "account_branches", "account_categories", "accounts", "agents", "branches", "cashflow_categories", "companies", "company_banks", "company_digital_wallets", "company_invoices", "cost_types", "couriers", "customer_whatsapp_notifications", "delivery_services", "departments", "districts", "drivers", "goods_types", "ledgers", "marketing_people", "offices", "postal_codes", "profit_loss_categories", "provinces", "refresh_tokens", "regencies", "service_categories", "shipment_statuses", "terms", "transport_modes", "trucking_types", "users", "vehicle_types", "vehicles", "vendor_accounting", "vendor_tax_profiles", "vendors", "villages" IN ACCESS EXCLUSIVE MODE;
DO $$
DECLARE sequence_value bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM "ledgers" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in ledgers; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "ledgers_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in ledgers; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "account_categories" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in account_categories; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "account_categories_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in account_categories; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "profit_loss_categories" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in profit_loss_categories; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "profit_loss_categories_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in profit_loss_categories; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "cashflow_categories" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in cashflow_categories; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "cashflow_categories_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in cashflow_categories; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "account_branches" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in account_branches; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "account_branches_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in account_branches; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "accounts" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "parent_id" NOT BETWEEN -2147483648 AND 2147483647 OR "ledger_id" NOT BETWEEN -2147483648 AND 2147483647 OR "account_category_id" NOT BETWEEN -2147483648 AND 2147483647 OR "profit_loss_category_id" NOT BETWEEN -2147483648 AND 2147483647 OR "cashflow_category_id" NOT BETWEEN -2147483648 AND 2147483647 OR "accounting_branch_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in accounts; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "accounts_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in accounts; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "vendor_accounting" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "vendor_id" NOT BETWEEN -2147483648 AND 2147483647 OR "debit_account_id" NOT BETWEEN -2147483648 AND 2147483647 OR "credit_payable_account_id" NOT BETWEEN -2147483648 AND 2147483647 OR "credit_revenue_account_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in vendor_accounting; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "vendor_accounting_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in vendor_accounting; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "company_banks" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "company_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in company_banks; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "company_banks_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in company_banks; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "company_invoices" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "company_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in company_invoices; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "company_invoices_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in company_invoices; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "company_digital_wallets" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "company_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in company_digital_wallets; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "company_digital_wallets_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in company_digital_wallets; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "users" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in users; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "users_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in users; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "refresh_tokens" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "user_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in refresh_tokens; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "refresh_tokens_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in refresh_tokens; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "customer_whatsapp_notifications" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "company_id" NOT BETWEEN -2147483648 AND 2147483647 OR "customer_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in customer_whatsapp_notifications; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "customer_whatsapp_notifications_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in customer_whatsapp_notifications; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "provinces" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in provinces; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "provinces_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in provinces; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "regencies" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in regencies; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "regencies_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in regencies; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "districts" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in districts; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "districts_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in districts; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "villages" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in villages; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "villages_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in villages; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "postal_codes" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in postal_codes; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "postal_codes_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in postal_codes; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "drivers" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "branch_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in drivers; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "drivers_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in drivers; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "couriers" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "branch_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in couriers; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "couriers_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in couriers; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "transport_modes" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in transport_modes; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "transport_modes_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in transport_modes; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "service_categories" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in service_categories; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "service_categories_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in service_categories; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "delivery_services" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "service_category_id" NOT BETWEEN -2147483648 AND 2147483647 OR "transport_mode_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in delivery_services; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "delivery_services_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in delivery_services; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "goods_types" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in goods_types; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "goods_types_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in goods_types; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "cost_types" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in cost_types; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "cost_types_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in cost_types; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "terms" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in terms; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "terms_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in terms; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "vehicles" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "trucking_type_id" NOT BETWEEN -2147483648 AND 2147483647 OR "branch_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in vehicles; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "vehicles_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in vehicles; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "vehicle_types" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in vehicle_types; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "vehicle_types_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in vehicle_types; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "trucking_types" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in trucking_types; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "trucking_types_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in trucking_types; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "shipment_statuses" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in shipment_statuses; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "shipment_statuses_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in shipment_statuses; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "vendors" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in vendors; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "vendors_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in vendors; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "vendor_tax_profiles" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "vendor_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in vendor_tax_profiles; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "vendor_tax_profiles_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in vendor_tax_profiles; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "companies" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in companies; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "companies_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in companies; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "offices" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "company_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in offices; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "offices_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in offices; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "branches" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "office_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in branches; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "branches_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in branches; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "departments" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in departments; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "departments_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in departments; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "agents" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "branch_id" NOT BETWEEN -2147483648 AND 2147483647 OR "department_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in agents; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "agents_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in agents; no changes applied';
  END IF;
  IF EXISTS (SELECT 1 FROM "marketing_people" WHERE "id" NOT BETWEEN -2147483648 AND 2147483647 OR "branch_id" NOT BETWEEN -2147483648 AND 2147483647) THEN
    RAISE EXCEPTION 'SCH-01 Int overflow in marketing_people; no changes applied';
  END IF;
  SELECT last_value INTO sequence_value FROM "marketing_people_id_seq";
  IF sequence_value NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'SCH-01 sequence overflow in marketing_people; no changes applied';
  END IF;
END $$;
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_account_category_id_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_accounting_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_cashflow_category_id_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_ledger_id_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_profit_loss_category_id_fkey";

-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_department_id_fkey";

-- DropForeignKey
ALTER TABLE "branches" DROP CONSTRAINT "branches_office_id_fkey";

-- DropForeignKey
ALTER TABLE "company_banks" DROP CONSTRAINT "company_banks_company_id_fkey";

-- DropForeignKey
ALTER TABLE "company_digital_wallets" DROP CONSTRAINT "company_digital_wallets_company_id_fkey";

-- DropForeignKey
ALTER TABLE "company_invoices" DROP CONSTRAINT "company_invoices_company_id_fkey";

-- DropForeignKey
ALTER TABLE "couriers" DROP CONSTRAINT "couriers_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_whatsapp_notifications" DROP CONSTRAINT "customer_whatsapp_notifications_company_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_services" DROP CONSTRAINT "delivery_services_service_category_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_services" DROP CONSTRAINT "delivery_services_transport_mode_id_fkey";

-- DropForeignKey
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "marketing_people" DROP CONSTRAINT "marketing_people_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "offices" DROP CONSTRAINT "offices_company_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_trucking_type_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor_accounting" DROP CONSTRAINT "vendor_accounting_credit_payable_account_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor_accounting" DROP CONSTRAINT "vendor_accounting_credit_revenue_account_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor_accounting" DROP CONSTRAINT "vendor_accounting_debit_account_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor_accounting" DROP CONSTRAINT "vendor_accounting_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor_tax_profiles" DROP CONSTRAINT "vendor_tax_profiles_vendor_id_fkey";

-- AlterTable
ALTER TABLE "account_branches" DROP CONSTRAINT "account_branches_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "account_branches_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "account_categories" DROP CONSTRAINT "account_categories_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "account_categories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "parent_id" SET DATA TYPE INTEGER,
ALTER COLUMN "ledger_id" SET DATA TYPE INTEGER,
ALTER COLUMN "account_category_id" SET DATA TYPE INTEGER,
ALTER COLUMN "profit_loss_category_id" SET DATA TYPE INTEGER,
ALTER COLUMN "cashflow_category_id" SET DATA TYPE INTEGER,
ALTER COLUMN "accounting_branch_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "agents" DROP CONSTRAINT "agents_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "branch_id" SET DATA TYPE INTEGER,
ALTER COLUMN "department_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "branches" DROP CONSTRAINT "branches_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "office_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "cashflow_categories" DROP CONSTRAINT "cashflow_categories_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "cashflow_categories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "companies" DROP CONSTRAINT "companies_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "company_banks" DROP CONSTRAINT "company_banks_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "company_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "company_banks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "company_digital_wallets" DROP CONSTRAINT "company_digital_wallets_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "company_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "company_digital_wallets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "company_invoices" DROP CONSTRAINT "company_invoices_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "company_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "company_invoices_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "cost_types" DROP CONSTRAINT "cost_types_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "cost_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "couriers" DROP CONSTRAINT "couriers_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "branch_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "couriers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "customer_whatsapp_notifications" DROP CONSTRAINT "customer_whatsapp_notifications_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "company_id" SET DATA TYPE INTEGER,
ALTER COLUMN "customer_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "customer_whatsapp_notifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "delivery_services" DROP CONSTRAINT "delivery_services_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "service_category_id" SET DATA TYPE INTEGER,
ALTER COLUMN "transport_mode_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "delivery_services_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "departments" DROP CONSTRAINT "departments_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "districts" DROP CONSTRAINT "districts_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "districts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "branch_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "goods_types" DROP CONSTRAINT "goods_types_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "goods_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ledgers" DROP CONSTRAINT "ledgers_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "marketing_people" DROP CONSTRAINT "marketing_people_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "branch_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "marketing_people_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "offices" DROP CONSTRAINT "offices_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "company_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "offices_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "postal_codes" DROP CONSTRAINT "postal_codes_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "postal_codes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "profit_loss_categories" DROP CONSTRAINT "profit_loss_categories_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "profit_loss_categories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "provinces" DROP CONSTRAINT "provinces_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "provinces_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "user_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "regencies" DROP CONSTRAINT "regencies_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "regencies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "service_categories" DROP CONSTRAINT "service_categories_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "shipment_statuses" DROP CONSTRAINT "shipment_statuses_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "shipment_statuses_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "terms" DROP CONSTRAINT "terms_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "terms_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "transport_modes" DROP CONSTRAINT "transport_modes_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "transport_modes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "trucking_types" DROP CONSTRAINT "trucking_types_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "trucking_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vehicle_types" DROP CONSTRAINT "vehicle_types_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "trucking_type_id" SET DATA TYPE INTEGER,
ALTER COLUMN "branch_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vendor_accounting" DROP CONSTRAINT "vendor_accounting_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "vendor_id" SET DATA TYPE INTEGER,
ALTER COLUMN "debit_account_id" SET DATA TYPE INTEGER,
ALTER COLUMN "credit_payable_account_id" SET DATA TYPE INTEGER,
ALTER COLUMN "credit_revenue_account_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "vendor_accounting_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vendor_tax_profiles" DROP CONSTRAINT "vendor_tax_profiles_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "vendor_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "vendor_tax_profiles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "villages" DROP CONSTRAINT "villages_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "villages_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_category_id_fkey" FOREIGN KEY ("account_category_id") REFERENCES "account_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_profit_loss_category_id_fkey" FOREIGN KEY ("profit_loss_category_id") REFERENCES "profit_loss_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_cashflow_category_id_fkey" FOREIGN KEY ("cashflow_category_id") REFERENCES "cashflow_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_accounting_branch_id_fkey" FOREIGN KEY ("accounting_branch_id") REFERENCES "account_branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_debit_account_id_fkey" FOREIGN KEY ("debit_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_credit_payable_account_id_fkey" FOREIGN KEY ("credit_payable_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_credit_revenue_account_id_fkey" FOREIGN KEY ("credit_revenue_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "company_banks" ADD CONSTRAINT "company_banks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "company_invoices" ADD CONSTRAINT "company_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "company_digital_wallets" ADD CONSTRAINT "company_digital_wallets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customer_whatsapp_notifications" ADD CONSTRAINT "customer_whatsapp_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_services" ADD CONSTRAINT "delivery_services_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_services" ADD CONSTRAINT "delivery_services_transport_mode_id_fkey" FOREIGN KEY ("transport_mode_id") REFERENCES "transport_modes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_trucking_type_id_fkey" FOREIGN KEY ("trucking_type_id") REFERENCES "trucking_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_tax_profiles" ADD CONSTRAINT "vendor_tax_profiles_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "offices" ADD CONSTRAINT "offices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "marketing_people" ADD CONSTRAINT "marketing_people_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER SEQUENCE "ledgers_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "account_categories_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "profit_loss_categories_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "cashflow_categories_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "account_branches_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "accounts_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "vendor_accounting_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "company_banks_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "company_invoices_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "company_digital_wallets_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "users_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "refresh_tokens_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "customer_whatsapp_notifications_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "provinces_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "regencies_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "districts_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "villages_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "postal_codes_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "drivers_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "couriers_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "transport_modes_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "service_categories_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "delivery_services_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "goods_types_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "cost_types_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "terms_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "vehicles_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "vehicle_types_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "trucking_types_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "shipment_statuses_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "vendors_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "vendor_tax_profiles_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "companies_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "offices_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "branches_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "departments_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "agents_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
ALTER SEQUENCE "marketing_people_id_seq" AS INTEGER NO MINVALUE NO MAXVALUE;
COMMIT;
