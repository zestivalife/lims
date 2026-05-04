export const REGION_CONFIG = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    unitsSystem: 'METRIC',
    complianceType: 'NABL',
    dataResidencyZone: 'ap-south-1',
    taxType: 'GST',
    taxRate: 18,
    storageBucketRegion: 'ap-south-1',
    reportFooter: 'NABL Accredited Laboratory',
    displayUnits: 'mg/dL'
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    unitsSystem: 'METRIC',
    complianceType: 'HIPAA',
    dataResidencyZone: 'us-east-1',
    taxType: 'NONE',
    taxRate: 0,
    storageBucketRegion: 'us-east-1',
    reportFooter: 'HIPAA Compliant',
    displayUnits: 'mg/dL'
  },
  EU: {
    countryCode: 'EU',
    countryName: 'European Union',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    unitsSystem: 'METRIC',
    complianceType: 'GDPR',
    dataResidencyZone: 'eu-central-1',
    taxType: 'VAT',
    taxRate: 20,
    storageBucketRegion: 'eu-central-1',
    reportFooter: 'GDPR Compliant — Data processed in EU',
    displayUnits: 'mmol/L'
  },
  UK: {
    countryCode: 'UK',
    countryName: 'United Kingdom',
    timezone: 'Europe/London',
    currency: 'GBP',
    unitsSystem: 'METRIC',
    complianceType: 'NHS_GDPR',
    dataResidencyZone: 'eu-west-2',
    taxType: 'VAT',
    taxRate: 20,
    storageBucketRegion: 'eu-west-2',
    reportFooter: 'GDPR + NHS Standards Compliant',
    displayUnits: 'mmol/L'
  },
  ME_AED: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    timezone: 'Asia/Dubai',
    currency: 'AED',
    unitsSystem: 'METRIC',
    complianceType: 'DHA_MOH',
    dataResidencyZone: 'me-south-1',
    taxType: 'VAT',
    taxRate: 5,
    storageBucketRegion: 'me-south-1',
    reportFooter: 'DHA / MOH Compliance',
    displayUnits: 'mg/dL'
  },
  ME_SAR: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    unitsSystem: 'METRIC',
    complianceType: 'DHA_MOH',
    dataResidencyZone: 'me-south-1',
    taxType: 'VAT',
    taxRate: 5,
    storageBucketRegion: 'me-south-1',
    reportFooter: 'DHA / MOH Compliance',
    displayUnits: 'mg/dL'
  }
};

export function getRegionConfig(code) {
  const cfg = REGION_CONFIG[code];
  if (!cfg) {
    throw new Error(`Unsupported country/region key: ${code}`);
  }
  return cfg;
}

export function listRegionConfigs() {
  return Object.entries(REGION_CONFIG).map(([key, value]) => ({ key, ...value }));
}
