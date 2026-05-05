'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function PackagesMasterPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');

  async function load() {
    try {
      const data = await api.get('/api/tests/catalog?page=1&pageSize=300');
      const tests = data.data || [];
      const byCategory = new Map();
      for (const t of tests) {
        const key = t.category || 'GENERAL';
        if (!byCategory.has(key)) byCategory.set(key, []);
        byCategory.get(key).push(t);
      }
      const mapped = [...byCategory.entries()].map(([name, list], idx) => ({
        id: String(idx + 1),
        name: `${name} PACKAGE`,
        center: 'MAIN LAB',
        tests: list.map((x) => x.code).join(', '),
        amount: list.reduce((sum, x) => sum + Number(x.price || 0), 0)
      }));
      setRows(mapped);
    } catch (e) {
      toast.error(e.message || 'Failed to load packages');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => `${r.name} ${r.center} ${r.tests}`.toLowerCase().includes(q)) : rows;
    const sorted = [...filtered];
    sorted.sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
    return sorted;
  }, [rows, query, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Packages Master</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Package List">
            <div className="filter-grid" style={{ marginBottom: 16 }}>
              <MsInput label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <MsTable
              columns={[
                { key: 'id', label: 'Sr. No' },
                { key: 'name', label: 'Package Name' },
                { key: 'center', label: 'Center' },
                { key: 'tests', label: 'Included Tests' },
                { key: 'amount', label: 'Amount', render: (row) => Number(row.amount).toFixed(2) }
              ]}
              rows={data}
              onSort={setSortKey}
              sortKey={sortKey}
              paginationLabel={`Rows: ${data.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
