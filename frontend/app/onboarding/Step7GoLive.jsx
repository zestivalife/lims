'use client';

import { useState } from 'react';
import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function Step7GoLive({ tenantId, userId, onDone }) {
  const [done, setDone] = useState(false);
  const [creds, setCreds] = useState(null);
  const toast = useToast();

  async function launch() {
    try {
      const result = await api.post('/api/onboarding/step7', { tenantId, adminUserId: userId });
      setDone(true);
      setCreds(result.demoCredentials);
      toast.success('Go-live completed');
    } catch (e) {
      toast.error(e.message || 'Failed to complete go-live');
    }
  }

  return (
    <div>
      {!done ? (
        <div style={{ textAlign: 'right' }}><MsButton onClick={launch}>Go Live</MsButton></div>
      ) : (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 42, animation: 'pulse 1s infinite' }}>🎉</div>
          <h3>Onboarding Complete</h3>
          <p>Demo Credentials</p>
          <pre>{JSON.stringify(creds, null, 2)}</pre>
          <MsButton onClick={onDone}>Enter Dashboard</MsButton>
        </div>
      )}
    </div>
  );
}
