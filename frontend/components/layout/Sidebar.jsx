'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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
        { href: '/logout', label: 'Logout' }
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

function normalize(path = '') {
  return path.split('?')[0] || '/';
}

function nodeIsActive(node, pathname) {
  if (node.href) {
    return normalize(node.href) === normalize(pathname);
  }
  return (node.children || []).some((child) => nodeIsActive(child, pathname));
}

function NavNode({ node, pathname, level = 0, openMap, onToggle }) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isOpen = openMap[node.id] ?? false;
  const active = nodeIsActive(node, pathname);

  if (hasChildren) {
    return (
      <div className={`nav-node nav-level-${level} ${active ? 'active-trail' : ''}`}>
        <button
          type="button"
          className={`nav-group-btn ${isOpen ? 'open' : ''} ${active ? 'active' : ''}`}
          onClick={() => onToggle(node.id)}
        >
          <span>{node.label}</span>
          <span className="nav-chevron">▾</span>
        </button>
        <div className={`nav-children ${isOpen ? 'open' : ''}`}>
          {node.children.map((child) => (
            <NavNode
              key={child.id || child.href}
              node={child}
              pathname={pathname}
              level={level + 1}
              openMap={openMap}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
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
  const tree = NAV_TREE[role] || NAV_TREE.ADMIN;

  const initialOpen = useMemo(() => {
    const state = {};
    const walk = (nodes) => {
      nodes.forEach((node) => {
        if (node.children) {
          state[node.id] = nodeIsActive(node, pathname) || node.id === 'operations' || node.id === 'patient';
          walk(node.children);
        }
      });
    };
    walk(tree);
    return state;
  }, [tree, pathname]);

  const [openMap, setOpenMap] = useState(initialOpen);

  useEffect(() => {
    setOpenMap(initialOpen);
  }, [initialOpen]);

  const toggle = (id) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="sidebar ios-glass">
      <div className="sidebar-logo">LIMS</div>
      <div className="sidebar-tree">
        {tree.map((section) => (
          <div key={section.id} className="sidebar-section-block">
            <div className="sidebar-section">{section.label}</div>
            <div className="sidebar-section-items">
              {section.children.map((node) => (
                <NavNode
                  key={node.id || node.href}
                  node={node}
                  pathname={pathname}
                  openMap={openMap}
                  onToggle={toggle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
