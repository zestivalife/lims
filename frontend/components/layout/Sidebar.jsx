'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clearSession } from '@/lib/auth';

const NAV_TREE = {
  ADMIN: [
    {
      id: 'operations',
      label: 'Operations',
      children: [{ href: '/dashboard', label: 'Dashboard' }]
    },
    {
      id: 'patient',
      label: 'Patient',
      children: [
        { href: '/new-registration', label: 'New Registration' },
        { href: '/search-registration', label: 'Search Registration' },
        { href: '/search-registration?mode=outsourced', label: 'Outsourced Tests' }
      ]
    },
    {
      id: 'result',
      label: 'Result',
      children: [{ href: '/result-entry', label: 'Result Entry' }]
    },
    {
      id: 'master',
      label: 'Master',
      children: [
        { href: '/tests-master', label: 'Tests' },
        { href: '/department-master', label: 'Department' },
        { href: '/packages-master', label: 'Packages' },
        { href: '/admin?tab=users', label: 'Users' },
        { href: '/billing?tab=charges', label: 'Charges' },
        { href: '/collection?tab=referral', label: 'Referral Doctors' },
        { href: '/collection?tab=centers', label: 'Centers' },
        { href: '/billing?tab=corporates', label: 'Corporates' },
        { href: '/analyzers?tab=outsource', label: 'Outsource Labs' },
        { href: '/report-approval?tab=complements', label: 'Testwise Complement' },
        {
          id: 'other-masters',
          label: 'Other Masters',
          children: [
            { href: '/units-master?tab=specimen', label: 'Specimen Type' },
            { href: '/units-master', label: 'Units' }
          ]
        }
      ]
    },
    {
      id: 'report',
      label: 'Report',
      children: [
        {
          id: 'mis-report',
          label: 'MIS Report',
          children: [
            { href: '/billing?tab=daily-collection', label: 'Daily Collection' },
            { href: '/billing?tab=payment-received', label: 'Payment Received Report' },
            { href: '/report-approval?tab=complement', label: 'Complement Report' },
            { href: '/report-approval?tab=test-complement', label: 'Test Complement Report' },
            { href: '/report-approval?tab=all-doctors', label: 'Complement Report (All Doctors)' }
          ]
        },
        {
          id: 'cost-report',
          label: 'Cost Related Report',
          children: [
            { href: '/billing?tab=center-wise-cost', label: 'Center Wise Cost Report' },
            { href: '/billing?tab=b2b-testwise', label: 'B2B Testwise Cost Report' }
          ]
        },
        {
          id: 'other-report',
          label: 'Others Report',
          children: [
            { href: '/report-approval?tab=tat', label: 'Turn Around Time' },
            { href: '/report-approval?tab=worksheet', label: 'Worksheet' },
            { href: '/report-approval?tab=detailed-worksheet', label: 'Detailed Worksheet' },
            { href: '/audit?tab=login', label: 'User Login Report' },
            { href: '/audit', label: 'Delete Log' },
            { href: '/billing?tab=vouchers', label: 'Vouchers' },
            { href: '/billing?tab=hospital-bills', label: 'Hospital Bills' }
          ]
        },
        { href: '/search-registration?tab=patient-list', label: 'Patient List' },
        { href: '/billing?tab=bulk-settlement', label: 'Bulk Settlement' },
        { href: '/billing?tab=b2b-bulk', label: 'B2B Bulk Settlement' },
        { href: '/dashboard?tab=service-count', label: 'Service Count' },
        { href: '/result-entry?tab=test-report', label: 'Test Report' }
      ]
    },
    {
      id: 'config',
      label: 'Config',
      children: [
        { href: '/admin', label: 'Configuration' },
        { href: '/admin?tab=backup', label: 'DB Backup' }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      children: [
        { href: '/help', label: 'User Manual' },
        { href: '/help?tab=remote-tools', label: 'Remote Tools' },
        { href: '/help?tab=videos', label: 'How To Guides' }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      children: [
        { href: '/audit', label: 'Audit' },
        { id: 'logout', label: 'Logout', action: 'logout' }
      ]
    }
  ],
  PATHOLOGIST: [
    {
      id: 'operations',
      label: 'Operations',
      children: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/result-entry', label: 'Result Entry' },
        { href: '/report-approval', label: 'Report Approval' }
      ]
    }
  ],
  TECHNICIAN: [
    {
      id: 'operations',
      label: 'Operations',
      children: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/new-registration', label: 'New Registration' },
        { href: '/result-entry', label: 'Result Entry' },
        { href: '/collection', label: 'Collection' }
      ]
    },
    {
      id: 'integration',
      label: 'Integration',
      children: [{ href: '/analyzers', label: 'Analyzers' }]
    }
  ],
  RECEPTION: [
    {
      id: 'operations',
      label: 'Operations',
      children: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/new-registration', label: 'New Registration' },
        { href: '/search-registration', label: 'Search Registration' },
        { href: '/billing', label: 'Billing' }
      ]
    }
  ],
  PATIENT: [
    {
      id: 'portal',
      label: 'Portal',
      children: [{ href: '/patient-portal', label: 'My Reports' }]
    }
  ]
};

