'use client';

import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function CollectionPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [slot, setSlot] = useState('');
  const [homeCollection, setHomeCollection] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState('COLLECTED');

  async function load() {
    try {
      const data = await api.get('/api/tests/orders?page=1&pageSize=200');
      setOrders(data.data || []);
      if (!orderId && data.data?.[0]?.id) setOrderId(data.data[0].id);
    } catch (e) {
      toast.error(e.message || 'Failed to load orders');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pipelineRows = useMemo(
    () =>
      orders.map((o) => ({
        id: o.id,
        patient: o.patient?.name || '-',
        mobile: o.patient?.phone || '-',
        slot: o.sampleCollectedAt ? new Date(o.sampleCollectedAt).toLocaleString() : '-',
        status: o.status
      })),
    [orders]
  );

  async function createCollectionTask(e) {
    e.preventDefault();
    if (!orderId) {
      toast.warning('Select order');
      return;
    }
    try {
      await api.put(`/api/tests/orders/${orderId}/status`, {
        status: 'IN_PROGRESS',
        sampleCollectedAt: slot || new Date().toISOString()
      });
      toast.success(`Sample ${homeCollection ? 'home' : 'lab'} collection task created`);
      setSlot('');
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Failed to create task');
    }
  }

  async function updateStatus(e) {
    e.preventDefault();
    if (!orderId) return;
    try {
      const mappedStatus = statusUpdate === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
      await api.put(`/api/tests/orders/${orderId}/status`, { status: mappedStatus });
      toast.success('Sample workflow updated');
      await load();
    } catch (e2) {
      toast.error(e2.message || 'Status update failed');
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Collection</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Create Pickup Task">
            <form onSubmit={createCollectionTask} className="grid-12">
              <div className="span-6">
                <label className="ms-label">Order *</label>
                <select className="ms-select" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                  <option value="">Select order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.patient?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-6"><MsInput label="Scheduled Slot *" type="datetime-local" required value={slot} onChange={(e) => setSlot(e.target.value)} /></div>
              <div className="span-6">
                <label className="ms-label">Home Collection</label>
                <label className="switch-row">
                  <input type="checkbox" checked={homeCollection} onChange={(e) => setHomeCollection(e.target.checked)} />
                  <span>{homeCollection ? 'Yes' : 'No'}</span>
                </label>
              </div>
              <div className="span-12"><div className="ms-actions"><MsButton type="submit">Schedule Pickup</MsButton></div></div>
            </form>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Update Task Status">
            <form onSubmit={updateStatus} className="grid-12">
              <div className="span-6">
                <label className="ms-label">Task</label>
                <select className="ms-select" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                  <option value="">Select task/order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.patient?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-6">
                <label className="ms-label">Status</label>
                <select className="ms-select" value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)}>
                  <option value="COLLECTED">Collected</option>
                  <option value="RECEIVED">Received</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="span-12"><div className="ms-actions"><MsButton type="submit">Update Status</MsButton></div></div>
            </form>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Sample Pipeline">
            <MsTable
              columns={[
                { key: 'id', label: 'Order' },
                { key: 'patient', label: 'Patient' },
                { key: 'mobile', label: 'Mobile' },
                { key: 'slot', label: 'Slot' },
                { key: 'status', label: 'Status' }
              ]}
              rows={pipelineRows}
              statusKey="status"
              paginationLabel={`Tasks: ${pipelineRows.length}`}
            />
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
