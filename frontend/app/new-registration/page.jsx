'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { useToast } from '@/components/ui/ToastProvider';

const patientDefaults = {
  mrn: '',
  name: '',
  dob: '',
  gender: 'MALE',
  phone: '',
  email: '',
  address: '',
  insuranceId: '',
  referralDoctor: 'Self Referral'
};

export default function NewRegistrationPage() {
  const toast = useToast();
  const [catalog, setCatalog] = useState([]);
  const [patient, setPatient] = useState(patientDefaults);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [priority, setPriority] = useState('ROUTINE');
  const [sampleType, setSampleType] = useState('Blood');
  const [selectedIds, setSelectedIds] = useState([]);
  const [discountType, setDiscountType] = useState('%');
  const [discount, setDiscount] = useState('0');
  const [receivedAmount, setReceivedAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [delivery, setDelivery] = useState({ whatsapp: true, email: false, print: false });
  const [homeCollection, setHomeCollection] = useState(false);
  const [registering, setRegistering] = useState(false);

  async function loadCatalog() {
    try {
      const data = await api.get('/api/tests/catalog?page=1&pageSize=400');
      setCatalog(data.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load test catalog');
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  const departments = useMemo(() => ['ALL', ...new Set(catalog.map((x) => x.category).filter(Boolean))], [catalog]);

  const filteredTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((t) => {
      if (department !== 'ALL' && t.category !== department) return false;
      if (!q) return true;
      return [t.name, t.code, t.category].join(' ').toLowerCase().includes(q);
    });
  }, [catalog, search, department]);

  const selectedTests = useMemo(() => catalog.filter((x) => selectedIds.includes(x.id)), [catalog, selectedIds]);
  const subtotal = useMemo(() => selectedTests.reduce((sum, x) => sum + Number(x.price || 0), 0), [selectedTests]);
  const discountValue = useMemo(() => {
    const raw = Number(discount || 0);
    if (discountType === '%') return (subtotal * raw) / 100;
    return raw;
  }, [discount, discountType, subtotal]);
  const finalTotal = Math.max(subtotal - discountValue, 0);

  function resetAll() {
    setPatient(patientDefaults);
    setSelectedIds([]);
    setDiscount('0');
    setReceivedAmount('0');
    setPaymentMode('CASH');
    setPaymentStatus('PENDING');
    setDelivery({ whatsapp: true, email: false, print: false });
    setHomeCollection(false);
    setDepartment('ALL');
    setSearch('');
  }

  async function onRegister(e) {
    e.preventDefault();
    if (!patient.name || !patient.phone || !patient.dob || !patient.mrn) {
      toast.warning('Fill required patient details');
      return;
    }
    if (selectedIds.length === 0) {
      toast.warning('Select at least one test');
      return;
    }

    setRegistering(true);
    try {
      const user = getUser();
      const createdPatient = await api.post('/api/patients', {
        mrn: patient.mrn,
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        insuranceId: patient.insuranceId || patient.referralDoctor
      });

      const order = await api.post('/api/tests/orders', {
        patientId: createdPatient.id,
        testCatalogIds: selectedIds,
        orderedBy: user?.id,
        priority
      });

      const invoices = await api.get('/api/billing/invoices?page=1&pageSize=50');
      const invoice = (invoices.data || []).find((x) => x.orderId === order.orderId);
      if (invoice) {
        await api.post('/api/billing/payments', {
          invoiceId: invoice.id,
          mode: paymentMode,
          amount: Number(receivedAmount || 0),
          status: paymentStatus,
          txRef: '',
          receiptDelivery: Object.entries(delivery).filter(([, v]) => v).map(([k]) => k.toUpperCase())
        });
      }

      toast.success(`Registration complete: ${order.orderId}`);
      resetAll();
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">New Registration</h1>
      <form onSubmit={onRegister} className="grid-12">
        <div className="span-12">
          <MsCard title="Patient Registration">
            <div className="ms-form-grid">
              <div className="span-12"><h3 className="section-title">Patient Details</h3></div>
              <div className="span-3"><MsInput label="Date *" type="date" required value={new Date().toISOString().slice(0, 10)} readOnly /></div>
              <div className="span-3"><MsInput label="Center *" required value="Main Lab - India" readOnly /></div>
              <div className="span-3"><MsInput label="Corporate" value="Walk-in" readOnly /></div>
              <div className="span-3"><MsInput label="Mobile Number *" required value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: e.target.value })} /></div>

              <div className="span-3"><MsInput label="MRN *" required value={patient.mrn} onChange={(e) => setPatient({ ...patient, mrn: e.target.value })} /></div>
              <div className="span-3"><MsInput label="First Name *" required value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Last Name" value="" readOnly /></div>
              <div className="span-3"><MsInput label="Age" value={patient.dob ? String(new Date().getFullYear() - new Date(patient.dob).getFullYear()) : ''} readOnly /></div>

              <div className="span-3"><MsInput label="DOB *" type="date" required value={patient.dob} onChange={(e) => setPatient({ ...patient, dob: e.target.value })} /></div>
              <div className="span-3">
                <label className="ms-label">Gender *</label>
                <div className="radio-row">
                  <label><input type="radio" checked={patient.gender === 'MALE'} onChange={() => setPatient({ ...patient, gender: 'MALE' })} /> Male</label>
                  <label><input type="radio" checked={patient.gender === 'FEMALE'} onChange={() => setPatient({ ...patient, gender: 'FEMALE' })} /> Female</label>
                  <label><input type="radio" checked={patient.gender === 'OTHER'} onChange={() => setPatient({ ...patient, gender: 'OTHER' })} /> Other</label>
                </div>
              </div>
              <div className="span-3"><MsInput label="Email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Referral Doctor" value={patient.referralDoctor} onChange={(e) => setPatient({ ...patient, referralDoctor: e.target.value })} /></div>

              <div className="span-12"><MsInput label="Address" value={patient.address} onChange={(e) => setPatient({ ...patient, address: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Remarks" as="textarea" value={`Priority: ${priority} | Sample: ${sampleType}`} readOnly /></div>
              <div className="span-3">
                <label className="ms-label">Re-book Existing Patient</label>
                <select className="ms-select"><option>None</option></select>
              </div>
              <div className="span-3">
                <label className="ms-label">Home Collection</label>
                <label className="switch-row">
                  <input type="checkbox" checked={homeCollection} onChange={(e) => setHomeCollection(e.target.checked)} />
                  <span>{homeCollection ? 'Yes' : 'No'}</span>
                </label>
              </div>
            </div>
          </MsCard>
        </div>

        <div className="span-8">
          <MsCard title="Test Selection">
            <div className="ms-form-grid">
              <div className="span-12"><MsInput label="Search Tests" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <div className="span-6">
                <label className="ms-label">Department</label>
                <select className="ms-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {departments.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="span-6">
                <label className="ms-label">Test Type</label>
                <select className="ms-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>
              <div className="span-6">
                <label className="ms-label">Package</label>
                <select className="ms-select"><option>None</option></select>
              </div>
              <div className="span-6">
                <label className="ms-label">Sample Type</label>
                <select className="ms-select" value={sampleType} onChange={(e) => setSampleType(e.target.value)}>
                  <option>Blood</option>
                  <option>Urine</option>
                  <option>Serum</option>
                </select>
              </div>
              <div className="span-12 check-grid">
                {filteredTests.slice(0, 10).map((t) => (
                  <label key={t.id}><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => setSelectedIds((prev) => (prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]))} /> {t.code} ({Number(t.price).toFixed(0)})</label>
                ))}
              </div>
            </div>
          </MsCard>
        </div>

        <div className="span-4">
          <MsCard title="Billing">
            <div className="ms-form-grid">
              <div className="span-12">
                <label className="ms-label">Discount Type</label>
                <select className="ms-select" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                  <option>%</option>
                  <option>AMOUNT</option>
                </select>
              </div>
              <div className="span-6"><MsInput label="Discount" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
              <div className="span-6"><MsInput label="Received Amount" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} /></div>
              <div className="span-12">
                <label className="ms-label">Payment Mode</label>
                <select className="ms-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option>CASH</option>
                  <option>UPI</option>
                  <option>CARD</option>
                  <option>NET_BANKING</option>
                </select>
              </div>
              <div className="span-12">
                <label className="ms-label">Payment Status</label>
                <div className="radio-row">
                  <label><input type="radio" checked={paymentStatus === 'PAID'} onChange={() => setPaymentStatus('PAID')} /> Paid</label>
                  <label><input type="radio" checked={paymentStatus === 'PENDING'} onChange={() => setPaymentStatus('PENDING')} /> Unpaid</label>
                </div>
              </div>
              <div className="span-12">
                <label className="ms-label">Report Delivery</label>
                <div className="check-row">
                  <label><input type="checkbox" checked={delivery.whatsapp} onChange={(e) => setDelivery({ ...delivery, whatsapp: e.target.checked })} /> WhatsApp</label>
                  <label><input type="checkbox" checked={delivery.email} onChange={(e) => setDelivery({ ...delivery, email: e.target.checked })} /> Email</label>
                  <label><input type="checkbox" checked={delivery.print} onChange={(e) => setDelivery({ ...delivery, print: e.target.checked })} /> Print</label>
                </div>
              </div>
              <div className="span-12 summary-box">
                <div>Subtotal: {subtotal.toFixed(2)}</div>
                <div>Discount: {discountValue.toFixed(2)}</div>
                <div>Final Total: {finalTotal.toFixed(2)}</div>
              </div>
              <div className="span-12">
                <div className="ms-actions">
                  <MsButton type="submit" disabled={registering}>{registering ? 'Registering...' : 'Register'}</MsButton>
                  <MsButton type="button" variant="secondary" onClick={resetAll}>Cancel</MsButton>
                </div>
              </div>
            </div>
          </MsCard>
        </div>
      </form>
    </PageWrapper>
  );
}
