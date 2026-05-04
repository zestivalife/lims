'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function TestsPage() {
  const [catalog, setCatalog] = useState([]);
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [priority, setPriority] = useState('ROUTINE');
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [testsData, patientsData] = await Promise.all([
          api.get('/api/tests/catalog?page=1&pageSize=100'),
          api.get('/api/patients?page=1&pageSize=100')
        ]);
        setCatalog(testsData.data || []);
        setPatients(patientsData.data || []);
      } catch (e) {
        toast.error(e.message || 'Failed to load tests and patients');
      }
    }
    load();
  }, [toast]);

  const filtered = useMemo(() => {
    if (!query.trim()) return catalog;
    const q = query.toLowerCase();
    return catalog.filter((row) => row.name.toLowerCase().includes(q) || row.code.toLowerCase().includes(q) || row.category.toLowerCase().includes(q));
  }, [catalog, query]);

  const selectedTests = useMemo(() => catalog.filter((row) => selected.includes(row.id)), [catalog, selected]);
  const subtotal = useMemo(() => selectedTests.reduce((sum, row) => sum + Number(row.price), 0), [selectedTests]);

  async function createOrder() {
    try {
      if (!patientId || selected.length === 0) {
        toast.warning('Select a patient and at least one test.');
        return;
      }
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const data = await api.post('/api/tests/orders', {
        patientId,
        testCatalogIds: selected,
        orderedBy: user?.id,
        priority
      });
      toast.success(`Order created: ${data.orderId}`);
      setSelected([]);
    } catch (e) {
      toast.error(e.message || 'Failed to create order');
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Tests & Orders</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Filter Catalog">
            <div className="filter-grid">
              <MsInput label="Search Tests" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div>
                <label className="ms-label">Patient</label>
                <select className="ms-select" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.mrn} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ms-label">Priority</label>
                <select className="ms-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>
              <MsButton onClick={createOrder}>Create Order</MsButton>
            </div>
          </MsCard>
        </div>

        <div className="span-8">
          <MsCard title="Test Catalog">
            <MsTable
              columns={[
                { key: 'pick', label: 'Pick', render: (row) => <input type="checkbox" checked={selected.includes(row.id)} onChange={() => setSelected((prev) => (prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]))} /> },
                { key: 'code', label: 'Code' },
                { key: 'name', label: 'Name' },
                { key: 'category', label: 'Category' },
                { key: 'unit', label: 'Unit' },
                { key: 'turnaroundHours', label: 'TAT (Hr)' },
                { key: 'price', label: 'Price', render: (row) => `₹${Number(row.price).toFixed(2)}` }
              ]}
              rows={filtered}
              paginationLabel={`Rows: ${filtered.length}`}
            />
          </MsCard>
        </div>

        <div className="span-4">
          <MsCard title="Billing Summary">
            <div style={{ display: 'grid', gap: 10 }}>
              <div>Selected Tests: {selectedTests.length}</div>
              {selectedTests.map((t) => (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  <span>{t.code}</span>
                  <strong>₹{Number(t.price).toFixed(2)}</strong>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, fontSize: 18, fontWeight: 600 }}>
                Total: ₹{subtotal.toFixed(2)}
              </div>
              <MsButton variant="secondary" onClick={() => (window.location.href = '/tests/results/enter')}>
                Go to Result Entry
              </MsButton>
            </div>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
