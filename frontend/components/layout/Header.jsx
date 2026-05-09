'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { clearSession, getUser } from '@/lib/auth';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/new-registration': 'New Registration',
  '/search-registration': 'Registration Search',
  '/result-entry': 'Result Entry',
  '/report-approval': 'Reports Approval',
  '/billing': 'Billing',
  '/collection': 'Collection',
  '/analyzers': 'Analyzers',
  '/tests-master': 'Tests Master',
  '/department-master': 'Department Master',
  '/packages-master': 'Packages Master',
  '/units-master': 'Units Master',
  '/admin': 'Admin Panel',
  '/audit': 'Audit Log',
  '/help': 'Help',
  '/patients': 'Patients',
  '/patient-portal': 'Patient Portal',
  '/tests': 'Tests & Orders',
  '/onboarding': 'Welcome to LIMS'
};

function titleFromPath(pathname = '/') {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }

  if (pathname.startsWith('/patients/')) {
    return 'Patient Profile';
  }

  if (pathname.startsWith('/reports/')) {
    return 'Report Viewer';
  }

  if (pathname.startsWith('/tests/results/enter')) {
    return 'Result Entry';
  }

  const fallback = pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, ' ');

  return fallback
    ? fallback.replace(/\b\w/g, (char) => char.toUpperCase())
    : 'LIMS';
}

export default function Header() {
  const user = getUser();
  const pathname = usePathname();
  const pageTitle = useMemo(() => titleFromPath(pathname), [pathname]);

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
      <div className="header-title">{pageTitle}</div>
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
