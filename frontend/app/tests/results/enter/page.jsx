'use client';

import { useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

function inRange(value, referenceRange) {
  const n = Number(value);
  if (Number.isNaN(n)) return true;
  const [minRaw, maxRaw] = String(referenceRange || '')
    .split('-')
    .map((v) => Number(v.trim()));
  if (Number.isNaN(minRaw) || Number.isNaN(maxRaw)) return true;
  return n >= minRaw && n <= maxRaw;
}

export default function ResultEntryPage() {
  const [lookup, setLookup] = useState('');
  const [order, setOrder] = useState(null);
  const [results, setResults] = useState([]);
  const toast = useToast();

  async function loadOrder() {
    try {
      const data = await api.get(`/api/tests/orders/${lookup}`);
      setOrder(data);
      setResults(
        (data.results || []).map((r) => ({
          id: r.id,
          testName: r.testCatalog?.name || r.testCatalog?.code,
          value: r.value || '',
          unit: r.unit,
          referenceRange: r.referenceRange
        }))
      );
      toast.success('Order loaded');
    } catch (e) {
      toast.error(e.message || 'Order not found');
      setOrder(null);
      setResults([]);
    }
  }

  async function saveResults() {
    try {
      await api.post('/api/tests/results/manual', { orderId: order.id, results });
      await api.put(`/api/tests/orders/${order.id}/status`, { status: 'IN_PROGRESS' });
      toast.success('Results saved and sent to pathologist queue');
    } catch (e) {
      toast.error(e.message || 'Failed to save results');
    }
  }

  const abnormalCount = useMemo(
    () => results.filter((r) => r.value && !inRange(r.value, r.referenceRange)).length,
    [results]
  );

  return (
    <PageWrapper>
      <h1 className="page-title">Result Entry</h1>

      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Order Lookup by Order ID">
            <div className="filter-grid">
              <MsInput label="Order ID (or MRN if mapped)" value={lookup} onChange={(e) => setLookup(e.target.value)} />
              <MsButton onClick={loadOrder}>Load Order</MsButton>
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Result Grid">
            {!order ? (
              <div style={{ color: 'var(--color-muted)' }}>Load an order to start entering results.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {results.map((row, idx) => {
                  const normal = inRange(row.value, row.referenceRange);
                  return (
                    <div
                      key={row.id}
                      className="ms-result-row"
                      style={{
                        borderLeft: `3px solid ${row.value ? (normal ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-border)'}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{row.testName}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Ref: {row.referenceRange || 'N/A'}</div>
                      </div>
                      <MsInput value={row.value} onChange={(e) => setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))} />
                      <MsInput value={row.unit} onChange={(e) => setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, unit: e.target.value } : r)))} />
                      <MsInput value={row.referenceRange} onChange={(e) => setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, referenceRange: e.target.value } : r)))} />
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ color: abnormalCount > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                    Abnormal entries: {abnormalCount}
                  </div>
                  <MsButton onClick={saveResults}>Save + Send to Pathologist</MsButton>
                </div>
              </div>
            )}
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
