'use client';

import { useState } from 'react';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function Step2Region({ tenantId, onComplete }) {
  const [countryKey, setCountryKey] = useState('IN');
  const [preview, setPreview] = useState(null);
  const toast = useToast();

  async function loadPreview(key) {
    const regions = await api.get('/api/regions', false);
    const cfg = regions.find((r) => r.key === key);
    setPreview(cfg || null);
  }

  async function submit() {
    try {
      const data = await api.post('/api/onboarding/step2', { tenantId, countryKey, override: null }, true);
      setPreview(data.autoConfig);
      toast.success('Step 2 completed');
      onComplete(data);
    } catch (e) {
      toast.error(e.message || 'Failed to save region configuration');
    }
  }

  return (
    <div className="grid-12">
      <div className="span-6">
        <label className="ms-label">Select Country</label>
        <select
          className="ms-select"
          value={countryKey}
          onChange={async (e) => {
            setCountryKey(e.target.value);
            await loadPreview(e.target.value);
          }}
        >
          <option value="IN">India</option>
          <option value="US">USA</option>
          <option value="EU">EU</option>
          <option value="UK">UK</option>
          <option value="ME_AED">UAE</option>
          <option value="ME_SAR">Saudi Arabia</option>
        </select>
      </div>
      <div className="span-6">
        <div className="ms-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Auto Configuration Preview</div>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      </div>
      <div className="span-12">
        <div className="ms-actions">
          <MsButton onClick={submit}>Save & Continue</MsButton>
        </div>
      </div>
    </div>
  );
}
