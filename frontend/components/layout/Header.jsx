'use client';

import { clearSession, getUser } from '@/lib/auth';

export default function Header() {
  const user = getUser();

  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;
  return (
    <header className="header">
      <div className="header-nav">
        <button
          type="button"
          className="header-nav-btn"
          disabled={!canGoBack}
          onClick={() => canGoBack && window.history.back()}
          aria-label="Back"
          title="Back"
        >
          ←
        </button>
        <button type="button" className="header-nav-btn" disabled aria-label="Forward" title="Forward">
          →
        </button>
      </div>
      <div className="header-title">{user?.tenantId ? 'Laboratory Information Management System' : 'LIMS Platform'}</div>
      <div className="header-user-wrap">
        {user ? (
          <div className="header-user-chip">
            <div className="header-user-avatar">
              {(user.email?.[0] || 'u').toLowerCase()}
            </div>
            <span className="header-user-email">{user.email}</span>
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
