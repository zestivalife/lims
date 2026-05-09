'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import { getUser } from '@/lib/auth';
import AuthGate from './AuthGate';

export default function PageWrapper({ children }) {
  const user = getUser();
  const role = user?.role || 'ADMIN';

  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar role={role} />
        <section>
          <Header />
          <main className="page page-has-shell-title">{children}</main>
        </section>
      </div>
    </AuthGate>
  );
}
