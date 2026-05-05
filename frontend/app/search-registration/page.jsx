'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

function mapStatus(status) {
  if (status === 'COMPLETED') return 'PAID';
  if (status === 'IN_PROGRESS') return 'IN_PROCESS';
  return 'BOOKED';
}

export default function SearchRegistrationPage() {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const toast = useToast();

  async function load() {
    try {
      const res = await api.get(`/api/tests/orders?page=1&pageSize=200&q=${encodeURIComponent(q)}`);
      setOrders(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load registrations');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let rows = [...orders];
    if (date) {
      rows = rows.filter((r) => new Date(r.createdAt).toISOString().slice(0, 10) === date);
    }
    rows.sort((a, b) => {
      if (sortKey === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      const av = String(a?.[sortKey] ?? a?.patient?.[sortKey] ?? '');
      const bv = String(b?.[sortKey] ?? b?.patient?.[sortKey] ?? '');
      return av.localeCompare(bv);
    });
    return rows;
  }, [orders, date, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Registration Search</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Registrations">
            <div className="filter-grid" style={{ gridTemplateColumns: '2fr 1.5fr 56px' }}>
              <MsInput label="Search" placeholder="Order ID / MRN" value={q} onChange={(e) => setQ(e.target.value)} />
              <MsInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className="icon-btn" title="Reload" onClick={load}>↻</button>
            </div>
            <div style={{ marginTop: 16 }}>
              <MsTable
                columns={[
                  { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
                  { key: 'id', label: 'Order' },
                  { key: 'patientName', label: 'Patient', render: (r) => r.patient?.name || '-' },
                  { key: 'mobile', label: 'Mobile', render: (r) => r.patient?.phone || '-' },
                  { key: 'tests', label: 'Tests', render: (r) => (r.results || []).map((x) => x.testCatalog?.name).filter(Boolean).join(', ') || '-' },
                  { key: 'status', label: 'Status', render: (r) => <MsBadge status={mapStatus(r.status)} label={mapStatus(r.status)} /> },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (r) => (
                      <div className="table-actions">
                        <a className="icon-btn" href={`/result-entry?orderId=${r.id}`} title="Lab Order">🧪</a>
                        <a className="icon-btn" href={`/billing?orderId=${r.id}`} title="Print Bill">🧾</a>
                        <a className="icon-btn" href={`/new-registration?rebook=${r.patientId}`} title="Edit/Rebook">✏️</a>
                      </div>
                    )
                  }
                ]}
                rows={filtered}
                onSort={setSortKey}
                sortKey={sortKey}
                paginationLabel={`Total registrations: ${filtered.length}`}
              />
            </div>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
