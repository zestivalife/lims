'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import Step1Account from './Step1Account';
import Step2Region from './Step2Region';
import Step3LabSetup from './Step3LabSetup';
import Step4Policies from './Step4Policies';
import Step5Analyzer from './Step5Analyzer';
import Step6Team from './Step6Team';
import Step7GoLive from './Step7GoLive';
import { useToast } from '@/components/ui/ToastProvider';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [tenantId, setTenantId] = useState('');
  const [userId, setUserId] = useState('');
  const [login, setLogin] = useState({ email: 'admin@demo-lab.com', password: 'Admin@123', tenantSlug: 'city-diagnostics-demo-lab' });
  const toast = useToast();

  const percent = useMemo(() => (step / 7) * 100, [step]);

  async function doLogin(e) {
    e.preventDefault();
    try {
      const result = await api.post('/api/auth/login', login, false);
      setSession(result);
      toast.success('Login successful. Redirecting to dashboard.');
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.message || 'Unable to login');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>LIMS Onboarding</h1>
      <div style={{ height: 10, background: '#ddd', borderRadius: 99, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--color-primary)', transition: '0.3s' }} />
      </div>

      <div className="grid-12">
        <div className="span-8">
          <MsCard title={`Step ${step} of 7`}>
            {step === 1 && <Step1Account onComplete={(d) => { setTenantId(d.tenantId); setUserId(d.userId); setStep(2); }} />}
            {step === 2 && <Step2Region tenantId={tenantId} onComplete={() => setStep(3)} />}
            {step === 3 && <Step3LabSetup tenantId={tenantId} onComplete={() => setStep(4)} />}
            {step === 4 && <Step4Policies tenantId={tenantId} userId={userId} onComplete={() => setStep(5)} />}
            {step === 5 && <Step5Analyzer tenantId={tenantId} onComplete={() => setStep(6)} />}
            {step === 6 && <Step6Team tenantId={tenantId} onComplete={() => setStep(7)} />}
            {step === 7 && <Step7GoLive tenantId={tenantId} userId={userId} onDone={() => (window.location.href = '/dashboard')} />}
          </MsCard>
        </div>

        <div className="span-4">
          <MsCard title="Existing User Login">
            <form onSubmit={doLogin}>
              <div className="ms-section">
                <MsInput label="Tenant Slug" value={login.tenantSlug} onChange={(e) => setLogin({ ...login, tenantSlug: e.target.value })} />
                <MsInput label="Email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                <MsInput label="Password" type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                <MsButton type="submit">Login</MsButton>
              </div>
            </form>
          </MsCard>
        </div>
      </div>
    </div>
  );
}
