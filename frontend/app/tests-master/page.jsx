'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { bootstrapCatalogIfEmpty } from '@/lib/demoCatalog';

const emptyForm = {
  code: '',
  name: '',
  category: '',
  unit: '',
  referenceRange: '',
  turnaroundHours: '24',
  price: ''
};

export default function TestsMasterPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      if (query.trim()) {
        const data = await api.get(`/api/tests/catalog?page=1&pageSize=300&q=${encodeURIComponent(query)}`);
        setRows(data.data || []);
      } else {
        const seeded = await bootstrapCatalogIfEmpty();
        setRows(seeded);
      }
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
      await api.post('/api/tests/catalog', {
        code: form.code,
        name: form.name,
        category: form.category,
        unit: form.unit,
        referenceRange: form.referenceRange,
        turnaroundHours: Number(form.turnaroundHours || 24),
        price: Number(form.price || 0)
      });
      toast.success('Test created');
      setForm(emptyForm);
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Unable to create test');
    }
  }

  const data = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
    return list;
  }, [rows, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Tests Master</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Create Test">
            <form onSubmit={addTest} className="ms-form-grid">
              <div className="span-3"><MsInput label="Code *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="span-5"><MsInput label="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="span-4"><MsInput label="Department *" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Unit *" required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Reference Range" value={form.referenceRange} onChange={(e) => setForm({ ...form, referenceRange: e.target.value })} /></div>
              <div className="span-3"><MsInput label="TAT (Hrs)" type="number" value={form.turnaroundHours} onChange={(e) => setForm({ ...form, turnaroundHours: e.target.value })} /></div>
              <div className="span-3"><MsInput label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div className="span-12">
                <div className="ms-actions">
                  <MsButton variant="secondary" type="button" onClick={() => setForm(emptyForm)}>Reset</MsButton>
                  <MsButton type="submit">Save Test</MsButton>
                </div>
              </div>
            </form>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Tests List">
            <div className="filter-grid" style={{ marginBottom: 16 }}>
              <MsInput label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
              <MsButton onClick={load}>Apply</MsButton>
            </div>
            <MsTable
              columns={[
                { key: 'code', label: 'Code' },
                { key: 'name', label: 'Name' },
                { key: 'category', label: 'Department' },
                { key: 'unit', label: 'Unit' },
                { key: 'normalRangeMale', label: 'Range' },
                { key: 'turnaroundHours', label: 'TAT' },
                { key: 'price', label: 'Price', render: (row) => Number(row.price).toFixed(2) }
              ]}
              rows={data}
              onSort={setSortKey}
              sortKey={sortKey}
              paginationLabel={`Rows: ${data.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
