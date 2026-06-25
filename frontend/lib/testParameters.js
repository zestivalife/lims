export const TEST_PARAMETER_LIBRARY = {
  CBC: [
    { name: 'Haemoglobin', unit: 'gm/dL', range: '13.0 - 17.0', method: 'Cyanmethemoglobin' },
    { name: 'Total WBC Count', unit: 'cells/cu.mm', range: '4000 - 10000', method: 'Impedance' },
    { name: 'RBC Count', unit: 'mil/cu.mm', range: '4.5 - 5.5', method: 'Impedance' },
    { name: 'Hematocrit HCT', unit: '%', range: '40 - 50', method: 'Calculated' },
    { name: 'Mean Corp Volume MCV', unit: 'fL', range: '83 - 101', method: 'Calculated' },
    { name: 'Mean Corp Hb MCH', unit: 'pg', range: '27 - 32', method: 'Calculated' },
    { name: 'Mean Corp Hb Conc MCHC', unit: 'gm/dL', range: '31.5 - 34.5', method: 'Calculated' },
    { name: 'RDW-CV', unit: '%', range: '11.6 - 14.0', method: 'Calculated' },
    { name: 'RDW-SD', unit: 'fL', range: '37.0 - 54.0', method: 'Calculated' },
    { name: 'Platelet Count', unit: 'lac/cmm', range: '1.5 - 4.5', method: 'Impedance' },
    { name: 'MPV', unit: 'fL', range: '9.0 - 13.0', method: 'Calculated' },
    { name: 'PDW-CV', unit: '%', range: '37.8 - 46.3', method: 'Calculated' },
    { name: 'PDW-SD', unit: 'fL', range: '9.9 - 17.0', method: 'Calculated' },
    { name: 'PCT', unit: '%', range: '0.17 - 0.35', method: 'Calculated' },
    { name: 'P-LCR', unit: '%', range: '13.0 - 43.0', method: 'Calculated' },
    { name: 'Neutrophils', unit: '%', range: '40 - 80', method: 'Microscopy' },
    { name: 'Lymphocytes', unit: '%', range: '20 - 40', method: 'Microscopy' },
    { name: 'Monocytes', unit: '%', range: '2 - 10', method: 'Microscopy' },
    { name: 'Eosinophils', unit: '%', range: '1 - 6', method: 'Microscopy' },
    { name: 'Basophils', unit: '%', range: '0 - 2', method: 'Microscopy' },
    { name: 'Absolute Neutrophils Count', unit: '/cumm', range: '2000 - 7000', method: 'Calculated' },
    { name: 'Absolute Lymphocyte Count', unit: '/cumm', range: '1000 - 3000', method: 'Calculated' },
    { name: 'Absolute Eosinophil Count', unit: '/cumm', range: '40 - 440', method: 'Calculated' },
    { name: 'Absolute Monocyte Count', unit: '/cumm', range: '200 - 1000', method: 'Calculated' },
    { name: 'Absolute Basophil Count', unit: '/cumm', range: '0 - 100', method: 'Calculated' },
    { name: 'ESR', unit: 'mm/hr', range: '0 - 20', method: 'Westergren' },
    { name: 'RBC Morphology', unit: '', range: 'Normocytic Normochromic', method: 'Peripheral Smear' },
    { name: 'WBC Morphology', unit: '', range: 'Normal', method: 'Peripheral Smear' },
    { name: 'Platelet Morphology', unit: '', range: 'Adequate', method: 'Peripheral Smear' },
    { name: 'Blast Cells', unit: '%', range: '0 - 0', method: 'Peripheral Smear' },
    { name: 'NRBC', unit: '/100 WBC', range: '0 - 0', method: 'Peripheral Smear' }
  ],
  LFT: [
    { name: 'Total Bilirubin', unit: 'mg/dL', range: '0.2 - 1.0', method: 'Jendrassik Grof' },
    { name: 'Direct Bilirubin', unit: 'mg/dL', range: '0.2 - 0.4', method: 'Diazotization' },
    { name: 'Indirect Bilirubin', unit: 'mg/dL', range: '0.2 - 0.4', method: 'Calculated' },
    { name: 'SGPT (ALT)', unit: 'U/L', range: '0 - 35', method: 'UV with P5P, IFCC 37 degree' },
    { name: 'SGOT (AST)', unit: 'U/L', range: '0 - 40', method: 'UV with P5P, IFCC 37 degree' },
    { name: 'Alkaline Phosphatase', unit: 'U/L', range: '30 - 120', method: 'DGKC' },
    { name: 'Total Proteins', unit: 'g/dL', range: '6.0 - 8.0', method: 'Biuret' },
    { name: 'Albumin Serum', unit: 'g/dL', range: '3.2 - 4.6', method: 'Bromocresol green' },
    { name: 'Globulin Serum', unit: 'g/dL', range: '1.8 - 3.6', method: 'Calculated' },
    { name: 'A/G Ratio', unit: 'Ratio', range: '1.2 - 2.2', method: 'Calculated' },
    { name: 'Gamma Glutamyl Transferase-Serum', unit: 'IU/L', range: '12 - 43', method: 'IFCC' },
    { name: 'LDH', unit: 'U/L', range: '140 - 280', method: 'Kinetic' },
    { name: 'Total Bile Acids', unit: 'umol/L', range: '0 - 10', method: 'Enzymatic' },
    { name: 'Serum Ammonia', unit: 'umol/L', range: '11 - 32', method: 'Enzymatic UV' }
  ],
  KFT: [
    { name: 'Urea', unit: 'mg/dL', range: '15 - 45', method: 'Urease' },
    { name: 'Creatinine', unit: 'mg/dL', range: '0.6 - 1.4', method: 'Jaffe' },
    { name: 'Uric Acid', unit: 'mg/dL', range: '3.5 - 7.2', method: 'Uricase' },
    { name: 'BUN', unit: 'mg/dL', range: '7 - 20', method: 'Calculated' },
    { name: 'Sodium', unit: 'mEq/L', range: '135 - 145', method: 'ISE' },
    { name: 'Potassium', unit: 'mEq/L', range: '3.5 - 5.1', method: 'ISE' },
    { name: 'Chloride', unit: 'mEq/L', range: '98 - 107', method: 'ISE' },
    { name: 'Calcium', unit: 'mg/dL', range: '8.5 - 10.5', method: 'Arsenazo III' },
    { name: 'Phosphorus', unit: 'mg/dL', range: '2.5 - 4.5', method: 'Molybdate UV' },
    { name: 'eGFR', unit: 'mL/min/1.73m2', range: '> 60', method: 'CKD-EPI' },
    { name: 'BUN/Creatinine Ratio', unit: 'Ratio', range: '10 - 20', method: 'Calculated' },
    { name: 'Magnesium', unit: 'mg/dL', range: '1.7 - 2.4', method: 'Xylidyl blue' },
    { name: 'Bicarbonate', unit: 'mEq/L', range: '22 - 29', method: 'Enzymatic' },
    { name: 'Microalbumin', unit: 'mg/L', range: '< 30', method: 'Immunoturbidimetry' }
  ],
  THYROID: [
    { name: 'Triiodothyronine (T3)', unit: 'ng/dL', range: '80 - 200', method: 'CLIA' },
    { name: 'Thyroxine (T4)', unit: 'ug/dL', range: '4.5 - 12.5', method: 'CLIA' },
    { name: 'TSH', unit: 'uIU/mL', range: '0.35 - 5.50', method: 'CLIA' },
    { name: 'Free T3', unit: 'pg/mL', range: '2.0 - 4.4', method: 'CLIA' },
    { name: 'Free T4', unit: 'ng/dL', range: '0.8 - 1.8', method: 'CLIA' },
    { name: 'Anti TPO', unit: 'IU/mL', range: '< 35', method: 'CLIA' },
    { name: 'Thyroglobulin', unit: 'ng/mL', range: '1.6 - 59.9', method: 'CLIA' }
  ],
  LIPID: [
    { name: 'Total Cholesterol', unit: 'mg/dL', range: '< 200', method: 'CHOD-PAP' },
    { name: 'Triglycerides', unit: 'mg/dL', range: '< 150', method: 'GPO-PAP' },
    { name: 'HDL Cholesterol', unit: 'mg/dL', range: '> 40', method: 'Direct' },
    { name: 'LDL Cholesterol', unit: 'mg/dL', range: '< 100', method: 'Calculated' },
    { name: 'VLDL Cholesterol', unit: 'mg/dL', range: '5 - 40', method: 'Calculated' },
    { name: 'Cholesterol/HDL Ratio', unit: 'Ratio', range: '< 5.0', method: 'Calculated' },
    { name: 'LDL/HDL Ratio', unit: 'Ratio', range: '< 3.5', method: 'Calculated' },
    { name: 'Non-HDL Cholesterol', unit: 'mg/dL', range: '< 130', method: 'Calculated' }
  ],
  URINE: [
    { name: 'Colour', unit: '', range: 'Pale Yellow', method: 'Visual' },
    { name: 'Appearance', unit: '', range: 'Clear', method: 'Visual' },
    { name: 'Specific Gravity', unit: '', range: '1.005 - 1.030', method: 'Strip' },
    { name: 'pH', unit: '', range: '4.5 - 8.0', method: 'Strip' },
    { name: 'Protein', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'Glucose', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'Ketone', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'Bile Salt', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'Bile Pigment', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'Urobilinogen', unit: '', range: 'Normal', method: 'Strip' },
    { name: 'Blood', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'Nitrite', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'Leucocytes', unit: '', range: 'Absent', method: 'Strip' },
    { name: 'RBC', unit: '/HPF', range: '0 - 2', method: 'Microscopy' },
    { name: 'WBC/Pus Cells', unit: '/HPF', range: '0 - 5', method: 'Microscopy' },
    { name: 'Epithelial Cells', unit: '/HPF', range: '0 - 5', method: 'Microscopy' },
    { name: 'Casts', unit: '/LPF', range: 'Absent', method: 'Microscopy' },
    { name: 'Crystals', unit: '', range: 'Absent', method: 'Microscopy' },
    { name: 'Bacteria', unit: '', range: 'Absent', method: 'Microscopy' },
    { name: 'Yeast Cells', unit: '', range: 'Absent', method: 'Microscopy' },
    { name: 'Mucus', unit: '', range: 'Absent', method: 'Microscopy' }
  ],
  GLUCOSE: [
    { name: 'Fasting Glucose', unit: 'mg/dL', range: '70 - 110', method: 'GOD-POD' },
    { name: 'Post Prandial Glucose', unit: 'mg/dL', range: '70 - 140', method: 'GOD-POD' },
    { name: 'Random Glucose', unit: 'mg/dL', range: '70 - 160', method: 'GOD-POD' },
    { name: 'HbA1c', unit: '%', range: '4.0 - 5.6', method: 'HPLC' },
    { name: 'Estimated Average Glucose', unit: 'mg/dL', range: '68 - 114', method: 'Calculated' },
    { name: 'Urine Sugar', unit: '', range: 'Absent', method: 'Strip' }
  ],
  COAG: [
    { name: 'Prothrombin Time', unit: 'sec', range: '11 - 16', method: 'Clot detection' },
    { name: 'INR', unit: 'Ratio', range: '0.8 - 1.2', method: 'Calculated' },
    { name: 'APTT', unit: 'sec', range: '25 - 35', method: 'Clot detection' },
    { name: 'Bleeding Time', unit: 'min', range: '2 - 7', method: 'Ivy' },
    { name: 'Clotting Time', unit: 'min', range: '5 - 11', method: 'Capillary tube' },
    { name: 'D-Dimer', unit: 'ng/mL', range: '< 500', method: 'Immunoturbidimetry' }
  ],
  SPECIAL: [
    { name: 'Serum Iron', unit: 'ug/dL', range: '60 - 170', method: 'Ferrozine' },
    { name: 'Ferritin', unit: 'ng/mL', range: '20 - 250', method: 'CLIA' },
    { name: 'TIBC', unit: 'ug/dL', range: '250 - 450', method: 'Calculated' },
    { name: 'Transferrin Saturation', unit: '%', range: '20 - 50', method: 'Calculated' },
    { name: 'Vitamin B12', unit: 'pg/mL', range: '200 - 900', method: 'CLIA' },
    { name: 'Vitamin D', unit: 'ng/mL', range: '30 - 100', method: 'CLIA' },
    { name: 'CRP', unit: 'mg/L', range: '0 - 5', method: 'Immunoturbidimetry' },
    { name: 'hs-CRP', unit: 'mg/L', range: '0 - 3', method: 'Immunoturbidimetry' },
    { name: 'Rheumatoid Factor', unit: 'IU/mL', range: '< 20', method: 'Latex enhanced' },
    { name: 'ASO Titre', unit: 'IU/mL', range: '< 200', method: 'Latex agglutination' },
    { name: 'Procalcitonin', unit: 'ng/mL', range: '< 0.5', method: 'CLIA' },
    { name: 'Troponin I', unit: 'ng/mL', range: '< 0.04', method: 'CLIA' }
  ]
};

