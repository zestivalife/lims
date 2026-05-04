'use client';

import MsButton from '@/components/ui/MsButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function Step6Team({ tenantId, onComplete }) {
  const toast = useToast();
  const teamMembers = [
    { email: 'tech@demo-lab.com', phone: '9999999991', password: 'Tech@123', role: 'TECHNICIAN' },
    { email: 'path@demo-lab.com', phone: '9999999992', password: 'Path@123', role: 'PATHOLOGIST' },
    { email: 'reception@demo-lab.com', phone: '9999999993', password: 'Rec@123', role: 'RECEPTION' }
  ];

  return (
    <div>
      <p>Default team users will be created for go-live.</p>
      <ul>
        {teamMembers.map((u) => <li key={u.email}>{u.email} ({u.role})</li>)}
      </ul>
      <div className="ms-actions">
        <MsButton
          onClick={async () => {
            try {
              const resp = await api.post('/api/onboarding/step6', { tenantId, teamMembers });
              toast.success('Team users created');
              onComplete(resp);
            } catch (e) {
              toast.error(e.message || 'Failed to create team members');
            }
          }}
        >
          Create Team & Continue
        </MsButton>
      </div>
    </div>
  );
}
