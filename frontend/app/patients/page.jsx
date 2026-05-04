'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

const emptyForm = {
  mrn: '',
  name: '',
  dob: '',
  gender: 'MALE',
  phone: '',
  email: '',
  address: '',
  insuranceId: ''
};

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sortKey, setSortKey] = useState('createdAt');
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await api.get(`/api/patients?q=${encodeURIComponent(query)}&page=1&pageSize=25`);
      setPatients(data.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPatient(e) {
    e.preventDefault();
    try {
      await api.post('/api/patients', form);
      setForm(emptyForm);
      toast.success('Patient registered');
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Failed to create patient');
    }
  }

  const sorted = useMemo(() => {
    return [...patients].sort((a, b) => {
      if (sortKey === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
    });
  }, [patients, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Patients</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Search Patients">
            <div className="filter-grid">
              <MsInput label="Search by MRN or Insurance" value={query} onChange={(e) => setQuery(e.target.value)} />
              <MsButton onClick={load}>{loading ? 'Loading...' : 'Search'}</MsButton>
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Patient List">
            <MsTable
              columns={[
                {
                  key: 'mrn',
                  label: 'MRN',
                  render: (row) => <Link href={`/patients/${row.id}`}>{row.mrn}</Link>
                },
                { key: 'name', label: 'Name' },
                { key: 'gender', label: 'Gender' },
                { key: 'phone', label: 'Phone' },
                { key: 'insuranceId', label: 'Insurance' },
                { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() }
              ]}
              rows={sorted}
              onSort={(key) => setSortKey(key)}
              sortKey={sortKey}
              paginationLabel={`Showing ${sorted.length} patients`}
            />
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Register New Patient">
            <form onSubmit={createPatient} className="grid-12">
              <div className="span-6">
                <MsInput label="MRN" required value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} />
              </div>
              <div className="span-6">
                <MsInput label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="span-6">
                <MsInput label="Date of Birth" required type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="span-6">
                <label className="ms-label">Gender *</label>
                <select className="ms-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="span-6">
                <MsInput label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="span-6">
                <MsInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="span-12">
                <MsInput as="textarea" label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="span-6">
                <MsInput label="Insurance ID" value={form.insuranceId} onChange={(e) => setForm({ ...form, insuranceId: e.target.value })} />
              </div>
              <div className="span-12">
                <div className="ms-actions">
                  <MsButton variant="secondary" onClick={() => setForm(emptyForm)}>
                    Cancel
                  </MsButton>
                  <MsButton type="submit">Save Patient</MsButton>
                </div>
              </div>
            </form>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
