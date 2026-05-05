'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { bootstrapCatalogIfEmpty } from '@/lib/demoCatalog';
import { useToast } from '@/components/ui/ToastProvider';

const machineApiCatalog = [
  { name: 'HL7 v2.x', type: 'Protocol', direction: 'Bi-directional', status: 'Enabled' },
  { name: 'ASTM E1381', type: 'Protocol', direction: 'Bi-directional', status: 'Enabled' },
  { name: 'CSV Bridge', type: 'Import API', direction: 'Inbound', status: 'Enabled' },
  { name: 'Order Dispatch API', type: 'Dispatch', direction: 'Outbound', status: 'Enabled' },
  { name: 'Code Mapping API', type: 'Mapper', direction: 'Internal', status: 'Enabled' },
  { name: 'Message Logging API', type: 'Audit', direction: 'Internal', status: 'Enabled' }
];

const emptyAnalyzer = {
  code: '',
  name: '',
  manufacturer: '',
  model: '',
  protocol: 'HL7',
  direction: 'BIDIRECTIONAL',
  ipAddress: '',
  port: 5000
};

const emptyMap = {
  analyzerId: '',
  machineParamName: '',
  testCatalogId: '',
  defaultUnit: '',
  defaultRange: '',
  transformFormula: ''
};

