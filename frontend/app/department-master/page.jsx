'use client';

import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function DepartmentMasterPage() {
  const [rows, setRows] = useState([]);
  const [sortKey, setSortKey] = useState('name');
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const tests = await api.get('/api/tests/catalog?page=1&pageSize=200');
        const categories = [...new Set((tests.data || []).map((t) => t.category).filter(Boolean))];
        setRows(categories.map((c, i) => ({ id: String(i + 1), name: c, code: c.slice(0, 4).toUpperCase() })));
      } catch (e) {
        toast.error(e.message || 'Failed to load departments');
      }
    }
    load();
  }, [toast]);

  const data = useMemo(() => [...rows].sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]))), [rows, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Department Master</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Departments">
            <MsTable
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Department Name' },
                { key: 'code', label: 'Code' }
              ]}
              rows={data}
              onSort={setSortKey}
              sortKey={sortKey}
              paginationLabel={`Total departments: ${data.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
