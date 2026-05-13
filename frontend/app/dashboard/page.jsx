'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';
import { getUser } from '@/lib/auth';

const WALKTHROUGH_KEY_PREFIX = 'lims-demo-walkthrough-dismissed';

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="dashboard-empty-state">
      <div className="dashboard-empty-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="dashboard-empty-title">{title}</div>
      <div className="dashboard-empty-copy">{description}</div>
      {action ? <div className="dashboard-empty-action">{action}</div> : null}
    </div>
  );
}

function PriorityTile({ tone, icon, label, value, helper }) {
  return (
    <div className={`dashboard-priority-tile dashboard-priority-${tone}`}>
      <div className="dashboard-priority-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="dashboard-priority-content">
        <div className="dashboard-priority-label">{label}</div>
        <div className="dashboard-priority-value">{value}</div>
        <div className="dashboard-priority-helper">{helper}</div>
      </div>
    </div>
  );
}

function WorkflowPipeline({ steps }) {
  const maxValue = Math.max(...steps.map((step) => step.value), 1);

  return (
    <div className="dashboard-workflow-grid">
      {steps.map((step) => (
        <div key={step.label} className="dashboard-workflow-step">
          <div className="dashboard-workflow-top">
            <span className="dashboard-workflow-name">{step.label}</span>
            <span className="dashboard-workflow-value">{step.value}</span>
          </div>
          <div className="dashboard-workflow-rail" aria-hidden="true">
            <div
              className={`dashboard-workflow-fill dashboard-workflow-${step.tone}`}
              style={{ width: `${Math.max((step.value / maxValue) * 100, step.value ? 12 : 0)}%` }}
            />
          </div>
          <div className="dashboard-workflow-helper">{step.helper}</div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { push } = useToast();
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

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const data = await api.get('/api/dashboard/kpis');
        if (!cancelled) setKpis(data || {});
      } catch (error) {
        if (!cancelled) {
          push({
            title: 'Dashboard unavailable',
            description: error.message || 'Unable to load dashboard metrics.',
            variant: 'error'
          });
        }
      }
    }

    loadDashboard();
    const socket = socketClient();
    socket.on('result:new', (payload) => {
      setFeed((prev) => [payload, ...prev].slice(0, 20));
    });

    const user = getUser();
    const walkthroughKey = `${WALKTHROUGH_KEY_PREFIX}:${user?.tenantId || 'default'}`;
    setShowWalkthrough(typeof window !== 'undefined' && localStorage.getItem(walkthroughKey) !== 'true');

    return () => {
      cancelled = true;
      socket.off('result:new');
    };
  }, [push]);

  const dismissWalkthrough = () => {
    const user = getUser();
    const walkthroughKey = `${WALKTHROUGH_KEY_PREFIX}:${user?.tenantId || 'default'}`;
    localStorage.setItem(walkthroughKey, 'true');
    setShowWalkthrough(false);
  };

  const kpiCards = useMemo(
    () => [
      {
        label: "Today's Registrations",
        value: kpis.todayRegistrations ?? 0,
        helper: 'New patient visits logged today',
        icon: '🧾'
      },
      {
        label: 'Pending Collection',
        value: kpis.pendingCollections ?? 0,
        helper: 'Awaiting sample pickup or draw',
        icon: '🧪'
      },
      {
        label: 'Samples in Process',
        value: kpis.samplesInProcessing ?? 0,
        helper: 'Currently active in the lab',
        icon: '⚙️'
      },
      {
        label: 'Reports Pending Auth',
        value: kpis.reportsPendingAuth ?? 0,
        helper: 'Waiting for pathologist sign-off',
        icon: '🩺'
      },
      {
        label: 'Reports Delivered',
        value: kpis.reportsDelivered ?? 0,
        helper: 'Released to patients today',
        icon: '📤'
      },
      {
        label: 'Revenue Today',
        value: `₹${Number(kpis.revenueToday ?? 0).toFixed(2)}`,
        helper: 'Collections captured across all channels',
        icon: '₹'
      }
    ],
    [kpis]
  );

  const pipelineSteps = useMemo(
    () => [
      {
        label: 'Registered',
        value: kpis.todayRegistrations ?? 0,
        helper: 'Bookings created',
        tone: 'blue'
      },
      {
        label: 'Awaiting Collection',
        value: kpis.pendingCollections ?? 0,
        helper: 'Needs collection',
        tone: 'amber'
      },
      {
        label: 'Collected',
        value: Math.max((kpis.todayRegistrations ?? 0) - (kpis.pendingCollections ?? 0), 0),
        helper: 'Collected samples',
        tone: 'green'
      },
      {
        label: 'In Process',
        value: kpis.samplesInProcessing ?? 0,
        helper: 'Under testing',
        tone: 'blue'
      },
      {
        label: 'Pending Auth',
        value: kpis.reportsPendingAuth ?? 0,
        helper: 'Needs approval',
        tone: 'amber'
      },
      {
        label: 'Delivered',
        value: kpis.reportsDelivered ?? 0,
        helper: 'Completed lifecycle',
        tone: 'green'
      }
    ],
    [kpis]
  );

  const tatAverage = useMemo(() => {
    const items = Array.isArray(kpis.tatByDepartment) ? kpis.tatByDepartment : [];
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + Number(item.averageTatHours || 0), 0) / items.length;
  }, [kpis.tatByDepartment]);

  const analyzers = Array.isArray(kpis.analyzers) ? kpis.analyzers : [];
  const offlineAnalyzers = analyzers.filter((item) => item.status === 'OFFLINE' || item.status === 'ERROR');
  const recentPatients = Array.isArray(kpis.recentPatients) ? kpis.recentPatients : [];
  const revenueBreakdown = kpis.revenueTodayBreakdown || {};
  const tatItems = Array.isArray(kpis.tatByDepartment) ? kpis.tatByDepartment : [];

  return (
    <PageWrapper title="Dashboard">
      {showWalkthrough ? (
        <div className="dashboard-walkthrough">
          <div className="dashboard-walkthrough-copy">
            <strong>First-run guide</strong>
            <span>
              Start with registrations, track samples through the pipeline, then authorize and deliver reports from
              the result queue.
            </span>
          </div>
          <MsButton variant="secondary" onClick={dismissWalkthrough}>
            Dismiss
          </MsButton>
        </div>
      ) : null}

      <div className="grid-12 dashboard-shell">
        <div className="span-12">
          <div className="dashboard-priority-strip">
            <PriorityTile
              tone="danger"
              icon="⏱"
              label="TAT Breaches"
              value={kpis.tatBreaches ?? 0}
              helper="Orders outside committed turnaround"
            />
            <PriorityTile
              tone="amber"
              icon="📝"
              label="Pending Authorization"
              value={kpis.reportsPendingAuth ?? 0}
              helper="Pathologist review required"
            />
            <PriorityTile
              tone="info"
              icon="🧪"
              label="Awaiting Collection"
              value={kpis.pendingCollections ?? 0}
              helper="Sample draw or pickup pending"
            />
            <PriorityTile
              tone={offlineAnalyzers.length ? 'danger' : 'success'}
              icon="📡"
              label="Analyzer Status"
              value={offlineAnalyzers.length ? `${offlineAnalyzers.length} offline` : 'Healthy'}
              helper={offlineAnalyzers.length ? 'Immediate machine attention needed' : 'All configured devices online'}
            />
          </div>
        </div>

        {kpiCards.map((card) => (
          <div key={card.label} className="span-2 dashboard-kpi-slot">
            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-meta">
                <span className="dashboard-kpi-icon" aria-hidden="true">
                  {card.icon}
                </span>
                <span className="dashboard-kpi-label">{card.label}</span>
              </div>
              <div className="dashboard-kpi-value">{card.value}</div>
              <div className="dashboard-kpi-helper">{card.helper}</div>
            </div>
          </div>
        ))}

        <div className="span-8 dashboard-stack">
          <MsCard title="Sample Workflow">
            <WorkflowPipeline steps={pipelineSteps} />
          </MsCard>

          <MsCard title="Live Results Feed">
            {feed.length ? (
              <div className="dashboard-feed-list">
                {feed.map((item, index) => (
                  <div key={`${item.orderNumber || item.patientId || 'feed'}-${index}`} className="dashboard-feed-item">
                    <div className="dashboard-feed-title">{item.testName || item.event || 'Lab activity'}</div>
                    <div className="dashboard-feed-meta">
                      <span>{item.patientName || item.patientId || 'Patient update'}</span>
                      <span>{item.value ?? item.status ?? 'Processed'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🕘"
                title="No live activity yet"
                description="New registrations, sample updates, and report events will appear here."
              />
            )}
          </MsCard>
        </div>

        <div className="span-4 dashboard-stack">
          <MsCard title="TAT Monitoring">
            {tatItems.length ? (
              <div className="dashboard-stat-stack">
                <div className="dashboard-stat-highlight">
                  <span className="dashboard-stat-label">Average TAT</span>
                  <strong>{tatAverage.toFixed(1)} hrs</strong>
                </div>
                {tatItems.slice(0, 5).map((item) => (
                  <div key={item.department} className="dashboard-inline-row">
                    <span>{item.department}</span>
                    <span>
                      {Number(item.averageTatHours || 0).toFixed(1)}h · {item.breachCount || 0} breaches
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📈"
                title="No TAT records yet"
                description="Department-level turnaround monitoring will appear once samples move through testing."
              />
            )}
          </MsCard>

          <MsCard title="Analyzer Status">
            {analyzers.length ? (
              <div className="dashboard-status-list">
                {analyzers.map((analyzer) => (
                  <div key={analyzer.id || analyzer.name} className="dashboard-status-item">
                    <div>
                      <div className="dashboard-status-title">{analyzer.name}</div>
                      <div className="dashboard-status-copy">{analyzer.lastConnectedAt || 'No recent heartbeat'}</div>
                    </div>
                    <MsBadge
                      status={
                        analyzer.status === 'ONLINE'
                          ? 'normal'
                          : analyzer.status === 'OFFLINE' || analyzer.status === 'ERROR'
                            ? 'abnormal'
                            : 'pending'
                      }
                    >
                      {analyzer.status || 'UNKNOWN'}
                    </MsBadge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🧬"
                title="No analyzers configured"
                description="Connect an analyzer to monitor device status and result flow."
                action={<MsButton variant="secondary">Configure Analyzer</MsButton>}
              />
            )}
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Revenue & Payments">
            <div className="dashboard-revenue-grid">
              {[
                ['Cash', revenueBreakdown.cash ?? 0],
                ['UPI', revenueBreakdown.upi ?? 0],
                ['Card', revenueBreakdown.card ?? 0],
                ['Credit', revenueBreakdown.credit ?? 0],
                ['Total Revenue', revenueBreakdown.total ?? kpis.revenueToday ?? 0]
              ].map(([label, amount]) => (
                <div key={label} className="dashboard-revenue-card">
                  <span className="dashboard-revenue-label">{label}</span>
                  <strong className="dashboard-revenue-value">₹{Number(amount).toFixed(2)}</strong>
                </div>
              ))}
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard
            title="Recent Patients"
            actions={
              <div className="dashboard-table-tools">
                <input className="dashboard-inline-input" placeholder="Search patient" aria-label="Search patient" />
                <MsButton variant="secondary">View all</MsButton>
              </div>
            }
          >
            {recentPatients.length ? (
              <MsTable
                columns={[
                  { key: 'mrn', label: 'MRN' },
                  { key: 'name', label: 'Patient Name' },
                  { key: 'gender', label: 'Gender' },
                  { key: 'registeredAt', label: 'Registered At' },
                  { key: 'status', label: 'Status' },
                  { key: 'action', label: 'Action' }
                ]}
                rows={recentPatients.map((patient) => ({
                  mrn: patient.mrn || 'N/A',
                  name: patient.name || 'Unknown',
                  gender: patient.gender || 'N/A',
                  registeredAt: patient.registeredAt || 'N/A',
                  status: (
                    <MsBadge status={patient.status === 'COMPLETED' ? 'normal' : patient.status === 'PENDING' ? 'pending' : 'normal'}>
                      {patient.status || 'REGISTERED'}
                    </MsBadge>
                  ),
                  action: <MsButton variant="secondary">Open</MsButton>
                }))}
              />
            ) : (
              <EmptyState
                icon="👤"
                title="No recent patients"
                description="New registrations will appear here as soon as bookings are created."
              />
            )}
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
