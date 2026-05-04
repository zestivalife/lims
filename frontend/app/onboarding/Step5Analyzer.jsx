'use client';

import { useState } from 'react';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function Step5Analyzer({ tenantId, onComplete }) {
  const [form, setForm] = useState({
    name: 'Sysmex XN-Series',
    model: 'XN-1000',
    manufacturer: 'Sysmex',
    protocol: 'HL7',
    ipAddress: '127.0.0.1',
    port: 5000
  });
  const toast = useToast();

  return (
    <div className="grid-12">
      <div className="span-6"><MsInput label="Analyzer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="span-6"><MsInput label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
      <div className="span-6"><MsInput label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
      <div className="span-6"><label className="ms-label">Protocol</label><select className="ms-select" value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}><option>HL7</option><option>ASTM</option><option>VENDOR</option></select></div>
      <div className="span-6"><MsInput label="IP Address" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} /></div>
      <div className="span-6"><MsInput label="Port" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} /></div>
      <div className="span-12">
        <div className="ms-actions">
          <MsButton
            onClick={async () => {
              try {
                const resp = await api.post('/api/onboarding/step5', { tenantId, ...form });
                toast.success('Analyzer step completed');
                onComplete(resp);
              } catch (e) {
                toast.error(e.message || 'Failed to connect analyzer step');
              }
            }}
          >
            Save & Continue
          </MsButton>
        </div>
      </div>
    </div>
  );
}
