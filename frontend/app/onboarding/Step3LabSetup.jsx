'use client';

import { useState } from 'react';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function Step3LabSetup({ tenantId, onComplete }) {
  const [branchName, setBranchName] = useState('Main Branch');
  const [branchAddress, setBranchAddress] = useState('Baner, Pune, Maharashtra');
  const toast = useToast();

  return (
    <div className="grid-12">
      <div className="span-6"><MsInput label="Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} /></div>
      <div className="span-6"><MsInput label="Branch Address" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} /></div>
      <div className="span-12">
        <div className="ms-actions">
          <MsButton
            onClick={async () => {
              try {
                const resp = await api.post('/api/onboarding/step3', { tenantId, branchName, branchAddress });
                toast.success('Step 3 completed');
                onComplete(resp);
              } catch (e) {
                toast.error(e.message || 'Unable to save branch setup');
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
