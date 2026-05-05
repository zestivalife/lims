'use client';

import { useEffect } from 'react';
import { clearSession } from '@/lib/auth';

export default function LogoutPage() {
  useEffect(() => {
    clearSession();
    window.location.href = '/onboarding';
  }, []);

  return null;
}
