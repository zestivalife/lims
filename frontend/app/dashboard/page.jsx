'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';

export default function DashboardPage() {
  const [kpis, setKpis] = useState({
    todayTests: 0,
    pendingResults: 0,
    criticalAlerts: 0,
    revenueToday: 0,
    recentPatients: [],
    analyzers: []
  });
  const [feed, setFeed] = useState([]);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/api/dashboard/kpis');
        setKpis(data);
      } catch (e) {
        toast.error(e.message || 'Failed to load dashboard');
      }
    }
    load();
  }, [toast]);

  useEffect(() => {
    const socket = socketClient();
    socket.on('result:new', (payload) => {
      setFeed((prev) => [payload, ...prev].slice(0, 20));
    });
    return () => {
      socket.off('result:new');
    };
  }, []);

  const kpiCards = useMemo(
    () => [
      { label: "Today's Tests", value: kpis.todayTests, trend: '+8% vs yesterday' },
      { label: 'Pending Results', value: kpis.pendingResults, trend: 'Live queue' },
      { label: 'Critical Alerts', value: kpis.criticalAlerts, trend: 'Requires review' },
      { label: 'Revenue Today', value: `₹${Number(kpis.revenueToday).toFixed(2)}`, trend: 'Billing summary' }
    ],
    [kpis]
  );

  return (
    <PageWrapper>
      <h1 className="page-title">Dashboard</h1>
      <div className="grid-12">
        {kpiCards.map((k) => (
          <div key={k.label} className="span-3">
            <MsCard title={k.label}>
              <div className="kpi-value">{k.value}</div>
              <div style={{ marginTop: 4, color: 'var(--color-muted)' }}>{k.trend}</div>
            </MsCard>
          </div>
        ))}

        <div className="span-8">
          <MsCard title="Live Results Feed">
            <div style={{ display: 'grid', gap: 12 }}>
              {feed.length === 0 ? <div style={{ color: 'var(--color-muted)' }}>No live results yet.</div> : null}
              {feed.map((item) => (
                <div key={item.id} className="slide-in ms-card" style={{ padding: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item?.testCatalog?.name || item?.testCatalog?.code || 'Test Result'}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                        Value: {item.value} {item.unit} | Ref: {item.referenceRange}
                      </div>
                    </div>
                    <MsBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </MsCard>
        </div>

        <div className="span-4">
          <MsCard title="Analyzer Status">
            <div style={{ display: 'grid', gap: 10 }}>
              {(kpis.analyzers || []).map((a) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, alignItems: 'center' }}>
                  <span className={`status-dot ${a.isActive ? 'ok' : 'down'}`} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      Last seen: {a.lastConnectedAt ? new Date(a.lastConnectedAt).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
              ))}
              {(!kpis.analyzers || kpis.analyzers.length === 0) && <div style={{ color: 'var(--color-muted)' }}>No analyzers configured.</div>}
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Recent Patients">
            <MsTable
              columns={[
                { key: 'mrn', label: 'MRN' },
                { key: 'gender', label: 'Gender' },
                { key: 'createdAt', label: 'Registered At', render: (row) => new Date(row.createdAt).toLocaleString() }
              ]}
              rows={kpis.recentPatients || []}
              paginationLabel={`Rows: ${(kpis.recentPatients || []).length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
