'use client';

import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

const emptyAnalyzer = {
  name: '',
  model: '',
  manufacturer: '',
  protocol: 'HL7',
  ipAddress: '',
  port: 5000
};

const emptyMap = {
  analyzerId: '',
  machineParamName: '',
  testCatalogId: '',
  transformFormula: ''
};

export default function AnalyzersPage() {
  const [analyzers, setAnalyzers] = useState([]);
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(emptyAnalyzer);
  const [mapping, setMapping] = useState(emptyMap);
  const toast = useToast();

  async function load() {
    try {
      const [a, t] = await Promise.all([api.get('/api/analyzers?page=1&pageSize=100'), api.get('/api/tests/catalog?page=1&pageSize=200')]);
      setAnalyzers(a.data || []);
      setTests(t.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load analyzers');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAnalyzer(e) {
    e.preventDefault();
    try {
      await api.post('/api/analyzers', form);
      setForm(emptyAnalyzer);
      toast.success('Analyzer registered');
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Failed to register analyzer');
    }
  }

  async function addMapping(e) {
    e.preventDefault();
    try {
      await api.post('/api/analyzers/mapping', mapping);
      setMapping(emptyMap);
      toast.success('Analyzer mapping saved');
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Failed to save analyzer mapping');
    }
  }

  async function runTestConnection(id) {
    try {
      const result = await api.post(`/api/analyzers/${id}/test-connection`, {});
      if (result.reachable) toast.success(result.message || 'Analyzer reachable');
      else toast.warning(result.message || 'Analyzer not reachable');
      await load();
    } catch (e) {
      toast.error(e.message || 'Connection test failed');
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Analyzer Management</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Registered Analyzers">
            <MsTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'model', label: 'Model' },
                { key: 'manufacturer', label: 'Manufacturer' },
                { key: 'protocol', label: 'Protocol' },
                { key: 'ipAddress', label: 'IP' },
                { key: 'port', label: 'Port' },
                { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE') },
                { key: 'actions', label: 'Action', render: (row) => <MsButton variant="secondary" onClick={() => runTestConnection(row.id)}>Test</MsButton> }
              ]}
              rows={analyzers}
              paginationLabel={`Rows: ${analyzers.length}`}
            />
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="Register Analyzer">
            <form onSubmit={createAnalyzer} className="grid-12">
              <div className="span-6"><MsInput label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Model" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Manufacturer" required value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
              <div className="span-6">
                <label className="ms-label">Protocol</label>
                <select className="ms-select" value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
                  <option value="HL7">HL7</option>
                  <option value="ASTM">ASTM</option>
                  <option value="VENDOR">VENDOR</option>
                </select>
              </div>
              <div className="span-6"><MsInput label="IP Address" required value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Port" required type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} /></div>
              <div className="span-12">
                <div className="ms-actions">
                  <MsButton type="submit">Save Analyzer</MsButton>
                </div>
              </div>
            </form>
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="Analyzer Mapping">
            <form onSubmit={addMapping} className="grid-12">
              <div className="span-12">
                <label className="ms-label">Analyzer</label>
                <select className="ms-select" value={mapping.analyzerId} onChange={(e) => setMapping({ ...mapping, analyzerId: e.target.value })}>
                  <option value="">Select Analyzer</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.model})
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-6"><MsInput label="Machine Param Name" required value={mapping.machineParamName} onChange={(e) => setMapping({ ...mapping, machineParamName: e.target.value })} /></div>
              <div className="span-6">
                <label className="ms-label">Mapped Test</label>
                <select className="ms-select" value={mapping.testCatalogId} onChange={(e) => setMapping({ ...mapping, testCatalogId: e.target.value })}>
                  <option value="">Select Test</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} - {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-12"><MsInput label="Transform Formula (optional)" value={mapping.transformFormula} onChange={(e) => setMapping({ ...mapping, transformFormula: e.target.value })} /></div>
              <div className="span-12">
                <div className="ms-actions">
                  <MsButton type="submit">Save Mapping</MsButton>
                </div>
              </div>
            </form>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
