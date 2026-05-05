'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { useToast } from '@/components/ui/ToastProvider';

const PATIENT_TITLES = ['Mr', 'Mrs', 'Ms'];
const VISIT_TYPES = ['Walk-in', 'Referral'];
const COLLECTION_METHODS = ['By Hand', 'Home Collection'];
const SAMPLE_TYPES = ['Blood', 'Serum', 'Plasma', 'Urine', 'Stool', 'Swab'];
const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'CREDIT'];

const emptyPatientForm = {
  dateTime: '',
  labName: 'Main Lab - India',
  visitType: 'Walk-in',
  mobile: '',
  title: 'Mr',
  firstName: '',
  lastName: '',
  email: '',
  ageYears: '',
  ageMonths: '',
  ageDays: '',
  gender: 'MALE',
  referralDoctor: 'Self Referral',
  address: '',
  remark: '',
  collectionMethod: 'By Hand'
};

function formatDateTimeLocal(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function toDobFromAge(years, months, days) {
  const y = Number(years || 0);
  const m = Number(months || 0);
  const d = Number(days || 0);
  const now = new Date();
  const dob = new Date(now.getFullYear() - y, now.getMonth() - m, now.getDate() - d);
  return dob.toISOString().slice(0, 10);
}

export default function NewRegistrationPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientForm, setPatientForm] = useState({
    ...emptyPatientForm,
    dateTime: formatDateTimeLocal()
  });

  const [existingPatientId, setExistingPatientId] = useState('');
  const [doctorInput, setDoctorInput] = useState('Self Referral');

  const [tab, setTab] = useState('department');
  const [department, setDepartment] = useState('ALL');
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestMap, setSelectedTestMap] = useState({});
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);

  const [discountPercent, setDiscountPercent] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [txnRef, setTxnRef] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [navigateToResult, setNavigateToResult] = useState(false);
  const [sampleCollectedMap, setSampleCollectedMap] = useState({});

  const [submitting, setSubmitting] = useState(false);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [catalogRes, patientRes] = await Promise.all([
        api.get('/api/tests/catalog?page=1&pageSize=1000'),
        api.get('/api/patients?page=1&pageSize=500')
      ]);
      setCatalog(catalogRes.data || []);
      setPatients(patientRes.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load registration data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  const departmentList = useMemo(() => {
    const all = new Set(catalog.map((item) => item.category).filter(Boolean));
    return ['ALL', ...Array.from(all).sort((a, b) => a.localeCompare(b))];
  }, [catalog]);

  const packageList = useMemo(() => {
    const packageTests = catalog.filter((item) => /package|profile|panel/i.test(item.name));
    return packageTests.map((item) => ({ id: item.id, name: item.name, price: Number(item.price || 0) }));
  }, [catalog]);

  const testsInDepartment = useMemo(() => {
    let rows = [...catalog];
    if (department !== 'ALL') rows = rows.filter((item) => item.category === department);
    if (testSearch.trim()) {
      const q = testSearch.trim().toLowerCase();
      rows = rows.filter((item) => [item.code, item.name, item.category, item.unit].join(' ').toLowerCase().includes(q));
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, department, testSearch]);

  const selectedTests = useMemo(() => Object.values(selectedTestMap), [selectedTestMap]);

  const subtotal = useMemo(
    () => selectedTests.reduce((sum, row) => sum + Number(row.charge || 0), 0),
    [selectedTests]
  );

  const discountAmount = useMemo(() => {
    const d = Number(discountPercent || 0);
    if (Number.isNaN(d) || d < 0) return 0;
    const value = (subtotal * d) / 100;
    return Math.min(value, subtotal);
  }, [discountPercent, subtotal]);

  const finalPayable = useMemo(() => Math.max(subtotal - discountAmount, 0), [subtotal, discountAmount]);

  const balance = useMemo(() => {
    const paid = Number(paymentAmount || 0);
    if (Number.isNaN(paid) || paid < 0) return finalPayable;
    return Math.max(finalPayable - paid, 0);
  }, [paymentAmount, finalPayable]);

  const paymentStatus = useMemo(() => (balance <= 0 ? 'PAID' : 'PENDING'), [balance]);

  function addTest(test) {
    setSelectedTestMap((prev) => {
      if (prev[test.id]) return prev;
      return {
        ...prev,
        [test.id]: {
          id: test.id,
          code: test.code,
          name: test.name,
          category: test.category,
          sampleType: test.method || 'Sample',
          charge: Number(test.price || 0)
        }
      };
    });
  }

  function removeTest(testId) {
    setSelectedTestMap((prev) => {
      const copy = { ...prev };
      delete copy[testId];
      return copy;
    });
    setSampleCollectedMap((prev) => {
      const copy = { ...prev };
      delete copy[testId];
      return copy;
    });
  }

  function updateCharge(testId, value) {
    setSelectedTestMap((prev) => {
      const row = prev[testId];
      if (!row) return prev;
      return {
        ...prev,
        [testId]: {
          ...row,
          charge: value === '' ? '' : Number(value)
        }
      };
    });
  }

  function togglePackage(packageId) {
    const isSelected = selectedPackageIds.includes(packageId);
    const packageTest = catalog.find((x) => x.id === packageId);
    if (!packageTest) return;

    const category = packageTest.category;
    const testsInCategory = catalog.filter((x) => x.category === category);

    if (isSelected) {
      setSelectedPackageIds((prev) => prev.filter((id) => id !== packageId));
      setSelectedTestMap((prev) => {
        const copy = { ...prev };
        for (const row of testsInCategory) {
          delete copy[row.id];
        }
        return copy;
      });
      return;
    }

    setSelectedPackageIds((prev) => [...prev, packageId]);
    setSelectedTestMap((prev) => {
      const next = { ...prev };
      for (const row of testsInCategory) {
        if (!next[row.id]) {
          next[row.id] = {
            id: row.id,
            code: row.code,
            name: row.name,
            category: row.category,
            sampleType: row.method || 'Sample',
            charge: Number(row.price || 0)
          };
        }
      }
      return next;
    });
  }

  function findExistingPatientByMobile(mobile) {
    return patients.find((p) => String(p.phone || '').trim() === String(mobile || '').trim());
  }

  function onMobileBlur() {
    if (!patientForm.mobile.trim()) return;
    const existing = findExistingPatientByMobile(patientForm.mobile);
    if (!existing) {
      setExistingPatientId('');
      return;
    }

    const names = String(existing.name || '').split(' ');
    const first = names[0] || '';
    const last = names.slice(1).join(' ');
    setExistingPatientId(existing.id);
    setPatientForm((prev) => ({
      ...prev,
      firstName: first,
      lastName: last,
      email: existing.email || '',
      address: existing.address || '',
      gender: existing.gender || prev.gender
    }));
    toast.info('Existing patient loaded from mobile number');
  }

  function resetRegistration() {
    setPatientForm({ ...emptyPatientForm, dateTime: formatDateTimeLocal() });
    setExistingPatientId('');
    setDoctorInput('Self Referral');
    setDepartment('ALL');
    setTestSearch('');
    setSelectedTestMap({});
    setSelectedPackageIds([]);
    setDiscountPercent('0');
    setPaymentMethod('CASH');
    setPaymentAmount('0');
    setTxnRef('');
    setPrintReceipt(true);
    setNavigateToResult(false);
    setSampleCollectedMap({});
  }

  function validateForm() {
    if (!patientForm.mobile.trim()) return 'Mobile number is required';
    if (!patientForm.firstName.trim()) return 'First name is required';
    if (selectedTests.length < 1) return 'At least one test must be selected';

    const years = Number(patientForm.ageYears || 0);
    const months = Number(patientForm.ageMonths || 0);
    const days = Number(patientForm.ageDays || 0);
    if (years < 0 || months < 0 || days < 0) return 'Age values cannot be negative';
    if (months > 11) return 'Months must be 0-11';
    if (days > 31) return 'Days must be 0-31';

    const discountNum = Number(discountPercent || 0);
    if (Number.isNaN(discountNum) || discountNum < 0) return 'Discount must be valid';
    if (discountNum > 100) return 'Discount percent cannot exceed 100';

    const paid = Number(paymentAmount || 0);
    if (Number.isNaN(paid) || paid < 0) return 'Payment amount must be valid';
    if (paid > finalPayable && paymentMethod !== 'CASH') return 'Overpayment allowed only in cash mode';

    return '';
  }

  async function onRegister(e) {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      toast.warning(err);
      return;
    }

    setSubmitting(true);
    try {
      const user = getUser();
      const fullName = [patientForm.firstName, patientForm.lastName].filter(Boolean).join(' ').trim();
      const dob = toDobFromAge(patientForm.ageYears, patientForm.ageMonths, patientForm.ageDays);

      let patientId = existingPatientId;
      if (!patientId) {
        const mrn = `P${Date.now()}`;
        const created = await api.post('/api/patients', {
          mrn,
          name: `${patientForm.title} ${fullName}`.trim(),
          dob,
          gender: patientForm.gender,
          phone: patientForm.mobile.trim(),
          email: patientForm.email.trim() || null,
          address: patientForm.address.trim() || null,
          insuranceId: doctorInput.trim() || null
        });
        patientId = created.id;
      }

      const uniqueTestIds = [...new Set(selectedTests.map((t) => t.id))];
      const orderRes = await api.post('/api/tests/orders', {
        patientId,
        testCatalogIds: uniqueTestIds,
        orderedBy: user?.id,
        priority: patientForm.visitType === 'Referral' ? 'URGENT' : 'ROUTINE'
      });

      const invoicesRes = await api.get('/api/billing/invoices?page=1&pageSize=200');
      const invoice = (invoicesRes.data || []).find((row) => row.orderId === orderRes.orderId);

      if (!invoice) {
        throw new Error('Invoice not generated for order');
      }

      if (Number(paymentAmount || 0) > 0) {
        await api.post('/api/billing/payments', {
          invoiceId: invoice.id,
          amount: Number(paymentAmount || 0),
          mode: paymentMethod,
          status: paymentStatus,
          txRef: txnRef.trim() || null,
          receiptDelivery: [
            ...(printReceipt ? ['PRINT'] : []),
            ...(navigateToResult ? ['RESULT_PAGE'] : [])
          ]
        });
      }

      if (selectedTests.some((t) => sampleCollectedMap[t.id])) {
        await api.put(`/api/tests/orders/${orderRes.orderId}/status`, {
          status: 'IN_PROGRESS',
          sampleCollectedAt: new Date().toISOString()
        });
      }

      toast.success(`Registered successfully: ${orderRes.orderId}`);
      await loadInitialData();
      resetRegistration();
      if (navigateToResult) {
        window.location.href = `/tests/results/enter?orderId=${orderRes.orderId}`;
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">New Registration</h1>

      <form onSubmit={onRegister} className="grid-12 compact-grid compact-page">
        <div className="span-12">
          <MsCard title="Patient Details">
            <div className="ms-form-grid">
              <div className="span-3">
                <MsInput label="Date / Time" value={patientForm.dateTime} readOnly />
              </div>
              <div className="span-3">
                <label className="ms-label">Lab Name</label>
                <select
                  className="ms-select"
                  value={patientForm.labName}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, labName: e.target.value }))}
                >
                  <option>Main Lab - India</option>
                  <option>Satellite Lab - Pune</option>
                </select>
              </div>
              <div className="span-3">
                <label className="ms-label">Visit Type</label>
                <select
                  className="ms-select"
                  value={patientForm.visitType}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, visitType: e.target.value }))}
                >
                  {VISIT_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-3">
                <MsInput
                  label="Mobile Number *"
                  value={patientForm.mobile}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                  onBlur={onMobileBlur}
                />
              </div>

              <div className="span-2">
                <label className="ms-label">Title</label>
                <select
                  className="ms-select"
                  value={patientForm.title}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, title: e.target.value }))}
                >
                  {PATIENT_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-3">
                <MsInput
                  label="First Name *"
                  value={patientForm.firstName}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="span-3">
                <MsInput
                  label="Last Name"
                  value={patientForm.lastName}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <div className="span-4">
                <MsInput
                  label="Email"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="span-2">
                <MsInput
                  label="Age (Y)"
                  value={patientForm.ageYears}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, ageYears: e.target.value.replace(/[^0-9]/g, '').slice(0, 3) }))}
                />
              </div>
              <div className="span-2">
                <MsInput
                  label="Age (M)"
                  value={patientForm.ageMonths}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, ageMonths: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) }))}
                />
              </div>
              <div className="span-2">
                <MsInput
                  label="Age (D)"
                  value={patientForm.ageDays}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, ageDays: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) }))}
                />
              </div>
              <div className="span-6">
                <label className="ms-label">Gender</label>
                <div className="radio-row">
                  <label><input type="radio" checked={patientForm.gender === 'MALE'} onChange={() => setPatientForm((prev) => ({ ...prev, gender: 'MALE' }))} /> Male</label>
                  <label><input type="radio" checked={patientForm.gender === 'FEMALE'} onChange={() => setPatientForm((prev) => ({ ...prev, gender: 'FEMALE' }))} /> Female</label>
                  <label><input type="radio" checked={patientForm.gender === 'OTHER'} onChange={() => setPatientForm((prev) => ({ ...prev, gender: 'OTHER' }))} /> Other</label>
                </div>
              </div>

              <div className="span-5">
                <MsInput
                  label="Referral Doctor"
                  value={doctorInput}
                  onChange={(e) => setDoctorInput(e.target.value)}
                />
              </div>
              <div className="span-1 ms-align-end">
                <MsButton type="button" variant="secondary" onClick={() => toast.info('Doctor add shortcut triggered')}>
                  +
                </MsButton>
              </div>
              <div className="span-3">
                <label className="ms-label">Collection Method</label>
                <select
                  className="ms-select"
                  value={patientForm.collectionMethod}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, collectionMethod: e.target.value }))}
                >
                  {COLLECTION_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-3" />

              <div className="span-12">
                <MsInput
                  label="Address"
                  value={patientForm.address}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="span-12">
                <MsInput
                  label="Remark"
                  as="textarea"
                  value={patientForm.remark}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, remark: e.target.value }))}
                />
              </div>
            </div>
          </MsCard>
        </div>

        <div className="span-7">
          <MsCard title="Test & Package Selection" bodyClassName="compact-card-body">
            <div className="ms-form-grid">
              <div className="span-12">
                <div className="tabs-row">
                  <button type="button" className={`tab-btn ${tab === 'department' ? 'active' : ''}`} onClick={() => setTab('department')}>
                    Department
                  </button>
                  <button type="button" className={`tab-btn ${tab === 'packages' ? 'active' : ''}`} onClick={() => setTab('packages')}>
                    Packages
                  </button>
                </div>
              </div>

              {tab === 'department' && (
                <>
                  <div className="span-5">
                    <label className="ms-label">Department</label>
                    <select className="ms-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                      {departmentList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="span-4">
                    <MsInput label="Search Test" value={testSearch} onChange={(e) => setTestSearch(e.target.value)} />
                  </div>
                  <div className="span-3">
                    <label className="ms-label">Sample Type</label>
                    <select className="ms-select">
                      {SAMPLE_TYPES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="span-12 check-grid">
                    {testsInDepartment.slice(0, 250).map((t) => (
                      <label key={t.id} className="check-item">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedTestMap[t.id])}
                          onChange={(e) => {
                            if (e.target.checked) addTest(t);
                            else removeTest(t.id);
                          }}
                        />
                        <span>{t.name}</span>
                        <small>{t.method || 'Sample'} | {Number(t.price || 0).toFixed(2)}</small>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {tab === 'packages' && (
                <div className="span-12 check-grid">
                  {packageList.map((pkg) => (
                    <label key={pkg.id} className="check-item">
                      <input
                        type="checkbox"
                        checked={selectedPackageIds.includes(pkg.id)}
                        onChange={() => togglePackage(pkg.id)}
                      />
                      <span>{pkg.name}</span>
                      <small>{pkg.price.toFixed(2)}</small>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </MsCard>
        </div>

        <div className="span-5">
          <MsCard title="Billing & Payment" bodyClassName="compact-card-body">
            <div className="ms-form-grid">
              <div className="span-12 ms-table-wrap">
                <table className="ms-table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Charge</th>
                      <th>Sample</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTests.length === 0 ? (
                      <tr><td colSpan={4}>No tests selected</td></tr>
                    ) : (
                      selectedTests.map((row) => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td>
                            <input
                              className="ms-input"
                              value={row.charge}
                              onChange={(e) => updateCharge(row.id, e.target.value.replace(/[^0-9.]/g, ''))}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={Boolean(sampleCollectedMap[row.id])}
                              onChange={(e) => setSampleCollectedMap((prev) => ({ ...prev, [row.id]: e.target.checked }))}
                            />
                          </td>
                          <td>
                            <button type="button" className="icon-btn" title="Delete test" onClick={() => removeTest(row.id)}>🗑</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="span-4"><MsInput label="Total" value={subtotal.toFixed(2)} readOnly /></div>
              <div className="span-4"><MsInput label="Discount (%)" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value.replace(/[^0-9.]/g, ''))} /></div>
              <div className="span-4"><MsInput label="Discount Amount" value={discountAmount.toFixed(2)} readOnly /></div>

              <div className="span-4"><MsInput label="Final Payable" value={finalPayable.toFixed(2)} readOnly /></div>
              <div className="span-4">
                <label className="ms-label">Payment Method</label>
                <select className="ms-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="span-4"><MsInput label="Payment Amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ''))} /></div>

              <div className="span-6"><MsInput label="Txn Ref" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} /></div>
              <div className="span-3"><MsInput label="Balance" value={balance.toFixed(2)} readOnly /></div>
              <div className="span-3"><MsInput label="Status" value={paymentStatus} readOnly /></div>

              <div className="span-6">
                <label className="check-item-inline"><input type="checkbox" checked={printReceipt} onChange={(e) => setPrintReceipt(e.target.checked)} /> Print Receipt</label>
              </div>
              <div className="span-6">
                <label className="check-item-inline"><input type="checkbox" checked={navigateToResult} onChange={(e) => setNavigateToResult(e.target.checked)} /> Navigate to Result Page</label>
              </div>

              <div className="span-12">
                <div className="ms-actions">
                  <MsButton type="submit" disabled={submitting || loading}>{submitting ? 'Registering...' : 'Register'}</MsButton>
                  <MsButton type="button" variant="secondary" onClick={resetRegistration}>Reset</MsButton>
                </div>
              </div>
            </div>
          </MsCard>
        </div>
      </form>
    </PageWrapper>
  );
}
