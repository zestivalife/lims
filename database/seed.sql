-- Optional demo bootstrap for regions only.
-- App-level seeding for users/patients/tests should be done via: node seed.js

INSERT INTO "Region" (id, country_code, country_name, timezone, currency, units_system, compliance_type, data_residency_zone, tax_type, tax_rate, storage_bucket_region, report_footer)
VALUES
  ('region_india', 'IN', 'India', 'Asia/Kolkata', 'INR', 'METRIC', 'NABL', 'ap-south-1', 'GST', 18.00, 'ap-south-1', 'NABL Accredited Laboratory'),
  ('region_usa', 'US', 'United States', 'America/New_York', 'USD', 'METRIC', 'HIPAA', 'us-east-1', 'NONE', 0.00, 'us-east-1', 'HIPAA Compliant'),
  ('region_eu', 'EU', 'European Union', 'Europe/Berlin', 'EUR', 'METRIC', 'GDPR', 'eu-central-1', 'VAT', 20.00, 'eu-central-1', 'GDPR Compliant — Data processed in EU')
ON CONFLICT (country_code) DO NOTHING;
