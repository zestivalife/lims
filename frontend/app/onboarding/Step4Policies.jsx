'use client';

import { useState } from 'react';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function Step4Policies({ tenantId, userId, onComplete }) {
  const [checked, setChecked] = useState(false);
  const [policy] = useState('I agree to comply with all regional, legal, and data-protection obligations. Audit logs must capture all user actions and consent acknowledgements.');
  const toast = useToast();

  return (
    <div className="grid-12">
      <div className="span-12" style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--color-border)', padding: 12, background: '#fff' }}>{policy.repeat(20)}</div>
      <div className="span-12">
        <label><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> I accept all policies</label>
      </div>
      <div className="span-12">
        <div className="ms-actions">
          <MsButton
            disabled={!checked}
            onClick={async () => {
              try {
                const resp = await api.post('/api/onboarding/step4', {
                  tenantId,
                  userId,
                  policyType: 'MASTER_POLICY',
                  policyVersion: '2026.04'
                });
                toast.success('Policy consent recorded');
                onComplete(resp);
              } catch (e) {
                toast.error(e.message || 'Failed to save consent');
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
