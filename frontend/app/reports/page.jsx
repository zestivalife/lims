'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { useEffect, useMemo } from 'react';

export default function ReportsPage() {
  const [orderId, setOrderId] = useState('');
  const [reportRows, setReportRows] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const toast = useToast();

  async function load() {
    try {
      const data = await api.get('/api/reports?page=1&pageSize=200');
      setReportRows(data.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load reports');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function generate() {
    try {
      await api.post('/api/reports/generate', { orderId });
      toast.success('Report generated successfully');
      await load();
    } catch (e) {
      toast.error(e.message || 'Failed to generate report');
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? reportRows.filter((r) => `${r.id} ${r.orderId} ${r.patientName || ''}`.toLowerCase().includes(q))
      : reportRows;
    const sorted = [...filtered];
    sorted.sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
    return sorted;
  }, [reportRows, search, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Reports</h1>

      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Generate Report">
            <div className="filter-grid">
              <MsInput label="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
              <MsButton onClick={generate}>Generate PDF</MsButton>
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Generated Reports">
            <div className="filter-grid" style={{ marginBottom: 16 }}>
              <MsInput label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <MsTable
              columns={[
                { key: 'id', label: 'Report ID', render: (row) => <Link href={`/reports/${row.id}`}>{row.id}</Link> },
                { key: 'orderId', label: 'Order ID' },
                { key: 'patientName', label: 'Patient' },
                { key: 'status', label: 'Status', render: (row) => <MsBadge status={row.status} /> },
                { key: 'signedAt', label: 'Signed At', render: (row) => (row.signedAt ? new Date(row.signedAt).toLocaleString() : 'Pending') },
                { key: 'pdfUrl', label: 'PDF URL', render: (row) => (row.pdfUrl ? <a href={row.pdfUrl} target="_blank" rel="noreferrer">Open</a> : '-') }
              ]}
              rows={filteredRows}
              onSort={setSortKey}
              sortKey={sortKey}
              paginationLabel={`Rows: ${filteredRows.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