function normalizePath(path = '') {
  return path.split('?')[0] || '/';
}

function normalizeFullPath(path = '') {
  if (!path) return '/';
  const [base, query = ''] = path.split('?');
  const queryParts = query
    .split('&')
    .filter(Boolean)
    .sort()
    .join('&');
  return queryParts ? `${base}?${queryParts}` : base;
}

function nodeIsActive(node, currentRoute) {
  if (node.href) {
    const nodeBasePath = normalizePath(node.href);
    const currentBasePath = normalizePath(currentRoute);

    if (node.href.includes('?')) {
      return normalizeFullPath(node.href) === normalizeFullPath(currentRoute);
    }

    return nodeBasePath === currentBasePath;
  }
  return (node.children || []).some((child) => nodeIsActive(child, currentRoute));
}

function NavNode({ node, currentRoute, level = 0, openMap, onToggle }) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isOpen = openMap[node.id] ?? false;
  const active = nodeIsActive(node, currentRoute);
  const panelId = node.id ? `nav-panel-${node.id}` : undefined;
  const triggerId = node.id ? `nav-trigger-${node.id}` : undefined;

  if (hasChildren) {
    return (
      <div className={`nav-node nav-level-${level} ${active ? 'active-trail' : ''}`}>
        <button
          type="button"
          className={`nav-group-btn ${isOpen ? 'open' : ''} ${active ? 'active' : ''}`}
          onClick={() => onToggle(node.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggle(node.id);
            }
          }}
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span>{node.label}</span>
          <span className="nav-chevron">▾</span>
        </button>
        <div
          id={panelId}
          role="group"
          aria-labelledby={triggerId}
          className={`nav-children ${isOpen ? 'open' : ''}`}
        >
          {node.children.map((child) => (
            <NavNode
              key={child.id || child.href}
              node={child}
              currentRoute={currentRoute}
              level={level + 1}
              openMap={openMap}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    );
  }

  if (node.action === 'logout') {
    return (
      <button
        type="button"
        className={`nav-link nav-level-${level}`}
        onClick={() => {
          clearSession();
          if (typeof window !== 'undefined') {
            window.location.href = '/onboarding';
          }
        }}
      >
        {node.label}
      </button>
    );
  }

  return (
    <Link href={node.href} className={`nav-link nav-level-${level} ${active ? 'active' : ''}`}>
      {node.label}
    </Link>
  );
}

export default function Sidebar({ role = 'ADMIN' }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tree = NAV_TREE[role] || NAV_TREE.ADMIN;
  const currentRoute = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const initialSectionOpen = useMemo(() => {
    const state = {};
    tree.forEach((section, index) => {
      state[section.id] =
        section.children.some((node) => nodeIsActive(node, currentRoute)) || index === 0 || section.id === 'patient';
    });
    return state;
  }, [tree, currentRoute]);

  const initialOpen = useMemo(() => {
    const state = {};
    const walk = (nodes) => {
      nodes.forEach((node) => {
        if (node.children) {
          state[node.id] = nodeIsActive(node, currentRoute) || node.id === 'operations' || node.id === 'patient';
          walk(node.children);
        }
      });
    };
    walk(tree);
    return state;
  }, [tree, currentRoute]);

  const [openMap, setOpenMap] = useState(initialOpen);
  const [sectionOpenMap, setSectionOpenMap] = useState(initialSectionOpen);

  useEffect(() => {
    setOpenMap(initialOpen);
  }, [initialOpen]);

  useEffect(() => {
    setSectionOpenMap(initialSectionOpen);
  }, [initialSectionOpen]);

  const toggle = (id) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (id) => {
    setSectionOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="sidebar ios-glass" aria-label="Primary navigation">
      <div className="sidebar-logo">LIMS</div>
      <div className="sidebar-tree">
        {tree.map((section) => {
          const sectionActive = section.children.some((node) => nodeIsActive(node, currentRoute));
          const sectionOpen = sectionOpenMap[section.id] ?? false;
          const sectionPanelId = `sidebar-section-panel-${section.id}`;
          const sectionTriggerId = `sidebar-section-trigger-${section.id}`;

          return (
            <div key={section.id} className={`sidebar-section-block ${sectionActive ? 'active-trail' : ''}`}>
              <button
                type="button"
                className={`sidebar-section-toggle ${sectionOpen ? 'open' : ''} ${sectionActive ? 'active' : ''}`}
                id={sectionTriggerId}
                aria-expanded={sectionOpen}
                aria-controls={sectionPanelId}
                onClick={() => toggleSection(section.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSection(section.id);
                  }
                }}
              >
                <span className="sidebar-section-label">{section.label}</span>
                <span className="sidebar-section-chevron">▾</span>
              </button>
              <div
                id={sectionPanelId}
                role="group"
                aria-labelledby={sectionTriggerId}
                className={`sidebar-section-items ${sectionOpen ? 'open' : ''}`}
              >
                {section.children.map((node) => (
                  <NavNode
                    key={node.id || node.href}
                    node={node}
                    currentRoute={currentRoute}
                    openMap={openMap}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
