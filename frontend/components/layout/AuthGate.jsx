'use client';

import { useEffect, useState } from 'react';
import { hasSession } from '@/lib/auth';

export default function AuthGate({ children, allowAnonymous = false }) {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const ok = allowAnonymous || hasSession();
    setAuthorized(ok);
    setReady(true);
    if (!ok) {
      window.location.href = '/onboarding';
    }
  }, [allowAnonymous]);

  if (!ready) {
    return <div className="page">Loading...</div>;
  }

  if (!authorized) return null;
  return children;
}