export default function AnalyzersPage() {
  const [analyzers, setAnalyzers] = useState([]);
  const [tests, setTests] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [messageLogs, setMessageLogs] = useState([]);

  const [analyzerForm, setAnalyzerForm] = useState(emptyAnalyzer);
  const [mapForm, setMapForm] = useState(emptyMap);
  const [dispatchForm, setDispatchForm] = useState({ analyzerId: '', orderId: '' });

  const [payloadForms, setPayloadForms] = useState({
    hl7: {
      analyzerId: '',
      orderId: '',
      rawPayload:
        'MSH|^~\\&|ANL|LAB|LIMS|LAB|202604221200||ORU^R01|1|P\nPID|1\nOBR|1|ORD0001\nOBX|1|NM|HGB||12.8|g/dL|13-17|LOW'
    },
    astm: {
      analyzerId: '',
      orderId: '',
      rawPayload: 'O|1|ORD0001\nR|1|^GLU|102|mg/dL|70-110|N'
    },
    csv: {
      analyzerId: '',
      orderId: '',
      rawPayload: 'order_no,machine_test_code,result_value,unit,ref_range\nORD0001,HGB,12.9,g/dL,13-17'
    }
  });

  const toast = useToast();

  async function loadAll() {
    try {
      const [a, t, m, logs] = await Promise.all([
        api.get('/api/analyzers?page=1&pageSize=200'),
        bootstrapCatalogIfEmpty().then((data) => ({ data })),
        api.get('/api/analyzers/mappings?page=1&pageSize=300'),
        api.get('/api/analyzers/message-logs?page=1&pageSize=200')
      ]);
      const analyzersData = a.data || [];
      setAnalyzers(analyzersData);
      setTests(t.data || []);
      setMappings(m.data || []);
      setMessageLogs(logs.data || []);

      const defaultAnalyzerId = analyzersData[0]?.id || '';
      setMapForm((prev) => ({ ...prev, analyzerId: prev.analyzerId || defaultAnalyzerId }));
      setDispatchForm((prev) => ({ ...prev, analyzerId: prev.analyzerId || defaultAnalyzerId }));
      setPayloadForms((prev) => ({
        hl7: { ...prev.hl7, analyzerId: prev.hl7.analyzerId || defaultAnalyzerId },
        astm: { ...prev.astm, analyzerId: prev.astm.analyzerId || defaultAnalyzerId },
        csv: { ...prev.csv, analyzerId: prev.csv.analyzerId || defaultAnalyzerId }
      }));
    } catch (e) {
      toast.error(e.message || 'Failed to load analyzer console');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function registerAnalyzer(e) {
    e.preventDefault();
    try {
      await api.post('/api/analyzers', {
        name: analyzerForm.name,
        model: analyzerForm.model,
        manufacturer: analyzerForm.manufacturer,
        protocol: analyzerForm.protocol,
        ipAddress: analyzerForm.ipAddress,
        port: Number(analyzerForm.port)
      });
      toast.success('Machine API registered');
      setAnalyzerForm(emptyAnalyzer);
      await loadAll();
    } catch (e2) {
      toast.error(e2.message || 'Failed to register machine API');
    }
  }

  async function createMapping(e) {
    e.preventDefault();
    try {
      await api.post('/api/analyzers/mapping', {
        analyzerId: mapForm.analyzerId,
        machineParamName: mapForm.machineParamName,
        testCatalogId: mapForm.testCatalogId,
        transformFormula: mapForm.transformFormula || null
      });
      toast.success('Code mapping created');
      setMapForm((prev) => ({ ...emptyMap, analyzerId: prev.analyzerId }));
      await loadAll();
    } catch (e2) {
      toast.error(e2.message || 'Failed to create mapping');
    }
  }

  async function dispatchOrder(e) {
    e.preventDefault();
    try {
      await api.post('/api/analyzers/dispatch-order', dispatchForm);
      toast.success('Order dispatched to analyzer');
      await loadAll();
    } catch (e2) {
      toast.error(e2.message || 'Dispatch failed');
    }
  }

  async function ingest(type) {
    try {
      const payload = payloadForms[type];
      await api.post(`/api/analyzers/ingest/${type}`, payload);
      toast.success(`${type.toUpperCase()} payload ingested`);
      await loadAll();
    } catch (e) {
      toast.error(e.message || `Failed to ingest ${type.toUpperCase()}`);
    }
  }

  async function testConnection(id) {
    try {
      const result = await api.post(`/api/analyzers/${id}/test-connection`, {});
      if (result.reachable) toast.success('Analyzer reachable');
      else toast.warning('Analyzer not reachable');
      await loadAll();
    } catch (e) {
      toast.error(e.message || 'Connection test failed');
    }
  }

  const mappedRows = useMemo(
    () =>
      mappings.map((m) => ({
        analyzer: m.analyzer?.name || '-',
        machineCode: m.machineParamName,
        limsTest: m.testCatalog?.name || '-',
        unit: m.testCatalog?.unit || '-',
        range: m.testCatalog?.normalRangeMale || '-'
      })),
    [mappings]
  );

  const logRows = useMemo(
    () =>
      messageLogs.map((l) => ({
        analyzer: analyzers.find((a) => a.id === l.entityId)?.name || l.entityId || '-',
        payloadType: l.newValue?.payloadType || '-',
        status: l.newValue?.status || '-',
        error: l.newValue?.error || '-',
        at: new Date(l.timestamp).toLocaleString()
      })),
    [messageLogs, analyzers]
  );

  return (
    <PageWrapper>
      <h1 className="page-title">Analyzers</h1>

      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Analyzer Machine APIs">
            <p style={{ marginTop: 0, color: 'var(--color-muted)' }}>
              Installed integration endpoints: HL7, ASTM, CSV, order dispatch, code mapping, and message logging.
            </p>
            <MsTable
              columns={[
                { key: 'name', label: 'API Name' },
                { key: 'type', label: 'Type' },
                { key: 'direction', label: 'Direction' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <MsBadge status={row.status} />
                }
              ]}
              rows={machineApiCatalog}
              paginationLabel={`Installed APIs: ${machineApiCatalog.length}`}
            />
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Register Machine API">
            <form onSubmit={registerAnalyzer} className="grid-12">
              <div className="span-4"><MsInput label="Analyzer Code" value={analyzerForm.code} onChange={(e) => setAnalyzerForm({ ...analyzerForm, code: e.target.value })} /></div>
              <div className="span-4"><MsInput label="Name" required value={analyzerForm.name} onChange={(e) => setAnalyzerForm({ ...analyzerForm, name: e.target.value })} /></div>
              <div className="span-4"><MsInput label="Vendor" required value={analyzerForm.manufacturer} onChange={(e) => setAnalyzerForm({ ...analyzerForm, manufacturer: e.target.value })} /></div>

              <div className="span-4"><MsInput label="Model" required value={analyzerForm.model} onChange={(e) => setAnalyzerForm({ ...analyzerForm, model: e.target.value })} /></div>
              <div className="span-4">
                <label className="ms-label">Protocol</label>
                <select className="ms-select" value={analyzerForm.protocol} onChange={(e) => setAnalyzerForm({ ...analyzerForm, protocol: e.target.value })}>
                  <option value="HL7">HL7</option>
                  <option value="ASTM">ASTM</option>
                  <option value="VENDOR">CSV</option>
                </select>
              </div>
              <div className="span-4">
                <label className="ms-label">Direction</label>
                <select className="ms-select" value={analyzerForm.direction} onChange={(e) => setAnalyzerForm({ ...analyzerForm, direction: e.target.value })}>
                  <option value="BIDIRECTIONAL">BIDIRECTIONAL</option>
                  <option value="INBOUND">INBOUND</option>
                  <option value="OUTBOUND">OUTBOUND</option>
                </select>
              </div>

              <div className="span-4"><MsInput label="IP" required value={analyzerForm.ipAddress} onChange={(e) => setAnalyzerForm({ ...analyzerForm, ipAddress: e.target.value })} /></div>
              <div className="span-4"><MsInput label="Port" type="number" required value={analyzerForm.port} onChange={(e) => setAnalyzerForm({ ...analyzerForm, port: Number(e.target.value) || 0 })} /></div>
              <div className="span-4 ms-align-end">
                <MsButton type="submit" style={{ width: '100%' }}>Register Machine API</MsButton>
              </div>
            </form>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Machine Test Mapping">
            <form onSubmit={createMapping} className="grid-12">
              <div className="span-4">
                <label className="ms-label">Analyzer</label>
                <select className="ms-select" value={mapForm.analyzerId} onChange={(e) => setMapForm({ ...mapForm, analyzerId: e.target.value })}>
                  <option value="">Select Analyzer</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} - {a.model}</option>
                  ))}
                </select>
              </div>
              <div className="span-4"><MsInput label="Machine Test Code" required value={mapForm.machineParamName} onChange={(e) => setMapForm({ ...mapForm, machineParamName: e.target.value })} /></div>
              <div className="span-4">
                <label className="ms-label">Mapped LIMS Test</label>
                <select className="ms-select" value={mapForm.testCatalogId} onChange={(e) => setMapForm({ ...mapForm, testCatalogId: e.target.value })}>
                  <option value="">Select Test</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                  ))}
                </select>
              </div>

              <div className="span-4"><MsInput label="Default Unit" value={mapForm.defaultUnit} onChange={(e) => setMapForm({ ...mapForm, defaultUnit: e.target.value })} /></div>
              <div className="span-4"><MsInput label="Default Range" value={mapForm.defaultRange} onChange={(e) => setMapForm({ ...mapForm, defaultRange: e.target.value })} /></div>
              <div className="span-4 ms-align-end">
                <MsButton type="submit" style={{ width: '100%' }}>Create Mapping</MsButton>
              </div>
            </form>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Dispatch Order to Analyzer">
            <form onSubmit={dispatchOrder} className="grid-12">
              <div className="span-4">
                <label className="ms-label">Analyzer</label>
                <select className="ms-select" value={dispatchForm.analyzerId} onChange={(e) => setDispatchForm({ ...dispatchForm, analyzerId: e.target.value })}>
                  <option value="">Select Analyzer</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} - {a.model}</option>
                  ))}
                </select>
              </div>
              <div className="span-4"><MsInput label="Order ID" required value={dispatchForm.orderId} onChange={(e) => setDispatchForm({ ...dispatchForm, orderId: e.target.value })} /></div>
              <div className="span-4 ms-align-end"><MsButton type="submit" style={{ width: '100%' }}>Push Order</MsButton></div>
            </form>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Ingest HL7 Payload">
            <div className="grid-12">
              <div className="span-6">
                <label className="ms-label">Analyzer</label>
                <select className="ms-select" value={payloadForms.hl7.analyzerId} onChange={(e) => setPayloadForms((prev) => ({ ...prev, hl7: { ...prev.hl7, analyzerId: e.target.value } }))}>
                  <option value="">Select Analyzer</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} - {a.model}</option>
                  ))}
                </select>
              </div>
              <div className="span-6"><MsInput label="Order ID (optional if in payload)" value={payloadForms.hl7.orderId} onChange={(e) => setPayloadForms((prev) => ({ ...prev, hl7: { ...prev.hl7, orderId: e.target.value } }))} /></div>
              <div className="span-12"><MsInput label="HL7 Raw" as="textarea" value={payloadForms.hl7.rawPayload} onChange={(e) => setPayloadForms((prev) => ({ ...prev, hl7: { ...prev.hl7, rawPayload: e.target.value } }))} /></div>
              <div className="span-4"><MsButton onClick={() => ingest('hl7')} style={{ width: '100%' }}>Ingest HL7</MsButton></div>
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Ingest ASTM Payload">
            <div className="grid-12">
              <div className="span-6">
                <label className="ms-label">Analyzer</label>
                <select className="ms-select" value={payloadForms.astm.analyzerId} onChange={(e) => setPayloadForms((prev) => ({ ...prev, astm: { ...prev.astm, analyzerId: e.target.value } }))}>
                  <option value="">Select Analyzer</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} - {a.model}</option>
                  ))}
                </select>
              </div>
              <div className="span-6"><MsInput label="Order ID (optional if in payload)" value={payloadForms.astm.orderId} onChange={(e) => setPayloadForms((prev) => ({ ...prev, astm: { ...prev.astm, orderId: e.target.value } }))} /></div>
              <div className="span-12"><MsInput label="ASTM Raw" as="textarea" value={payloadForms.astm.rawPayload} onChange={(e) => setPayloadForms((prev) => ({ ...prev, astm: { ...prev.astm, rawPayload: e.target.value } }))} /></div>
              <div className="span-4"><MsButton onClick={() => ingest('astm')} style={{ width: '100%' }}>Ingest ASTM</MsButton></div>
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Ingest CSV Payload">
            <div className="grid-12">
              <div className="span-6">
                <label className="ms-label">Analyzer</label>
                <select className="ms-select" value={payloadForms.csv.analyzerId} onChange={(e) => setPayloadForms((prev) => ({ ...prev, csv: { ...prev.csv, analyzerId: e.target.value } }))}>
                  <option value="">Select Analyzer</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} - {a.model}</option>
                  ))}
                </select>
              </div>
              <div className="span-6"><MsInput label="Order ID (optional if in payload)" value={payloadForms.csv.orderId} onChange={(e) => setPayloadForms((prev) => ({ ...prev, csv: { ...prev.csv, orderId: e.target.value } }))} /></div>
              <div className="span-12"><MsInput label="CSV Raw" as="textarea" value={payloadForms.csv.rawPayload} onChange={(e) => setPayloadForms((prev) => ({ ...prev, csv: { ...prev.csv, rawPayload: e.target.value } }))} /></div>
              <div className="span-4"><MsButton onClick={() => ingest('csv')} style={{ width: '100%' }}>Ingest CSV</MsButton></div>
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Registered Analyzers">
            <MsTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'manufacturer', label: 'Vendor' },
                { key: 'model', label: 'Model' },
                { key: 'protocol', label: 'Protocol' },
                {
                  key: 'isActive',
                  label: 'Status',
                  render: (row) => <MsBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
                },
                { key: 'lastConnectedAt', label: 'Last Seen', render: (row) => (row.lastConnectedAt ? new Date(row.lastConnectedAt).toLocaleString() : '-') },
                {
                  key: 'action',
                  label: 'Action',
                  render: (row) => (
                    <MsButton variant="secondary" onClick={() => testConnection(row.id)}>
                      Test
                    </MsButton>
                  )
                }
              ]}
              rows={analyzers}
              paginationLabel={`Analyzers: ${analyzers.length}`}
            />
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Code Mappings">
            <MsTable
              columns={[
                { key: 'analyzer', label: 'Analyzer' },
                { key: 'machineCode', label: 'Machine Code' },
                { key: 'limsTest', label: 'LIMS Test' },
                { key: 'unit', label: 'Unit' },
                { key: 'range', label: 'Range' }
              ]}
              rows={mappedRows}
              paginationLabel={`Mappings: ${mappedRows.length}`}
            />
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Machine Message Log">
            <MsTable
              columns={[
                { key: 'analyzer', label: 'Analyzer' },
                { key: 'payloadType', label: 'Payload Type' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <MsBadge status={row.status} />
                },
                { key: 'error', label: 'Error' },
                { key: 'at', label: 'At' }
              ]}
              rows={logRows}
              paginationLabel={`Logs: ${logRows.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
