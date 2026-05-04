'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import TrendChart from '@/components/charts/TrendChart';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function PatientProfilePage() {
  const params = useParams();
  const id = params?.id;
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/api/patients/${id}/history`);
        setPatient(data.patient);
        setHistory(data.history || []);
      } catch (e) {
        toast.error(e.message || 'Failed to load patient profile');
      }
    }
    if (id) load();
  }, [id, toast]);

  const rows = useMemo(() => {
    const collected = [];
    for (const order of history) {
      for (const result of order.results || []) {
        collected.push({
          id: result.id,
          date: order.createdAt,
          orderId: order.id,
          test: result.testCatalog?.name || result.testCatalog?.code,
          value: result.value,
          unit: result.unit,
          status: result.status,
          abnormal: result.status === 'ABNORMAL' || result.status === 'CRITICAL'
        });
      }
    }
    return collected.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history]);

  const trendSeries = useMemo(() => {
    const grouped = {};
    for (const row of rows) {
      const n = Number(row.value);
      if (Number.isNaN(n)) continue;
      if (!grouped[row.test]) grouped[row.test] = [];
      grouped[row.test].push({ x: row.date, y: n });
    }
    const firstKey = Object.keys(grouped)[0];
    if (!firstKey) return { labels: [], values: [], label: 'No Numeric Trend' };
    const sorted = grouped[firstKey].sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
    return {
      labels: sorted.map((item) => new Date(item.x).toLocaleDateString()),
      values: sorted.map((item) => item.y),
      label: `${firstKey} Trend`
    };
  }, [rows]);

  return (
    <PageWrapper>
      <h1 className="page-title">Patient Profile</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Patient Information">
            {patient ? (
              <div className="grid-12">
                <div className="span-6"><strong>MRN:</strong> {patient.mrn}</div>
                <div className="span-6"><strong>Name:</strong> {patient.name}</div>
                <div className="span-6"><strong>DOB:</strong> {patient.dob}</div>
                <div className="span-6"><strong>Gender:</strong> {patient.gender}</div>
                <div className="span-6"><strong>Phone:</strong> {patient.phone}</div>
                <div className="span-6"><strong>Email:</strong> {patient.email || 'N/A'}</div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-muted)' }}>Loading patient profile...</div>
            )}
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Test Results History">
            <MsTable
              columns={[
                { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleString() },
                { key: 'orderId', label: 'Order ID' },
                { key: 'test', label: 'Test' },
                { key: 'value', label: 'Value', render: (row) => `${row.value} ${row.unit}` },
                { key: 'status', label: 'Status' }
              ]}
              rows={rows}
              statusKey="status"
              paginationLabel={`Rows: ${rows.length}`}
            />
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Result Trend">
            <div style={{ height: 280 }}>
              <TrendChart labels={trendSeries.labels} values={trendSeries.values} label={trendSeries.label} />
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Actions">
            <div className="ms-actions">
              <MsButton onClick={() => (window.location.href = '/tests')}>New Order</MsButton>
              <MsButton variant="secondary" onClick={() => (window.location.href = '/reports')}>
                Download Report
              </MsButton>
              <MsButton variant="secondary" onClick={() => (window.location.href = '/reports')}>
                Send Report
              </MsButton>
            </div>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
