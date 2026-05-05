'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

const empty = { code: '', name: '', category: '', unit: '', turnaroundHours: '24', price: '0', method: 'Auto', normalRangeMale: '0-0', normalRangeFemale: '0-0' };

export default function TestsMasterPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [sortKey, setSortKey] = useState('name');
  const [form, setForm] = useState(empty);

  async function load() {
    try {
      const data = await api.get('/api/tests/catalog?page=1&pageSize=300');
      setRows(data.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load tests');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTest(e) {
    e.preventDefault();
    try {
      await api.post('/api/onboarding/step7', { addCatalog: [form] });
      toast.success('Test added in demo catalog');
      setForm(empty);
      await load();
    } catch {
      toast.warning('Catalog add API unavailable in this build; showing current master list');
    }
  }

  const sorted = useMemo(() => {
    const data = [...rows];
    data.sort((a, b) => String(a[sortKey] || '').localeCompare(String(b[sortKey] || '')));
    return data;
  }, [rows, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Tests Master</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Create and maintain tests, parameters, and reference ranges.">
            <form className="ms-form-grid" onSubmit={addTest}>
              <div className="span-3"><MsInput label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Turnaround (hrs)" value={form.turnaroundHours} onChange={(e) => setForm({ ...form, turnaroundHours: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Male Ref Range" value={form.normalRangeMale} onChange={(e) => setForm({ ...form, normalRangeMale: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Female Ref Range" value={form.normalRangeFemale} onChange={(e) => setForm({ ...form, normalRangeFemale: e.target.value })} /></div>
              <div className="span-12"><div className="ms-actions"><MsButton type="submit">Add Test</MsButton></div></div>
            </form>
            <div style={{ marginTop: 16 }}>
              <MsTable
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'code', label: 'Code' },
                  { key: 'category', label: 'Category' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'turnaroundHours', label: 'TAT' },
                  { key: 'price', label: 'Price', render: (r) => Number(r.price).toFixed(2) },
                  { key: 'status', label: 'Status', render: (r) => <MsBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /> }
                ]}
                rows={sorted}
                onSort={setSortKey}
                sortKey={sortKey}
                paginationLabel={`Tests: ${sorted.length}`}
              />
            </div>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
