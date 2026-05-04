'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navByRole = {
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/patients', label: 'Patients' },
    { href: '/tests', label: 'Tests' },
    { href: '/reports', label: 'Reports' },
    { href: '/analyzers', label: 'Analyzers' },
    { href: '/admin', label: 'Admin' }
  ],
  PATHOLOGIST: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/patients', label: 'Patients' },
    { href: '/reports', label: 'Reports' }
  ],
  TECHNICIAN: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/patients', label: 'Patients' },
    { href: '/tests', label: 'Tests' },
    { href: '/analyzers', label: 'Analyzers' }
  ],
  RECEPTION: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/patients', label: 'Patients' },
    { href: '/tests', label: 'Tests' }
  ],
  PATIENT: [{ href: '/patient-portal', label: 'My Reports' }]
};

export default function Sidebar({ role = 'ADMIN' }) {
  const pathname = usePathname();
  const nav = navByRole[role] || navByRole.ADMIN;

  return (
    <aside className="sidebar">
      <div style={{ padding: '0 20px 12px', fontSize: 22, fontWeight: 700 }}>LIMS</div>
      <div className="sidebar-section">Main</div>
      {nav.map((item) => (
        <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? 'active' : ''}>
          {item.label}
        </Link>
      ))}
      <div className="sidebar-section">Public</div>
      <Link href="/patient-portal" className={pathname.startsWith('/patient-portal') ? 'active' : ''}>
        Patient Portal
      </Link>
    </aside>
  );
}
