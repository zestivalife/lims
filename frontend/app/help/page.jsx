'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';

export default function HelpPage() {
  return (
    <PageWrapper>
      <h1 className="page-title">Help</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Guides & Support">
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 10 }}>
              <li><a href="/onboarding">Onboarding Guide</a></li>
              <li><a href="/new-registration">How to register patient</a></li>
              <li><a href="/result-entry">How to enter results</a></li>
              <li><a href="/reports">How to generate and deliver report</a></li>
              <li>Support: support@demo-lab.com</li>
            </ul>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
