'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsModal from '@/components/ui/MsModal';
import { api } from '@/lib/api';
import { getParametersForTest, isValueAbnormal } from '@/lib/testParameters';
import { useToast } from '@/components/ui/ToastProvider';

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function reportHeaderMarkup(order) {
  const patientName = formatPatientName(order?.patient);
  const gender = order?.patient?.gender || '-';
  const reportedOn = formatOrderDate(order) || '-';
  return `
    <section class="report-header-card">
      <div class="report-header-grid">
        <div class="report-header-meta">
          <div><strong>Name</strong><span>${escapeHtml(patientName)}</span></div>
          <div><strong>Age/Sex</strong><span>${escapeHtml(gender)}</span></div>
          <div><strong>Patient ID</strong><span>${escapeHtml(order?.patient?.mrn || '-')}</span></div>
          <div><strong>Reg No</strong><span>${escapeHtml(order?.id?.slice(-8).toUpperCase() || '-')}</span></div>
          <div><strong>Ref. By</strong><span>${escapeHtml(order?.patient?.insuranceId || 'Self')}</span></div>
        </div>
        <div class="report-header-dates">
          <div><strong>Registered on</strong><span>${escapeHtml(reportedOn)}</span></div>
          <div><strong>Received on</strong><span>${escapeHtml(reportedOn)}</span></div>
          <div><strong>Reported on</strong><span>${escapeHtml(reportedOn)}</span></div>
        </div>
      </div>
    </section>
  `;
}

