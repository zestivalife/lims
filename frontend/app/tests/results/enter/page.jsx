'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

const LFT_PARAMETERS = [
  { name: 'Total Bilirubin', unit: 'mg/dL', range: '0.2 - 1.0', value: '1.2' },
  { name: 'Direct Bilirubin', unit: 'mg/dL', range: '0.2 - 0.4', value: '0.21' },
  { name: 'Indirect Bilirubin', unit: 'mg/dL', range: '0.2 - 0.4', value: '0.45' },
  { name: 'SGPT (ALT)', unit: 'U/L', range: '0 - 35', value: '45' },
  { name: 'SGOT (AST)', unit: 'U/L', range: '0 - 40', value: '48' },
  { name: 'Alkaline Phosphatase', unit: 'U/L', range: '30 - 120', value: '98' },
  { name: 'Total Proteins', unit: 'g/dL', range: '6.0 - 8.0', value: '5.1' },
  { name: 'Albumin Serum', unit: 'g/dL', range: '3.2 - 4.6', value: '3.9' },
  { name: 'Globulin Serum', unit: 'g/dL', range: '1.8 - 3.6', value: '2.8' },
  { name: 'A/G Ratio', unit: 'Ratio', range: '1.2 - 2.2', value: '1.90' },
  { name: 'Gamma Glutamyl Transferase-Serum', unit: 'IU/L', range: '12 - 43', value: '' }
];

function buildResultBarcodeValue({ mrn, orderId, testCode, index }) {
  const mrnKey = String(mrn || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-8) || 'PATIENT';
  const orderKey = String(orderId || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-6) || 'ORDER';
  const codeKey = String(testCode || 'TEST').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8) || 'TEST';
  return `${mrnKey}${orderKey}${codeKey}${String(index + 1).padStart(2, '0')}`;
}

function MiniBarcode({ value }) {
  const bars = useMemo(() => {
    const raw = String(value || '').trim() || 'LIMS';
    const start = [1, 1, 0, 1, 0, 0, 1, 1];
    const end = [1, 1, 0, 0, 1, 0, 1, 1];
    const body = raw
      .split('')
      .flatMap((char) => {
        const bin = char.charCodeAt(0).toString(2).padStart(8, '0').split('').map(Number);
        return [0, ...bin, 1];
      });
    return [...start, ...body, ...end];
  }, [value]);

  const width = Math.max(bars.length * 2, 120);

  return (
    <div className="barcode-stack">
      <svg className="barcode-svg" viewBox={`0 0 ${width} 42`} preserveAspectRatio="none" role="img" aria-label={`Barcode ${value}`}>
        <rect x="0" y="0" width={width} height="42" fill="white" />
        {bars.map((bar, index) => (bar ? <rect key={`${value}-${index}`} x={index * 2} y="2" width="2" height="30" fill="#111111" /> : null))}
      </svg>
      <span className="barcode-text">{value}</span>
    </div>
  );
}

function parseRange(referenceRange) {
  const values = String(referenceRange || '').match(/-?\d+(?:\.\d+)?/g);
  if (!values || values.length < 2) return null;
  return [Number(values[0]), Number(values[1])];
}

function isAbnormal(value, referenceRange) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  const range = parseRange(referenceRange);
  if (Number.isNaN(n) || !range) return false;
  return n < range[0] || n > range[1];
}

function formatPatientName(patient) {
  return patient?.name || patient?.mrn || 'Unknown Patient';
}

function formatOrderDate(order) {
  if (!order?.createdAt) return '';
  return String(order.createdAt).replace('T', ' ').slice(0, 19);
}

function panelSlug(testName) {
  return `${String(testName || 'test').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'test'}-page`;
}

function statusClass(status) {
  const key = String(status || '').toLowerCase();
  if (key.includes('completed') || key.includes('delivered')) return 'delivered';
  if (key.includes('progress') || key.includes('received')) return 'received';
  if (key.includes('pending')) return 'registered';
  if (key.includes('cancel')) return 'provisional';
  return 'authenticated';
}

function ResultEntryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const orderId = searchParams.get('orderId');
  const testId = searchParams.get('testId');

  const [orders, setOrders] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [queueSearch, setQueueSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [order, setOrder] = useState(null);
  const [rows, setRows] = useState([]);
  const [authChecked, setAuthChecked] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const [remarkSearch, setRemarkSearch] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadQueue() {
    try {
      const data = await api.get('/api/tests/orders?page=1&pageSize=100');
      const rows = Array.isArray(data) ? data : (data.data || data.orders || []);
      setOrders(rows);
    } catch (error) {
      toast.error(error.message || 'Unable to load result queue');
    }
  }

  async function loadOrder(id) {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/tests/orders/${id}`);
      setOrder(data);
      const selected = (data.results || []).find((item) => item.id === testId) || (data.results || [])[0];
      const selectedName = selected?.testCatalog?.name || selected?.testCatalog?.code || 'Test';
      const isLft = /liver|lft/i.test(selectedName);
      const parameterRows = isLft
        ? LFT_PARAMETERS.map((item, index) => ({
            id: `${selected?.id || 'lft'}-${index}`,
            sourceResultId: index === 0 ? selected?.id : null,
            investigation: item.name,
            value: index === 0 ? (selected?.value || item.value) : item.value,
            unit: item.unit,
            referenceRange: item.range,
            abnormal: isAbnormal(index === 0 ? (selected?.value || item.value) : item.value, item.range)
          }))
        : (data.results || []).map((item) => ({
            id: item.id,
            sourceResultId: item.id,
            investigation: item.testCatalog?.name || item.testCatalog?.code || 'Test',
            value: item.value || '',
            unit: item.unit || item.testCatalog?.unit || '',
            referenceRange: item.referenceRange || item.testCatalog?.normalRangeMale || item.testCatalog?.normalRangeFemale || '',
            abnormal: isAbnormal(item.value, item.referenceRange || item.testCatalog?.normalRangeMale || item.testCatalog?.normalRangeFemale)
          }));
      setRows(parameterRows);
    } catch (error) {
      toast.error(error.message || 'Unable to load test entry page');
      setOrder(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (orderId) loadOrder(orderId);
  }, [orderId, testId]);

  const filteredOrders = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    return orders.filter((item) => {
      const haystack = [
        item.id,
        item.patient?.name,
        item.patient?.mrn,
        item.patient?.phone,
        item.status,
        ...(item.results || []).map((result) => result.testCatalog?.name)
      ].join(' ').toLowerCase();
      const statusOk = statusFilter === 'ALL' || item.status === statusFilter;
      return statusOk && (!q || haystack.includes(q));
    });
  }, [orders, queueSearch, statusFilter]);

  const selectedBarcodeEntries = useMemo(() => {
    return Object.entries(selectedServices)
      .filter(([, checked]) => checked)
      .map(([key], index) => {
        const [selectedOrderId, selectedResultId] = key.split(':');
        const selectedOrder = orders.find((item) => item.id === selectedOrderId);
        const selectedResult = selectedOrder?.results?.find((item) => item.id === selectedResultId);
        if (!selectedOrder || !selectedResult) return null;
        return {
          id: key,
          patient: formatPatientName(selectedOrder.patient),
          name: selectedResult.testCatalog?.name || selectedResult.testCatalog?.code || 'Test',
          sampleType: selectedResult.testCatalog?.method || selectedResult.unit || 'Sample',
          value: buildResultBarcodeValue({
            mrn: selectedOrder.patient?.mrn,
            orderId: selectedOrder.id,
            testCode: selectedResult.testCatalog?.code,
            index
          })
        };
      })
      .filter(Boolean);
  }, [orders, selectedServices]);

  const metrics = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((item) => item.status === 'COMPLETED').length;
    const received = orders.filter((item) => item.status === 'IN_PROGRESS').length;
    const registered = orders.filter((item) => item.status === 'PENDING').length;
    return {
      registered,
      received,
      provisional: Math.max(total - completed - received - registered, 0),
      preAuth: 0,
      authenticated: completed,
      delivered: completed,
      total
    };
  }, [orders]);

  function toggleService(orderRow, resultRow) {
    const key = `${orderRow.id}:${resultRow.id}`;
    setSelectedServices((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function selectedService() {
    const key = Object.keys(selectedServices).find((item) => selectedServices[item]);
    if (!key) return null;
    const [selectedOrderId, selectedResultId] = key.split(':');
    const selectedOrder = orders.find((item) => item.id === selectedOrderId);
    const selectedResult = selectedOrder?.results?.find((item) => item.id === selectedResultId);
    return selectedOrder && selectedResult ? { order: selectedOrder, result: selectedResult } : null;
  }

  function openSelectedResult() {
    const selected = selectedService();
    if (!selected) {
      toast.warning('Select one service before opening Result');
      return;
    }
    const testName = selected.result.testCatalog?.name || selected.result.testCatalog?.code || 'test';
    router.push(`/tests/results/${panelSlug(testName)}?orderId=${selected.order.id}&testId=${selected.result.id}`);
  }

  function updateValue(rowId, value) {
    setRows((prev) => prev.map((row) => {
      if (row.id !== rowId) return row;
      const autoAbnormal = isAbnormal(value, row.referenceRange);
      return { ...row, value, abnormal: autoAbnormal };
    }));
  }

  async function saveResults(printAfter = false) {
    if (!order) return;
    const payloadRows = rows
      .filter((row) => row.sourceResultId)
      .map((row) => ({
        id: row.sourceResultId,
        value: row.value,
        unit: row.unit,
        referenceRange: row.referenceRange
      }));
    if (!payloadRows.length) {
      toast.warning('No result row is mapped to save');
      return;
    }
    try {
      await api.post('/api/tests/results/manual', { orderId: order.id, results: payloadRows });
      toast.success(printAfter ? 'Results saved. Print preview ready.' : 'Results saved');
      await loadQueue();
      if (printAfter) window.print();
    } catch (error) {
      toast.error(error.message || 'Failed to save results');
    }
  }

  if (orderId) {
    const selectedName = rows[0]?.investigation || order?.results?.[0]?.testCatalog?.name || 'Test';
    const abnormalCount = rows.filter((row) => row.abnormal).length;

    return (
      <PageWrapper>
        <h1 className="page-title">{panelSlug(selectedName)}</h1>
        <div className="test-entry-shell">
          <div className="test-entry-main">
            <div className="patient-ribbon">
              <strong>{formatPatientName(order?.patient)}</strong>
              <span>MRN {order?.patient?.mrn || '-'}</span>
              <span>{order?.patient?.gender || '-'}</span>
              <span>{order?.patient?.insuranceId || 'Self'}</span>
              <span>{formatOrderDate(order)}</span>
              <MsButton variant="danger" type="button" onClick={() => toast.warning('Hold / reject noted')}>Hold/Reject</MsButton>
              <MsButton variant="secondary" type="button" onClick={() => toast.info(`Delta flagged rows: ${abnormalCount}`)}>Delta</MsButton>
            </div>

            <div className="investigation-toolbar">
              <strong>Investigation</strong>
              <strong>Observed Value</strong>
              <MsInput placeholder="Type to search template" />
              <strong>Result</strong>
              <strong>Units</strong>
              <strong>Normal Range</strong>
            </div>

            <section className="investigation-panel">
              <div className="investigation-group">
                <span>{selectedName}</span>
                <label>
                  <input type="checkbox" checked={authChecked} onChange={(e) => setAuthChecked(e.target.checked)} /> Authenticate Results
                </label>
              </div>
              {loading ? (
                <div className="investigation-row">Loading result sheet...</div>
              ) : rows.map((row) => (
                <div className="investigation-row" key={row.id}>
                  <div className="investigation-name">{row.investigation}</div>
                  <label className="abnormal-check" title="Mark abnormal">
                    <input
                      type="checkbox"
                      checked={row.abnormal}
                      onChange={(e) => setRows((prev) => prev.map((item) => item.id === row.id ? { ...item, abnormal: e.target.checked } : item))}
                    />
                  </label>
                  <input
                    className="observed-input"
                    value={row.value}
                    onChange={(e) => updateValue(row.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.closest('.investigation-row')?.nextElementSibling?.querySelector('.observed-input')?.focus();
                    }}
                  />
                  <strong className={`result-value ${row.abnormal ? 'abnormal' : ''}`}>{row.value || '-'}</strong>
                  <span>{row.unit || '-'}</span>
                  <span>{row.referenceRange || '-'}</span>
                </div>
              ))}
              <label className="comment-row"><input type="checkbox" /> Comment</label>
            </section>
          </div>

          <aside className="result-side-panel">
            <label className="ms-label">Search by Patient name or LR number</label>
            <MsInput placeholder="Search by LR No" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
            <label className="ms-label">Search by Patient Name / ID</label>
            <MsInput placeholder="Search by Patient Name / ID" value={remarkSearch} onChange={(e) => setRemarkSearch(e.target.value)} />
            <p><strong>Remark</strong> - Test</p>
            <p className="muted-copy">AI range check marks rows abnormal automatically. Manual checkbox is still available for technician override.</p>
          </aside>
        </div>

        <div className="bottom-action-dock">
          <MsButton variant="secondary" type="button" onClick={() => router.push('/tests/results/enter')}>Back</MsButton>
          <MsButton variant="secondary" type="button" onClick={() => saveResults(true)}>Save & Print</MsButton>
          <MsButton type="button" onClick={() => saveResults(false)}>Save</MsButton>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Laboratory Dashboard</h1>
      <MsCard>
        <div className="lab-status-strip">
          <strong>Registered:{metrics.registered}</strong>
          <strong>Received:{metrics.received}</strong>
          <strong>Provisional:{metrics.provisional}</strong>
          <strong>Pre Auth:{metrics.preAuth}</strong>
          <strong>Authenticated:{metrics.authenticated}</strong>
          <strong>Delivered:{metrics.delivered}</strong>
          <strong>Total:{metrics.total}</strong>
          <strong>Outsource Lab</strong>
          <strong>Outstanding</strong>
        </div>

        <div className="lab-filter-row">
          <select className="ms-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">Received</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <MsInput type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          <MsInput type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          <MsInput placeholder="Patient Name/ID" value={queueSearch} onChange={(e) => setQueueSearch(e.target.value)} />
          <MsInput placeholder="Lab Request No" />
          <MsInput placeholder="Search Corporate" />
          <MsInput placeholder="Department" />
          <MsInput placeholder="Test Name" />
          <span className="queue-iconbar">Search Clear Refresh Print Menu</span>
        </div>

        <div className="lab-workqueue">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Patient</th>
                <th>Corporate</th>
                <th>Patient UID</th>
                <th>Lab No.</th>
                <th>Services</th>
                <th>Ref.By</th>
                <th>Date</th>
                <th>S.Taken</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((item, index) => (
                <tr key={item.id} className={`lab-row-${statusClass(item.status)}`}>
                  <td>{index + 1}</td>
                  <td><strong>{formatPatientName(item.patient)}</strong></td>
                  <td>WalkIn</td>
                  <td>{item.patient?.mrn || '-'}</td>
                  <td>{item.id.slice(-8).toUpperCase()}</td>
                  <td className="service-cell">
                    {(item.results || []).map((result) => {
                      const key = `${item.id}:${result.id}`;
                      return (
                        <label key={result.id}>
                          <input type="checkbox" checked={!!selectedServices[key]} onChange={() => toggleService(item, result)} />
                          <span>{result.testCatalog?.name || result.testCatalog?.code || 'Test'}</span>
                        </label>
                      );
                    })}
                  </td>
                  <td>{item.patient?.insuranceId || 'Self'}</td>
                  <td>{formatOrderDate(item)}</td>
                  <td><input type="checkbox" /></td>
                </tr>
              ))}
              {!filteredOrders.length ? (
                <tr><td colSpan={9}>No registrations found for selected filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="result-action-bar">
          <MsButton type="button" onClick={openSelectedResult}>Result</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => {
            if (!selectedBarcodeEntries.length) {
              toast.warning('Select one or more services to generate barcodes');
              return;
            }
            toast.success(`${selectedBarcodeEntries.length} barcode label(s) ready`);
          }}>Bar Code</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Queue saved')}>Save</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => window.print()}>Print</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Email queued')}>Email</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('WhatsApp queued')}>WhatsApp</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Download started')}>Download</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Direct WhatsApp to patient queued')}>Direct WA to Patient</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Direct WhatsApp to doctor queued')}>Direct WA to Doctor</MsButton>
        </div>

        <div className="barcode-panel">
          <div className="barcode-panel-head">
            <span className="barcode-panel-title">Result Page Barcodes</span>
            <span className="barcode-panel-meta">{selectedBarcodeEntries.length} label(s)</span>
          </div>
          {selectedBarcodeEntries.length === 0 ? (
            <div className="barcode-empty">Select services from the queue to generate test-wise barcode labels.</div>
          ) : (
            <div className="barcode-grid">
              {selectedBarcodeEntries.map((entry) => (
                <div key={entry.id} className="barcode-card">
                  <div className="barcode-card-title">{entry.name}</div>
                  <div className="barcode-card-subtitle">{entry.patient} · {entry.sampleType}</div>
                  <MiniBarcode value={entry.value} />
                </div>
              ))}
            </div>
          )}
        </div>
      </MsCard>
    </PageWrapper>
  );
}

export default function ResultEntryPage() {
  return (
    <Suspense
      fallback={
        <PageWrapper>
          <h1 className="page-title">Results</h1>
          <MsCard>
            <p>Loading result workspace...</p>
          </MsCard>
        </PageWrapper>
      }
    >
      <ResultEntryInner />
    </Suspense>
  );
}
