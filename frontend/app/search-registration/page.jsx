'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsBadge from '@/components/ui/MsBadge';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

function mapStatus(status) {
  if (status === 'COMPLETED') return 'PAID';
  if (status === 'IN_PROGRESS') return 'IN_PROCESS';
  return 'BOOKED';
}

function fmtDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function ActionIcon({ href, title, icon, onClick }) {
  const className = 'prominent-icon-btn';

  if (href) {
    return (
      <a className={className} href={href} title={title} aria-label={title}>
        <span>{icon}</span>
      </a>
    );
  }

  return (
    <button type="button" className={className} title={title} aria-label={title} onClick={onClick}>
      <span>{icon}</span>
    </button>
  );
}

export default function SearchRegistrationPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [testSearch, setTestSearch] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  async function loadOrders() {
    try {
      const res = await api.get(`/api/tests/orders?page=1&pageSize=200&q=${encodeURIComponent(query)}`);
      const rows = res.data || [];
      setOrders(rows);
      if (!selectedOrderId && rows[0]) {
        setSelectedOrderId(rows[0].id);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load registrations');
    }
  }

  async function loadCatalog() {
    try {
      const res = await api.get('/api/tests/catalog?page=1&pageSize=300');
      setCatalog(res.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load test catalog');
    }
  }

  useEffect(() => {
    loadOrders();
    loadCatalog();
  }, []);

  useEffect(() => {
    const order = orders.find((row) => row.id === selectedOrderId) || null;
    setSelectedOrder(order);
    setSelectedTests([]);
    setDiscountPct('0');
    setPaymentAmount('0');

    if (!order?.patientId) {
      setHistory([]);
      return;
    }

    api.get(`/api/patients/${order.patientId}/history`)
      .then((res) => setHistory(res.history || res.orders || []))
      .catch(() => setHistory([]));
  }, [selectedOrderId, orders]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((row) => {
      const haystack = [
        row.id,
        row.patient?.mrn,
        row.patient?.name,
        row.patient?.phone,
        ...(row.results || []).map((item) => item.testCatalog?.name)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, query]);

  const availableTests = useMemo(() => {
    const activeIds = new Set((selectedOrder?.results || []).map((item) => item.testCatalogId));
    const stagedIds = new Set(selectedTests.map((item) => item.id));
    const q = testSearch.trim().toLowerCase();

    return catalog.filter((test) => {
      if (activeIds.has(test.id) || stagedIds.has(test.id)) return false;
      if (!q) return true;
      return [test.name, test.code, test.category, test.unit].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [catalog, selectedOrder, selectedTests, testSearch]);

  const subtotal = useMemo(
    () => selectedTests.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [selectedTests]
  );
  const discount = useMemo(() => {
    const pct = Number(discountPct || 0);
    if (Number.isNaN(pct) || pct <= 0) return 0;
    return Math.min(subtotal, (subtotal * pct) / 100);
  }, [discountPct, subtotal]);
  const total = Math.max(0, subtotal - discount);
  const paid = Math.max(0, Number(paymentAmount || 0));
  const balance = Math.max(0, total - paid);

  function stageTest(test) {
    setSelectedTests((prev) => [...prev, test]);
  }

  function removeStagedTest(id) {
    setSelectedTests((prev) => prev.filter((item) => item.id !== id));
  }

  async function raiseInvoice() {
    if (!selectedOrder?.patientId) {
      toast.error('Select a booking first');
      return;
    }
    if (!selectedTests.length) {
      toast.error('Select at least one new test');
      return;
    }
    if (discount > subtotal) {
      toast.error('Discount cannot exceed total');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/api/tests/orders', {
        patientId: selectedOrder.patientId,
        orderedBy: selectedOrder.orderedBy || 'Reception',
        testCatalogIds: selectedTests.map((item) => item.id),
        status: 'PENDING',
        priority: 'ROUTINE'
      });

      toast.success('New tests added and invoice raised');
      await loadOrders();
    } catch (error) {
      toast.error(error.message || 'Failed to add tests');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Search Registration</h1>
      <div className="grid-12 search-registration-layout">
        <div className="span-4">
          <MsCard title="Search Booking">
            <div className="search-booking-toolbar">
              <MsInput label="Search by Date / Name / Mobile / LR" placeholder="Search booking" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="search-booking-actions">
                <MsButton variant="secondary" onClick={loadOrders}>Search</MsButton>
                <MsButton variant="secondary" onClick={() => { setQuery(''); loadOrders(); }}>Reset</MsButton>
              </div>
            </div>

            <div className="search-booking-list">
              <table className="mac-table compact-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((row, index) => {
                    const active = row.id === selectedOrderId;
                    return (
                      <tr key={row.id} className={active ? 'is-selected' : ''}>
                        <td>{index + 1}</td>
                        <td>{row.patient?.name || '-'}</td>
                        <td>{row.patient?.mrn || row.id}</td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="table-actions prominent-actions">
                            <ActionIcon title="View booking" icon="👁" onClick={() => setSelectedOrderId(row.id)} />
                            <ActionIcon title="Edit/Rebook patient" icon="✏️" href={`/new-registration?rebook=${row.patientId}`} />
                            <ActionIcon title="Open billing" icon="🧾" href={`/billing?orderId=${row.id}`} />
                            <ActionIcon title="Open result page" icon="🧪" href={`/result-entry?orderId=${row.id}`} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </MsCard>
        </div>

        <div className="span-8">
          <MsCard title={selectedOrder ? `${selectedOrder.patient?.name || 'Selected Patient'} · UID ${selectedOrder.patient?.mrn || selectedOrder.id}` : 'Select a booking'}>
            {selectedOrder ? (
              <>
                <div className="search-registration-header-grid">
                  <div className="detail-chip"><strong>Mobile:</strong> {selectedOrder.patient?.phone || '-'}</div>
                  <div className="detail-chip"><strong>Ref By:</strong> {selectedOrder.patient?.referralDoctor || 'Self'}</div>
                  <div className="detail-chip"><strong>Status:</strong> <MsBadge status={mapStatus(selectedOrder.status)} label={mapStatus(selectedOrder.status)} /></div>
                  <div className="detail-chip"><strong>Date:</strong> {fmtDate(selectedOrder.createdAt)}</div>
                </div>

                <div className="search-registration-workbench">
                  <div className="search-registration-catalog">
                    <div className="catalog-toolbar-row">
                      <MsInput label="Search for test" placeholder="Search for test" value={testSearch} onChange={(e) => setTestSearch(e.target.value)} />
                      <div className="table-actions prominent-actions top-aligned-icons">
                        <ActionIcon title="Refresh catalog" icon="↻" onClick={loadCatalog} />
                        <ActionIcon title="Reset search" icon="★" onClick={() => setTestSearch('')} />
                      </div>
                    </div>

                    <div className="catalog-list-box">
                      {availableTests.map((test) => (
                        <button type="button" key={test.id} className="catalog-row-button" onClick={() => stageTest(test)} title={`Add ${test.name}`}>
                          <span className="catalog-row-checkbox">☐</span>
                          <span className="catalog-row-name">{test.name}</span>
                          <span className="catalog-row-meta">{test.unit || '-'}</span>
                          <span className="catalog-row-price">{Number(test.price || 0).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="search-registration-invoice">
                    <div className="invoice-toolbar-actions">
                      <MsButton variant="secondary" href={`/billing?orderId=${selectedOrder.id}`}>Bill</MsButton>
                      <MsButton variant="secondary" href={`/billing?orderId=${selectedOrder.id}`}>Receipts</MsButton>
                      <MsButton variant="secondary">Refund</MsButton>
                    </div>

                    <div className="selected-tests-box">
                      <table className="mac-table compact-table">
                        <thead>
                          <tr>
                            <th>Test</th>
                            <th>Charge</th>
                            <th>Action</th>
                            <th>Sample</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTests.length ? selectedTests.map((test) => (
                            <tr key={test.id}>
                              <td>{test.name}</td>
                              <td>{Number(test.price || 0).toFixed(2)}</td>
                              <td>
                                <div className="table-actions prominent-actions">
                                  <ActionIcon title="Remove test" icon="✖" onClick={() => removeStagedTest(test.id)} />
                                </div>
                              </td>
                              <td>☑</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="empty-inline">Select tests from the center list</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="existing-tests-box">
                      <table className="mac-table compact-table">
                        <thead>
                          <tr>
                            <th>Sr. No</th>
                            <th>Investigation(s)</th>
                            <th>Date</th>
                            <th>Charges</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(history[0]?.results || selectedOrder.results || []).map((item, index) => (
                            <tr key={item.id}>
                              <td>{index + 1}</td>
                              <td>{item.testCatalog?.name || '-'}</td>
                              <td>{new Date(selectedOrder.createdAt).toLocaleDateString()}</td>
                              <td>{Number(item.testCatalog?.price || 0).toFixed(2)}</td>
                              <td>
                                <div className="table-actions prominent-actions">
                                  <ActionIcon title="Open result entry" icon="🧪" href={`/result-entry?orderId=${selectedOrder.id}`} />
                                  <ActionIcon title="Open billing" icon="🧾" href={`/billing?orderId=${selectedOrder.id}`} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="invoice-summary-grid">
                      <div><span>Total</span><strong>{subtotal.toFixed(2)}</strong></div>
                      <div><span>Discount (%)</span><strong>{discountPct || '0'}</strong></div>
                      <div><span>Discount</span><strong>{discount.toFixed(2)}</strong></div>
                      <div><span>Payment</span><strong>{paid.toFixed(2)}</strong></div>
                      <div><span>Net Amt</span><strong>{total.toFixed(2)}</strong></div>
                      <div><span>Balance</span><strong>{balance.toFixed(2)}</strong></div>
                    </div>

                    <div className="invoice-payment-row">
                      <label className="field-label">
                        Payment Mode
                        <select className="mac-input" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="CARD">Card</option>
                          <option value="CREDIT">Credit</option>
                        </select>
                      </label>
                      <MsInput label="Payment" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                      <MsInput label="Discount Remark" placeholder="Reason for discount" />
                      <div className="invoice-save-slot">
                        <MsButton onClick={raiseInvoice} disabled={isSaving || !selectedTests.length}>{isSaving ? 'Saving...' : 'Save'}</MsButton>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-inline">Select a booking from the left list.</div>
            )}
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
