'use client';

import { clearSession, getUser } from '@/lib/auth';

export default function Header() {
  const user = getUser();
  return (
    <header className="header">
      <div>{user?.tenantId ? 'Laboratory Information Management System' : 'LIMS Platform'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span>Notifications</span>
        <span>{user?.email || 'Guest'}</span>
        {user ? (
          <button
            className="ms-btn ms-btn-secondary"
            onClick={() => {
              clearSession();
              window.location.href = '/onboarding';
            }}
          >
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}