const TEST_ALIASES = [
  { code: 'CBC', match: /complete blood count|cbc|haemogram|hemogram|blood count/i },
  { code: 'LFT', match: /liver|lft|hepatic/i },
  { code: 'KFT', match: /kidney|renal|rft|kft|creatinine|urea/i },
  { code: 'THYROID', match: /thyroid|tft|t3|t4|tsh/i },
  { code: 'LIPID', match: /lipid|cholesterol|triglyceride/i },
  { code: 'URINE', match: /urine|urinalysis|routine microscopic|r\/m/i },
  { code: 'GLUCOSE', match: /glucose|sugar|hba1c|diabetes/i },
  { code: 'COAG', match: /coag|pt|inr|aptt|d-dimer|bleeding|clotting/i },
  { code: 'SPECIAL', match: /iron|vitamin|crp|troponin|ferritin|aso|rheumatoid|procalcitonin/i }
];

export function resolveTestCode(testName = '') {
  const match = TEST_ALIASES.find((item) => item.match.test(testName));
  return match?.code || 'SPECIAL';
}

export function getParametersForTest(testName = '') {
  return TEST_PARAMETER_LIBRARY[resolveTestCode(testName)] || TEST_PARAMETER_LIBRARY.SPECIAL;
}

function numericValue(value) {
  if (value === null || value === undefined) return null;
  const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function isValueAbnormal(value, referenceRange = '') {
  const number = numericValue(value);
  if (number === null || !referenceRange) return false;
  const range = String(referenceRange).replace(/[–—]/g, '-').trim();
  const bounded = range.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
  if (bounded) {
    const low = Number(bounded[1]);
    const high = Number(bounded[2]);
    return number < low || number > high;
  }
  const upper = range.match(/^<\s*=?\s*(-?\d+(?:\.\d+)?)/);
  if (upper) return number > Number(upper[1]);
  const lower = range.match(/^>\s*=?\s*(-?\d+(?:\.\d+)?)/);
  if (lower) return number < Number(lower[1]);
  return false;
}
