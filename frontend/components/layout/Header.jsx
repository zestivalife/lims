'use client';

import { clearSession, getUser } from '@/lib/auth';

export default function Header() {
  const user = getUser();
  return (
    <header className="header">
      <div>{user?.tenantId ? 'Laboratory Information Management System' : 'LIMS Platform'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid #ffd0da',
              borderRadius: 999,
              padding: '8px 14px',
              color: '#383838',
              background: '#fff9fb'
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#ff385c',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                textTransform: 'lowercase'
              }}
            >
              {(user.email?.[0] || 'u').toLowerCase()}
            </div>
            <span style={{ fontWeight: 600 }}>{user.email}</span>
          </div>
        ) : null}
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
        ) : (
          <span style={{ color: '#666' }}>Guest</span>
        )}
      </div>
    </header>
  );
}
