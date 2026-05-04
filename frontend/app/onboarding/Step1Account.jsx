'use client';

import { useState } from 'react';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function Step1Account({ onComplete }) {
  const [form, setForm] = useState({
    tenantName: 'City Diagnostics — Demo Lab',
    tenantSlug: 'city-diagnostics-demo-lab',
    adminEmail: 'admin@demo-lab.com',
    adminPhone: '9999999999',
    password: 'Admin@123',
    countryKey: 'IN'
  });
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    try {
      const data = await api.post('/api/onboarding/step1', form, false);
      toast.success('Step 1 completed');
      onComplete(data);
    } catch (err) {
      toast.error(err.message || 'Failed to save step 1');
    }
  }

  return (
    <form onSubmit={submit} className="grid-12">
      <div className="span-6"><MsInput label="Lab Name" required value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} /></div>
      <div className="span-6"><MsInput label="Lab Slug" required value={form.tenantSlug} onChange={(e) => setForm({ ...form, tenantSlug: e.target.value })} /></div>
      <div className="span-6"><MsInput label="Admin Email" required value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></div>
      <div className="span-6"><MsInput label="Admin Phone" required value={form.adminPhone} onChange={(e) => setForm({ ...form, adminPhone: e.target.value })} /></div>
      <div className="span-6"><MsInput label="Password" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <div className="span-6">
        <label className="ms-label">Country</label>
        <select className="ms-select" value={form.countryKey} onChange={(e) => setForm({ ...form, countryKey: e.target.value })}>
          <option value="IN">India</option>
          <option value="US">USA</option>
          <option value="EU">EU</option>
          <option value="UK">UK</option>
          <option value="ME_AED">UAE</option>
          <option value="ME_SAR">Saudi Arabia</option>
        </select>
      </div>
      <div className="span-12">
        <div className="ms-actions">
          <MsButton type="submit">Save & Continue</MsButton>
        </div>
      </div>
    </form>
  );
}