function reportSectionMarkup(sectionTitle, rows) {
  return `
    <section class="report-section">
      <h2>${escapeHtml(sectionTitle)}</h2>
      <table class="report-table">
        <thead>
          <tr>
            <th>Test Description</th>
            <th>Result</th>
            <th>Unit</th>
            <th>Biological Reference Range</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td class="test-name ${row.abnormal ? 'abnormal' : ''}">${escapeHtml(row.investigation)}</td>
              <td class="${row.abnormal ? 'abnormal' : ''}">${escapeHtml(row.value || '-')}</td>
              <td>${escapeHtml(row.unit || '-')}</td>
              <td>${escapeHtml(row.referenceRange || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

function barcodeSvgMarkup(value) {
  const raw = String(value || '').trim() || 'LIMS';
  const start = [1, 1, 0, 1, 0, 0, 1, 1];
  const end = [1, 1, 0, 0, 1, 0, 1, 1];
  const body = raw
    .split('')
    .flatMap((char) => {
      const bin = char.charCodeAt(0).toString(2).padStart(8, '0').split('').map(Number);
      return [0, ...bin, 1];
    });
  const bars = [...start, ...body, ...end];
  const width = Math.max(bars.length * 2, 120);
  return `
    <svg viewBox="0 0 ${width} 42" preserveAspectRatio="none" role="img" aria-label="Barcode ${escapeHtml(value)}">
      <rect x="0" y="0" width="${width}" height="42" fill="white"></rect>
      ${bars.map((bar, index) => (bar ? `<rect x="${index * 2}" y="2" width="2" height="30" fill="#111111"></rect>` : '')).join('')}
    </svg>
  `;
}

function buildPanelRows(result) {
  const testName = result?.testCatalog?.name || result?.testCatalog?.code || 'Test';
  const fallbackRange =
    result?.referenceRange || result?.testCatalog?.normalRangeMale || result?.testCatalog?.normalRangeFemale || '';
  const fallbackUnit = result?.unit || result?.testCatalog?.unit || '';
  const templates = getParametersForTest(testName);
  const hasPanelTemplate =
    templates.length > 1 || (templates.length === 1 && templates[0].name.toLowerCase() !== testName.toLowerCase());

  if (!hasPanelTemplate) {
    return [
      {
        id: result?.id || `${panelSlug(testName)}-0`,
        sourceResultId: result?.id || null,
        investigation: testName,
        value: result?.value || '',
        unit: fallbackUnit,
        referenceRange: fallbackRange,
        abnormal: isValueAbnormal(result?.value, fallbackRange)
      }
    ];
  }

  return templates.map((item, index) => ({
    id: `${result?.id || panelSlug(testName)}-${index}`,
    sourceResultId: index === 0 ? result?.id || null : null,
    investigation: item.name,
    value: index === 0 ? result?.value || '' : '',
    unit: item.unit || fallbackUnit,
    referenceRange: item.range || fallbackRange,
    abnormal: isValueAbnormal(index === 0 ? result?.value || '' : '', item.range || fallbackRange)
  }));
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
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortMode, setSortMode] = useState('LATEST');
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [order, setOrder] = useState(null);
  const [rows, setRows] = useState([]);
  const [authChecked, setAuthChecked] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const [remarkSearch, setRemarkSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);

  async function loadQueue() {
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (queueSearch.trim()) params.set('q', queueSearch.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (departmentFilter !== 'ALL') params.set('department', departmentFilter);
      if (quickFilter !== 'ALL') params.set('quickFilter', quickFilter);
      if (sortMode !== 'LATEST') params.set('sort', sortMode);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const data = await api.get(`/api/tests/orders?${params.toString()}`);
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
      const parameterRows = selected ? buildPanelRows(selected) : [];
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
  }, [queueSearch, statusFilter, priorityFilter, departmentFilter, quickFilter, sortMode, dateFrom, dateTo]);

  useEffect(() => {
    if (orderId) loadOrder(orderId);
  }, [orderId, testId]);

  const filteredOrders = orders;

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          orders.flatMap((item) =>
            (item.results || []).map((result) => result.testCatalog?.category).filter(Boolean)
          )
        )
      ).sort(),
    [orders]
  );

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

  const selectedQueueServices = useMemo(() => {
    return Object.entries(selectedServices)
      .filter(([, checked]) => checked)
      .map(([key]) => {
        const [selectedOrderId, selectedResultId] = key.split(':');
        const selectedOrder = orders.find((item) => item.id === selectedOrderId);
        const selectedResult = selectedOrder?.results?.find((item) => item.id === selectedResultId);
        return selectedOrder && selectedResult ? { order: selectedOrder, result: selectedResult } : null;
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

  async function markSelectedSamplesReceived() {
    const orderIds = [...new Set(selectedQueueServices.map((entry) => entry.order.id))];
    if (!orderIds.length) {
      toast.warning('Select one or more services first');
      return;
    }
    try {
      await Promise.all(
        orderIds.map((id) => api.put(`/api/tests/orders/${id}/status`, { status: 'IN_PROGRESS' }))
      );
      toast.success('Selected samples marked as received');
      setSelectedServices({});
      await loadQueue();
    } catch (error) {
      toast.error(error.message || 'Failed to update selected samples');
    }
  }

  function buildReportRows(result) {
    return buildPanelRows(result).map((row) => ({
      investigation: row.investigation,
      value: row.value,
      unit: row.unit,
      referenceRange: row.referenceRange,
      abnormal: row.abnormal
    }));
  }

  function openPrintWindow(title, bodyMarkup) {
    const popup = window.open('', '_blank', 'width=1100,height=900');
    if (!popup) {
      toast.error('Enable popups to print this document');
      return;
    }
    popup.document.write(`
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #111827; }
            .report-page { page-break-after: always; margin-bottom: 24px; }
            .report-page:last-child { page-break-after: auto; }
            .report-header-card { border: 2px solid #111827; border-radius: 16px; padding: 20px 24px; margin-bottom: 18px; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12); }
            .report-header-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; }
            .report-header-meta div, .report-header-dates div { display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 10px; }
            .report-section h2 { margin: 18px 0 12px; text-align: center; font-size: 28px; text-transform: uppercase; text-decoration: underline; }
            .report-table { width: 100%; border-collapse: collapse; font-size: 15px; }
            .report-table th { padding: 12px; border: 2px solid #111827; background: #eef6ff; text-align: left; }
            .report-table td { padding: 10px 12px; border-bottom: 1px solid #d1d5db; vertical-align: top; }
            .test-name { font-weight: 600; }
            .abnormal { color: #dc2626; font-weight: 700; }
            .barcode-print-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
            .barcode-print-card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 18px; }
            .barcode-print-card svg { width: 100%; height: 52px; display: block; }
            .barcode-print-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
            .barcode-print-subtitle { font-size: 13px; color: #475569; margin-bottom: 10px; }
            .barcode-print-text { text-align: center; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 0.16em; margin-top: 8px; }
            @media print { body { margin: 12px; } }
          </style>
        </head>
        <body>${bodyMarkup}</body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }

  function printSelectedQueueReports() {
    if (!selectedQueueServices.length) {
      toast.warning('Select one or more services to print');
      return;
    }
    const grouped = selectedQueueServices.reduce((acc, entry) => {
      if (!acc[entry.order.id]) acc[entry.order.id] = { order: entry.order, sections: [] };
      acc[entry.order.id].sections.push({
        title: entry.result.testCatalog?.name || entry.result.testCatalog?.code || 'Test',
        rows: buildReportRows(entry.result)
      });
      return acc;
    }, {});
    const markup = Object.values(grouped).map(({ order, sections }) => `
      <div class="report-page">
        ${reportHeaderMarkup(order)}
        ${sections.map((section) => reportSectionMarkup(section.title, section.rows)).join('')}
      </div>
    `).join('');
    openPrintWindow('Result Report', markup);
  }

  function printCurrentDetailedReport() {
    if (!order || !rows.length) {
      toast.warning('No report rows available to print');
      return;
    }
    const title = order?.results?.find((item) => item.id === testId)?.testCatalog?.name || rows[0]?.investigation || 'Result Report';
    openPrintWindow('Result Report', `
      <div class="report-page">
        ${reportHeaderMarkup(order)}
        ${reportSectionMarkup(title, rows)}
      </div>
    `);
  }

  function openBarcodePopup() {
    if (!selectedBarcodeEntries.length) {
      toast.warning('Select one or more services to generate barcodes');
      return;
    }
    setBarcodeModalOpen(true);
  }

  function printBarcodePopup() {
    if (!selectedBarcodeEntries.length) {
      toast.warning('No barcode labels available to print');
      return;
    }
    const markup = `
      <div class="report-page">
        <div class="barcode-print-grid">
          ${selectedBarcodeEntries.map((entry) => `
            <div class="barcode-print-card">
              <div class="barcode-print-title">${escapeHtml(entry.name)}</div>
              <div class="barcode-print-subtitle">${escapeHtml(entry.patient)} · ${escapeHtml(entry.sampleType)}</div>
              ${barcodeSvgMarkup(entry.value)}
              <div class="barcode-print-text">${escapeHtml(entry.value)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    openPrintWindow('Barcode Labels', markup);
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
      const autoAbnormal = isValueAbnormal(value, row.referenceRange);
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
      if (printAfter) printCurrentDetailedReport();
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
          <select className="ms-select" value={quickFilter} onChange={(e) => setQuickFilter(e.target.value)}>
            <option value="ALL">All queues</option>
            <option value="pending_collection">Pending collection</option>
            <option value="pending_result_entry">Pending result entry</option>
            <option value="pending_authentication">Pending authentication</option>
            <option value="pending_delivery">Pending delivery</option>
          </select>
          <select className="ms-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">Received</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select className="ms-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="ALL">All priorities</option>
            <option value="ROUTINE">Routine</option>
            <option value="URGENT">Urgent</option>
            <option value="STAT">STAT</option>
          </select>
          <select className="ms-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="ALL">All departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
          <select className="ms-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="LATEST">Latest first</option>
            <option value="FIFO">FIFO</option>
            <option value="PRIORITY">Priority first</option>
          </select>
          <MsInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <MsInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <MsInput placeholder="Patient Name/ID" value={queueSearch} onChange={(e) => setQueueSearch(e.target.value)} />
          <span className="queue-iconbar">Search • Queue • Print</span>
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
                <th>
                  <div className="service-head">
                    <span>Services</span>
                    <button type="button" className="icon-btn service-barcode-trigger" title="Generate barcode" onClick={openBarcodePopup}>
                      ▥
                    </button>
                  </div>
                </th>
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
                  <td>
                    <div className="queue-refby-stack">
                      <span>{item.patient?.insuranceId || 'Self'}</span>
                      <span className={`ms-badge ${item.priority === 'STAT' ? 'danger' : item.priority === 'URGENT' ? 'warning' : 'pending'}`}>
                        {item.priority || 'ROUTINE'}
                      </span>
                    </div>
                  </td>
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
          <MsButton type="button" variant="secondary" onClick={openBarcodePopup}>Bar Code</MsButton>
          <MsButton type="button" variant="secondary" onClick={markSelectedSamplesReceived}>Mark Received</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Queue saved')}>Save</MsButton>
          <MsButton type="button" variant="secondary" onClick={printSelectedQueueReports}>Print</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Email queued')}>Email</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('WhatsApp queued')}>WhatsApp</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Download started')}>Download</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Direct WhatsApp to patient queued')}>Direct WA to Patient</MsButton>
          <MsButton type="button" variant="secondary" onClick={() => toast.success('Direct WhatsApp to doctor queued')}>Direct WA to Doctor</MsButton>
        </div>

        <MsModal open={barcodeModalOpen} title="Service Barcodes" onClose={() => setBarcodeModalOpen(false)}>
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
          <div className="ms-actions" style={{ marginTop: 16 }}>
            <MsButton variant="secondary" type="button" onClick={() => setBarcodeModalOpen(false)}>Close</MsButton>
            <MsButton type="button" onClick={printBarcodePopup}>Print</MsButton>
          </div>
        </MsModal>
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
