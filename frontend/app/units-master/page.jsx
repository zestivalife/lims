'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsTable from '@/components/ui/MsTable';
import { bootstrapCatalogIfEmpty } from '@/lib/demoCatalog';
import { useToast } from '@/components/ui/ToastProvider';

export default function UnitsMasterPage() {
  const [units, setUnits] = useState([]);
  const [sortKey, setSortKey] = useState('unit');
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const tests = await bootstrapCatalogIfEmpty();
        const uniq = [...new Set((tests || []).map((t) => t.unit).filter(Boolean))];
        setUnits(uniq.map((u, i) => ({ id: String(i + 1), unit: u })));
      } catch (e) {
        toast.error(e.message || 'Failed to load units');
      }
    }
    load();
  }, [toast]);

  const rows = useMemo(() => [...units].sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]))), [units, sortKey]);

  return (
    <PageWrapper>
      <h1 className="page-title">Units Master</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Result Units">
            <MsTable
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'unit', label: 'Unit' }
              ]}
              rows={rows}
              onSort={setSortKey}
              sortKey={sortKey}
              paginationLabel={`Total units: ${rows.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
