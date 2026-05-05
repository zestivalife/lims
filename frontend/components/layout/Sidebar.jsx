'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navByRole = {
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard', section: 'Operations' },
    { href: '/new-registration', label: 'New Registration', section: 'Operations' },
    { href: '/search-registration', label: 'Search Registration', section: 'Operations' },
    { href: '/result-entry', label: 'Result Entry', section: 'Operations' },
    { href: '/report-approval', label: 'Report Approval', section: 'Operations' },
    { href: '/billing', label: 'Billing', section: 'Operations' },
    { href: '/collection', label: 'Collection', section: 'Operations' },
    { href: '/analyzers', label: 'Analyzers', section: 'Integration' },
    { href: '/tests-master', label: 'Tests Master', section: 'Master Data' },
    { href: '/department-master', label: 'Department Master', section: 'Master Data' },
    { href: '/packages-master', label: 'Packages Master', section: 'Master Data' },
    { href: '/units-master', label: 'Units Master', section: 'Master Data' },
    { href: '/admin', label: 'Configuration', section: 'Admin' },
    { href: '/help', label: 'Help', section: 'Admin' },
    { href: '/audit', label: 'Audit', section: 'Admin' },
    { href: '/logout', label: 'Logout', section: 'Admin' }
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
  const sections = [...new Set(nav.map((item) => item.section || 'Main'))];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">LIMS</div>
      {sections.map((section) => (
        <div key={section}>
          <div className="sidebar-section">{section}</div>
          {nav
            .filter((item) => (item.section || 'Main') === section)
            .map((item) => (
              <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? 'active' : ''}>
                {item.label}
              </Link>
            ))}
        </div>
      ))}
    </aside>
  );
}
