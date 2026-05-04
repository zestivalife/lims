'use client';

import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

const emptyUser = { email: '', phone: '', password: '', role: 'TECHNICIAN' };

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [filters, setFilters] = useState({ userId: '', action: '' });
  const toast = useToast();

  async function load() {
    try {
      const [u, a, i, s] = await Promise.all([
        api.get('/api/users?page=1&pageSize=50'),
        api.get('/api/compliance/audit-log?page=1&pageSize=50'),
        api.get('/api/billing/invoices?page=1&pageSize=50'),
        api.get('/api/billing/summary')
      ]);
      setUsers(u.data || []);
      setAuditLogs(a.data || []);
      setInvoices(i.data || []);
      setSummary(s);
    } catch (e) {
      toast.error(e.message || 'Failed to load admin data');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.post('/api/users', userForm);
      setUserForm(emptyUser);
      toast.success('User added successfully');
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Failed to add user');
    }
  }

  async function deactivate(id) {
    try {
      await api.del(`/api/users/${id}`);
      toast.success('User deactivated');
      await load();
    } catch (e) {
      toast.error(e.message || 'Failed to deactivate user');
    }
  }

  async function loadFilteredAudit() {
    try {
      const data = await api.get(
        `/api/compliance/audit-log?page=1&pageSize=50&userId=${encodeURIComponent(filters.userId)}&action=${encodeURIComponent(filters.action)}`
      );
      setAuditLogs(data.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load filtered audit logs');
    }
  }

  async function generateCompliance() {
    try {
      const data = await api.get('/api/compliance/report');
      setCompliance(data);
      toast.success('Compliance report generated');
    } catch (e) {
      toast.error(e.message || 'Failed to generate compliance report');
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Admin Panel</h1>

      <div className="grid-12">
        <div className="span-6">
          <MsCard title="User Management">
            <form onSubmit={createUser} className="grid-12">
              <div className="span-6"><MsInput label="Email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Phone" required value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Password" required type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
              <div className="span-6">
                <label className="ms-label">Role</label>
                <select className="ms-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="ADMIN">Admin</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="PATHOLOGIST">Pathologist</option>
                  <option value="RECEPTION">Reception</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>
              <div className="span-12">
                <div className="ms-actions">
                  <MsButton type="submit">Add User</MsButton>
                </div>
              </div>
            </form>

            <div style={{ marginTop: 16 }}>
              <MsTable
                columns={[
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Role' },
                  { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
                  { key: 'lastLogin', label: 'Last Login', render: (row) => (row.lastLogin ? new Date(row.lastLogin).toLocaleString() : 'Never') },
                  { key: 'actions', label: 'Actions', render: (row) => <MsButton variant="danger" onClick={() => deactivate(row.id)}>Deactivate</MsButton> }
                ]}
                rows={users}
                paginationLabel={`Users: ${users.length}`}
              />
            </div>
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="Audit Log Viewer">
            <div className="filter-grid" style={{ marginBottom: 16 }}>
              <MsInput label="User ID" value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} />
              <MsInput label="Action Contains" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
              <MsButton onClick={loadFilteredAudit}>Filter</MsButton>
            </div>
            <MsTable
              columns={[
                { key: 'timestamp', label: 'Timestamp', render: (row) => new Date(row.timestamp).toLocaleString() },
                { key: 'action', label: 'Action' },
                { key: 'entityType', label: 'Entity' },
                { key: 'entityId', label: 'Entity ID' }
              ]}
              rows={auditLogs}
              paginationLabel={`Audit rows: ${auditLogs.length}`}
            />
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="Compliance Report">
            <div style={{ display: 'grid', gap: 12 }}>
              <MsButton onClick={generateCompliance}>Generate Compliance Summary</MsButton>
              {compliance?.summary && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: 12 }}>
                  <div><strong>Tenant:</strong> {compliance.summary.tenantName}</div>
                  <div><strong>Region:</strong> {compliance.summary.region.countryName}</div>
                  <div><strong>Audit Logs:</strong> {compliance.summary.auditLogs}</div>
                  <div><strong>Consent Logs:</strong> {compliance.summary.consentLogs}</div>
                  <div><strong>Pending Unsigned Reports:</strong> {compliance.summary.pendingUnsignedReports}</div>
                  <div><strong>Critical Results (7 days):</strong> {compliance.summary.criticalResults}</div>
                  <a href={compliance.pdfUrl} target="_blank" rel="noreferrer">
                    Open Compliance PDF
                  </a>
                </div>
              )}
            </div>
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="Billing Summary">
            {summary && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div><strong>Tax Type:</strong> {summary.taxType}</div>
                <div><strong>Tax Rate:</strong> {summary.taxRate}%</div>
                <div><strong>Currency:</strong> {summary.currency}</div>
                <div><strong>Subtotal:</strong> {summary.subtotal.toFixed(2)}</div>
                <div><strong>Tax Amount:</strong> {summary.tax.toFixed(2)}</div>
                <div><strong>Total:</strong> {summary.total.toFixed(2)}</div>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <MsTable
                columns={[
                  { key: 'id', label: 'Invoice ID' },
                  { key: 'status', label: 'Status' },
                  { key: 'subtotal', label: 'Subtotal', render: (row) => Number(row.subtotal).toFixed(2) },
                  { key: 'taxAmount', label: 'Tax', render: (row) => Number(row.taxAmount).toFixed(2) },
                  { key: 'total', label: 'Total', render: (row) => Number(row.total).toFixed(2) }
                ]}
                rows={invoices}
                paginationLabel={`Invoices: ${invoices.length}`}
              />
            </div>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
