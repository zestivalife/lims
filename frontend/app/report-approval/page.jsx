'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function ReportApprovalPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');

  async function load() {
    try {
      const data = await api.get('/api/reports');
      setRows(data.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load reports');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(reportId) {
    try {
      await api.post(`/api/reports/${reportId}/sign`, { pin: '1234' });
      toast.success('Report approved');
      await load();
    } catch (e) {
      toast.error(e.message || 'Approval failed');
    }
  }

  async function release(reportId) {
    try {
      await api.post(`/api/reports/${reportId}/deliver`, { method: 'WHATSAPP' });
      toast.success('Report released to patient');
      await load();
    } catch (e) {
      toast.error(e.message || 'Release failed');
    }
  }

  const filtered = useMemo(() => {
    let list = [...rows];
    if (q.trim()) {
      const text = q.toLowerCase();
      list = list.filter((r) =>
        [r.id, r.orderId, r.patientName, r.approvedBy, r.status].filter(Boolean).some((x) => String(x).toLowerCase().includes(text))
      );
    }
    if (date) {
      list = list.filter((r) => new Date(r.createdAt).toISOString().slice(0, 10) === date);
    }
    list.sort((a, b) => {
      if (sortKey === 'createdAt' || sortKey === 'releasedAt') return new Date(b[sortKey] || 0) - new Date(a[sortKey] || 0);
      return String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
    });
    return list;
  }, [rows, q, date, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Reports Approval</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Report Management">
            <div className="filter-grid" style={{ gridTemplateColumns: '1.2fr 1.2fr 56px' }}>
              <MsInput label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
              <MsInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className="icon-btn" title="Reload" onClick={load}>📅</button>
            </div>
            <p style={{ margin: '16px 0' }}>Pathologist approves and releases reports with audit tracking.</p>
            <MsTable
              columns={[
                { key: 'id', label: 'Report No' },
                { key: 'orderId', label: 'Order' },
                { key: 'patientName', label: 'Patient' },
                { key: 'status', label: 'Status', render: (r) => <MsBadge status={r.status} /> },
                { key: 'approvedBy', label: 'Approved By', render: (r) => r.approvedBy || '-' },
                { key: 'releasedAt', label: 'Released At', render: (r) => (r.releasedAt ? new Date(r.releasedAt).toLocaleString() : '-') },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (r) => (
                    <div className="table-actions">
                      <button className="icon-btn" title="Approve" onClick={() => approve(r.id)}>✅</button>
                      <button className="icon-btn" title="Release" onClick={() => release(r.id)}>📤</button>
                    </div>
                  )
                }
              ]}
              rows={filtered}
              onSort={setSortKey}
              sortKey={sortKey}
              paginationLabel={`Reports: ${filtered.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
