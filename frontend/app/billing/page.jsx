'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import MsBadge from '@/components/ui/MsBadge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function BillingPage() {
  const [orderIdParam, setOrderIdParam] = useState('');
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [sortKey, setSortKey] = useState('id');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [form, setForm] = useState({
    invoiceId: '',
    mode: 'UPI',
    amount: '',
    txRef: '',
    status: 'PAID',
    receiptDelivery: { whatsapp: true, email: false }
  });

  async function load() {
    try {
      const data = await api.get('/api/billing/invoices?page=1&pageSize=200');
      const rows = data.data || [];
      setInvoices(rows);
      if (!form.invoiceId) {
        const preferred = rows.find((r) => r.orderId === orderIdParam) || rows[0];
        if (preferred) {
          setForm((prev) => ({
            ...prev,
            invoiceId: preferred.id,
            amount: String(Number(preferred.total || 0).toFixed(2))
          }));
        }
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load invoices');
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const orderId = new URLSearchParams(window.location.search).get('orderId') || '';
      setOrderIdParam(orderId);
    }
  }, []);

  useEffect(() => {
    load();
  }, [orderIdParam]);

  async function submitPayment(e) {
    e.preventDefault();
    try {
      const delivery = Object.entries(form.receiptDelivery)
        .filter(([, v]) => v)
        .map(([k]) => k.toUpperCase());
      await api.post('/api/billing/payments', {
        invoiceId: form.invoiceId,
        mode: form.mode,
        amount: Number(form.amount),
        txRef: form.txRef,
        status: form.status,
        receiptDelivery: delivery
      });
      toast.success('Payment recorded');
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Payment failed');
    }
  }

  const filtered = useMemo(() => {
    let rows = [...invoices];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q));
    }
    if (date) {
      rows = rows.filter((r) => new Date(r.createdAt).toISOString().slice(0, 10) === date);
    }
    rows.sort((a, b) => {
      const av = a?.[sortKey] ?? '';
      const bv = b?.[sortKey] ?? '';
      if (typeof av === 'number' || typeof bv === 'number') return Number(av) - Number(bv);
      return String(av).localeCompare(String(bv));
    });
    return rows;
  }, [invoices, query, date, sortKey]);

  const selectedInvoice = invoices.find((x) => x.id === form.invoiceId);
  const due = Math.max(Number(selectedInvoice?.total || 0) - Number(form.amount || 0), 0);

  return (
    <PageWrapper>
      <h1 className="page-title">Billing</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Record Payment">
            <form onSubmit={submitPayment} className="ms-form-grid">
              <div className="span-6">
                <label className="ms-label">Invoice *</label>
                <select className="ms-select" value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
                  <option value="">Select invoice</option>
                  {invoices.map((i) => (
                    <option key={i.id} value={i.id}>{i.id} (Due {Number(i.total).toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div className="span-6">
                <label className="ms-label">Mode</label>
                <select className="ms-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                  <option>UPI</option>
                  <option>CASH</option>
                  <option>CARD</option>
                  <option>NET_BANKING</option>
                </select>
              </div>
              <div className="span-3"><MsInput label="Amount *" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div className="span-3"><MsInput label="TXN Ref" value={form.txRef} onChange={(e) => setForm({ ...form, txRef: e.target.value })} /></div>
              <div className="span-3">
                <label className="ms-label">Payment Status</label>
                <div className="radio-row">
                  <label><input type="radio" checked={form.status === 'PAID'} onChange={() => setForm({ ...form, status: 'PAID' })} /> Paid</label>
                  <label><input type="radio" checked={form.status === 'PENDING'} onChange={() => setForm({ ...form, status: 'PENDING' })} /> Unpaid</label>
                </div>
              </div>
              <div className="span-3">
                <label className="ms-label">Receipt Delivery</label>
                <div className="check-row">
                  <label><input type="checkbox" checked={form.receiptDelivery.whatsapp} onChange={(e) => setForm({ ...form, receiptDelivery: { ...form.receiptDelivery, whatsapp: e.target.checked } })} /> WhatsApp</label>
                  <label><input type="checkbox" checked={form.receiptDelivery.email} onChange={(e) => setForm({ ...form, receiptDelivery: { ...form.receiptDelivery, email: e.target.checked } })} /> Email</label>
                </div>
              </div>
              <div className="span-12">
                <div className="summary-box">
                  <div>Subtotal: {Number(selectedInvoice?.subtotal || 0).toFixed(2)}</div>
                  <div>Tax: {Number(selectedInvoice?.taxAmount || 0).toFixed(2)}</div>
                  <div>Total: {Number(selectedInvoice?.total || 0).toFixed(2)}</div>
                  <div>Due after payment: {due.toFixed(2)}</div>
                </div>
              </div>
              <div className="span-12">
                <div className="ms-actions">
                  <MsButton type="submit">Record Payment</MsButton>
                  <MsButton type="button" variant="secondary" onClick={() => setForm({ ...form, amount: '', txRef: '' })}>Cancel</MsButton>
                </div>
              </div>
            </form>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Invoices">
            <div className="filter-grid" style={{ gridTemplateColumns: '1.2fr 1.2fr 56px' }}>
              <MsInput label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
              <MsInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className="icon-btn" title="Reload" onClick={load}>📅</button>
            </div>
            <div style={{ marginTop: 16 }}>
              <MsTable
                columns={[
                  { key: 'id', label: 'Invoice' },
                  { key: 'orderId', label: 'Order' },
                  { key: 'total', label: 'Total', render: (r) => Number(r.total).toFixed(2) },
                  { key: 'statusPaid', label: 'Paid', render: (r) => (r.status === 'PAID' ? Number(r.total).toFixed(2) : '0.00') },
                  { key: 'due', label: 'Due', render: (r) => (r.status === 'PAID' ? '0.00' : Number(r.total).toFixed(2)) },
                  { key: 'status', label: 'Status', render: (r) => <MsBadge status={r.status} /> }
                ]}
                rows={filtered}
                onSort={setSortKey}
                sortKey={sortKey}
                paginationLabel={`Invoices: ${filtered.length}`}
              />
            </div>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
