'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function ReportsPage() {
  const [orderId, setOrderId] = useState('');
  const [reportRows, setReportRows] = useState([]);
  const toast = useToast();

  async function generate() {
    try {
      const report = await api.post('/api/reports/generate', { orderId });
      setReportRows((prev) => [{ id: report.id, orderId, pdfUrl: report.pdfUrl, signedAt: report.signedAt }, ...prev]);
      toast.success('Report generated successfully');
    } catch (e) {
      toast.error(e.message || 'Failed to generate report');
    }
  }

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
            <MsTable
              columns={[
                { key: 'id', label: 'Report ID', render: (row) => <Link href={`/reports/${row.id}`}>{row.id}</Link> },
                { key: 'orderId', label: 'Order ID' },
                { key: 'signedAt', label: 'Signed At', render: (row) => (row.signedAt ? new Date(row.signedAt).toLocaleString() : 'Pending') },
                { key: 'pdfUrl', label: 'PDF URL', render: (row) => <a href={row.pdfUrl} target="_blank" rel="noreferrer">Open</a> }
              ]}
              rows={reportRows}
              paginationLabel={`Rows: ${reportRows.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
