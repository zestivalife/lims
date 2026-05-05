import { api } from './api';

export const demoCatalogTests = [
  { code: 'CBC', name: 'Complete Blood Count', category: 'HAEMATOLOGY', unit: 'g/dL', referenceRange: '13-17', turnaroundHours: 4, price: 350 },
  { code: 'HGB', name: 'Hemoglobin', category: 'HAEMATOLOGY', unit: 'g/dL', referenceRange: '13-17', turnaroundHours: 4, price: 180 },
  { code: 'PLT', name: 'Platelet Count', category: 'HAEMATOLOGY', unit: '10^3/uL', referenceRange: '150-450', turnaroundHours: 4, price: 220 },
  { code: 'LFT', name: 'Liver Function Test (LFT)', category: 'BIOCHEMISTRY', unit: 'U/L', referenceRange: '7-56', turnaroundHours: 8, price: 750 },
  { code: 'KFT', name: 'Kidney Function Test (KFT)', category: 'BIOCHEMISTRY', unit: 'mg/dL', referenceRange: '0.6-1.3', turnaroundHours: 8, price: 650 },
  { code: 'GLU', name: 'Glucose Fasting', category: 'BIOCHEMISTRY', unit: 'mg/dL', referenceRange: '70-110', turnaroundHours: 3, price: 250 },
  { code: 'HBA1C', name: 'HbA1c', category: 'BIOCHEMISTRY', unit: '%', referenceRange: '4-5.6', turnaroundHours: 8, price: 550 },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'ENDOCRINOLOGY', unit: 'uIU/mL', referenceRange: '0.4-4.0', turnaroundHours: 10, price: 450 },
  { code: 'T3', name: 'Triiodothyronine (T3)', category: 'ENDOCRINOLOGY', unit: 'ng/dL', referenceRange: '80-200', turnaroundHours: 10, price: 400 },
  { code: 'T4', name: 'Thyroxine (T4)', category: 'ENDOCRINOLOGY', unit: 'ug/dL', referenceRange: '5-12', turnaroundHours: 10, price: 400 },
  { code: 'URIN', name: 'Urine Routine', category: 'CLINICAL PATHOLOGY', unit: 'cells/HPF', referenceRange: '0-5', turnaroundHours: 6, price: 300 },
  { code: 'CRP', name: 'C-Reactive Protein', category: 'SEROLOGY', unit: 'mg/L', referenceRange: '0-5', turnaroundHours: 8, price: 600 },
  { code: 'DENG', name: 'Dengue NS1', category: 'SEROLOGY', unit: 'Index', referenceRange: '0-1', turnaroundHours: 12, price: 1100 },
  { code: 'PKG_FBC', name: 'Full Body Checkup Package', category: 'PACKAGES', unit: 'Panel', referenceRange: '-', turnaroundHours: 24, price: 1999 },
  { code: 'PKG_DIA', name: 'Diabetes Care Package', category: 'PACKAGES', unit: 'Panel', referenceRange: '-', turnaroundHours: 24, price: 1299 }
];

export async function bootstrapCatalogIfEmpty() {
  const list = await api.get('/api/tests/catalog?page=1&pageSize=30');
  const rows = list.data || [];
  if (rows.length > 0) return rows;

  for (const t of demoCatalogTests) {
    try {
      await api.post('/api/tests/catalog', t);
    } catch {
      // Ignore duplicate conflicts or partial creation errors.
    }
  }
  const refreshed = await api.get('/api/tests/catalog?page=1&pageSize=1000');
  return refreshed.data || [];
}
