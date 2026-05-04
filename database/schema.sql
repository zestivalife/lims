-- LIMS PostgreSQL schema bootstrap (Prisma-compatible baseline)
-- Source of truth remains backend/prisma/schema.prisma

CREATE TYPE "PlanType" AS ENUM ('STARTER','GROWTH','ENTERPRISE');
CREATE TYPE "UserRole" AS ENUM ('ADMIN','TECHNICIAN','PATHOLOGIST','RECEPTION','PATIENT');
CREATE TYPE "ComplianceType" AS ENUM ('HIPAA','GDPR','NABL','ISO17025','NHS_GDPR','DHA_MOH');
CREATE TYPE "UnitsSystem" AS ENUM ('METRIC','IMPERIAL');
CREATE TYPE "TaxType" AS ENUM ('GST','VAT','NONE');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE "Priority" AS ENUM ('ROUTINE','URGENT','STAT');
CREATE TYPE "ResultStatus" AS ENUM ('NORMAL','ABNORMAL','CRITICAL');
CREATE TYPE "DeliveryMethod" AS ENUM ('EMAIL','SMS','WHATSAPP','PORTAL','PRINT');
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID','PENDING','CANCELLED');
CREATE TYPE "AnalyzerProtocol" AS ENUM ('HL7','ASTM','VENDOR');

CREATE TABLE "Region" (
  id TEXT PRIMARY KEY,
  country_code TEXT UNIQUE NOT NULL,
  country_name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  currency TEXT NOT NULL,
  units_system "UnitsSystem" NOT NULL,
  compliance_type "ComplianceType" NOT NULL,
  data_residency_zone TEXT NOT NULL,
  tax_type "TaxType" NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL,
  storage_bucket_region TEXT NOT NULL,
  report_footer TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Tenant" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan "PlanType" NOT NULL DEFAULT 'STARTER',
  region_id TEXT NOT NULL REFERENCES "Region"(id),
  onboarding_step INT NOT NULL DEFAULT 1,
  branch_name TEXT,
  branch_address TEXT,
  compliance_override JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role "UserRole" NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_login TIMESTAMP,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE "Patient" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  mrn TEXT NOT NULL,
  name_encrypted TEXT NOT NULL,
  dob_encrypted TEXT NOT NULL,
  gender TEXT NOT NULL,
  phone_encrypted TEXT NOT NULL,
  email_encrypted TEXT,
  address_encrypted TEXT,
  insurance_id TEXT,
  created_by TEXT NOT NULL REFERENCES "User"(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, mrn)
);

CREATE TABLE "TestCatalog" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  normal_range_male TEXT NOT NULL,
  normal_range_female TEXT NOT NULL,
  unit TEXT NOT NULL,
  method TEXT NOT NULL,
  turnaround_hours INT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE "TestOrder" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  patient_id TEXT NOT NULL REFERENCES "Patient"(id),
  ordered_by TEXT NOT NULL REFERENCES "User"(id),
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  priority "Priority" NOT NULL DEFAULT 'ROUTINE',
  sample_collected_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "TestResult" (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES "TestOrder"(id),
  test_catalog_id TEXT NOT NULL REFERENCES "TestCatalog"(id),
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  status "ResultStatus" NOT NULL,
  reference_range TEXT NOT NULL,
  machine_id TEXT,
  entered_by TEXT NOT NULL REFERENCES "User"(id),
  verified_by TEXT REFERENCES "User"(id),
  analyzer_raw_message TEXT,
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP
);

CREATE TABLE "Report" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  order_id TEXT UNIQUE NOT NULL REFERENCES "TestOrder"(id),
  pdf_url TEXT NOT NULL,
  digital_signature_hash TEXT,
  signed_by TEXT REFERENCES "User"(id),
  signed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  delivery_method "DeliveryMethod",
  is_amended BOOLEAN NOT NULL DEFAULT FALSE,
  amendment_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Analyzer" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  protocol "AnalyzerProtocol" NOT NULL,
  ip_address TEXT NOT NULL,
  port INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_connected_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "AnalyzerMapping" (
  id TEXT PRIMARY KEY,
  analyzer_id TEXT NOT NULL REFERENCES "Analyzer"(id),
  machine_param_name TEXT NOT NULL,
  test_catalog_id TEXT NOT NULL REFERENCES "TestCatalog"(id),
  transform_formula TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(analyzer_id, machine_param_name)
);

CREATE TABLE "AuditLog" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  user_id TEXT REFERENCES "User"(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "ConsentLog" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  user_id TEXT NOT NULL REFERENCES "User"(id),
  policy_type TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE TABLE "OtpLog" (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Invoice" (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id),
  order_id TEXT UNIQUE NOT NULL REFERENCES "TestOrder"(id),
  patient_id TEXT NOT NULL REFERENCES "Patient"(id),
  subtotal NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) NOT NULL,
  tax_type "TaxType" NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  status "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_region ON "Tenant"(region_id);
CREATE INDEX idx_user_tenant_role ON "User"(tenant_id, role);
CREATE INDEX idx_patient_tenant_created ON "Patient"(tenant_id, created_at);
CREATE INDEX idx_testorder_tenant_status ON "TestOrder"(tenant_id, status);
CREATE INDEX idx_testresult_order_status ON "TestResult"(order_id, status);
CREATE INDEX idx_audit_tenant_timestamp ON "AuditLog"(tenant_id, timestamp);
