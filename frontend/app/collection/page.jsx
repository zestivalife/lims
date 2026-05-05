'use client';

import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';

export default function CollectionPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ patient: '', mobile: '', address: '', scheduleAt: '' });

  function addTask(e) {
    e.preventDefault();
    if (!form.patient || !form.mobile || !form.scheduleAt) return;
    setRows((prev) => [
      { id: `COL-${Date.now()}`, ...form, status: 'Scheduled' },
      ...prev
    ]);
    setForm({ patient: '', mobile: '', address: '', scheduleAt: '' });
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Collection</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Home Collection Scheduling">
            <form onSubmit={addTask} className="grid-12">
              <div className="span-6"><MsInput label="Patient Name" required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Mobile" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
              <div className="span-12"><MsInput label="Address" as="textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="span-6"><MsInput label="Pickup Time" type="datetime-local" required value={form.scheduleAt} onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })} /></div>
              <div className="span-12"><div className="ms-actions"><MsButton type="submit">Schedule Pickup</MsButton></div></div>
            </form>
          </MsCard>
        </div>
        <div className="span-12">
          <MsCard title="Scheduled Pickups">
            <MsTable
              columns={[
                { key: 'id', label: 'Task ID' },
                { key: 'patient', label: 'Patient' },
                { key: 'mobile', label: 'Mobile' },
                { key: 'scheduleAt', label: 'Pickup Time' },
                { key: 'status', label: 'Status' }
              ]}
              rows={rows}
              paginationLabel={`Tasks: ${rows.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
