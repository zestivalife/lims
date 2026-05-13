'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';
import { getUser } from '@/lib/auth';

const WALKTHROUGH_KEY_PREFIX = 'lims-demo-walkthrough-dismissed';

export default function DashboardPage() {
  const [kpis, setKpis] = useState({
    todayRegistrations: 0,
    pendingCollections: 0,
    samplesInProcessing: 0,
    reportsPendingAuth: 0,
    reportsDelivered: 0,
    criticalAlerts: 0,
    revenueToday: 0,
    revenueTodayBreakdown: { cash: 0, upi: 0, card: 0, credit: 0, total: 0 },
    tatBreaches: 0,
    tatByDepartment: [],
    tatTrend7: [],
    tatTrend30: [],
    recentPatients: [],
    analyzers: []
  });
  const [feed, setFeed] = useState([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const user = getUser();
    const walkKey = `${WALKTHROUGH_KEY_PREFIX}:${user?.tenantId || 'default'}`;
    setShowWalkthrough(window.localStorage.getItem(walkKey) !== '1');
  }, []);

  function dismissWalkthrough() {
    if (typeof window === 'undefined') return;
    const user = getUser();
    const walkKey = `${WALKTHROUGH_KEY_PREFIX}:${user?.tenantId || 'default'}`;
    window.localStorage.setItem(walkKey, '1');
    setShowWalkthrough(false);
  }

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
      { label: "Today's Registrations", value: kpis.todayRegistrations, trend: 'New patients today' },
      { label: 'Pending Collections', value: kpis.pendingCollections, trend: 'Awaiting sample collection' },
      { label: 'Samples in Processing', value: kpis.samplesInProcessing, trend: 'Active lab pipeline' },
      { label: 'Reports Pending Auth', value: kpis.reportsPendingAuth, trend: 'Awaiting sign-off' },
      { label: 'Reports Delivered', value: kpis.reportsDelivered, trend: 'Released to patients' },
      { label: 'Revenue Today', value: `₹${Number(kpis.revenueToday).toFixed(2)}`, trend: 'Collected today' }
    ],
    [kpis]
  );

  return (
    <PageWrapper>
      {showWalkthrough ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 10, 15, 0.38)',
            backdropFilter: 'blur(10px)',
            zIndex: 80,
            display: 'grid',
            placeItems: 'center',
            padding: 24
          }}
        >
          <div
            className="ms-card"
            style={{
              width: 'min(720px, 100%)',
              padding: 28,
              borderRadius: 28,
              boxShadow: '0 28px 70px rgba(15, 23, 42, 0.22)',
              display: 'grid',
              gap: 18
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>Demo workspace is ready</div>
              <div style={{ marginTop: 8, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                We created a safe demo lab with seeded tests, users, patients, visit history, reports, invoices, and analyzer-ready records.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {[
                'Preloaded panels: CBC, LFT, RFT, Thyroid Profile, Lipid Profile, Urine R/M',
                'Demo users: admin, tech, pathologist, receptionist',
                'Patient history, results, invoices, and reports already populated',
                'Demo data stays isolated under Demo mode from day 1'
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    border: '1px solid var(--ios-border)',
                    borderRadius: 18,
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.9)',
                    fontSize: 14,
                    lineHeight: 1.45
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <div
              style={{
                border: '1px solid rgba(255, 159, 10, 0.18)',
                background: 'rgba(255, 247, 237, 0.96)',
                borderRadius: 18,
                padding: '14px 16px',
                color: '#9a6700',
                fontSize: 14
              }}
            >
              When you are ready to move from demo to live operations, complete the full configuration wizard from Configuration and update your lab masters there.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-secondary" onClick={dismissWalkthrough}>
                Dismiss
              </button>
              <a className="btn btn-primary" href="/configuration" onClick={dismissWalkthrough}>
                Open Configuration
              </a>
            </div>
          </div>
        </div>
      ) : null}
      <h1 className="page-title">Dashboard</h1>
      <div className="grid-12">
        {kpiCards.map((k) => (
          <div key={k.label} className="span-2">
            <MsCard title={k.label}>
              <div className="kpi-value">{k.value}</div>
              <div style={{ marginTop: 4, color: 'var(--color-muted)' }}>{k.trend}</div>
            </MsCard>
          </div>
        ))}

        <div className="span-12">
          <MsCard title="Revenue by Payment Mode">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 14
              }}
            >
              {[
                ['Cash', kpis.revenueTodayBreakdown?.cash || 0],
                ['UPI', kpis.revenueTodayBreakdown?.upi || 0],
                ['Card', kpis.revenueTodayBreakdown?.card || 0],
                ['Credit', kpis.revenueTodayBreakdown?.credit || 0]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="ms-card"
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    display: 'grid',
                    gap: 6
                  }}
                >
                  <div style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>₹{Number(value).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="TAT Monitoring">
            <div style={{ display: 'grid', gap: 14 }}>
              <div
                className="ms-card"
                style={{
                  padding: 16,
                  borderRadius: 18,
                  display: 'grid',
                  gap: 6,
                  borderColor: 'rgba(255, 59, 48, 0.18)',
                  background: 'rgba(255, 245, 245, 0.98)'
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 600 }}>Breach Alerts</div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-danger)' }}>{kpis.tatBreaches || 0}</div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {(kpis.tatByDepartment || []).slice(0, 6).map((item) => (
                  <div
                    key={item.department}
                    className="ms-card"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 16,
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: 12,
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.department}</div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>{item.averageHours} hrs avg</div>
                    <MsBadge status={item.breaches > 0 ? 'abnormal' : 'normal'}>{item.breaches} breach</MsBadge>
                  </div>
                ))}
                {(!kpis.tatByDepartment || kpis.tatByDepartment.length === 0) && <div style={{ color: 'var(--color-muted)' }}>No TAT records available yet.</div>}
              </div>
            </div>
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="TAT Trends">
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-muted)' }}>Last 7 days</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(kpis.tatTrend7 || []).map((item) => (
                    <div
                      key={`7-${item.date}`}
                      className="ms-card"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 14,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 10
                      }}
                    >
                      <div>{new Date(item.date).toLocaleDateString()}</div>
                      <div style={{ fontWeight: 600 }}>{item.averageHours} hrs</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-muted)' }}>Last 30 days</div>
                <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflow: 'auto', paddingRight: 4 }}>
                  {(kpis.tatTrend30 || []).map((item) => (
                    <div
                      key={`30-${item.date}`}
                      className="ms-card"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 14,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 10
                      }}
                    >
                      <div>{new Date(item.date).toLocaleDateString()}</div>
                      <div style={{ fontWeight: 600 }}>{item.averageHours} hrs</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MsCard>
        </div>

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
