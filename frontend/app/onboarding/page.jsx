'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { useToast } from '@/components/ui/ToastProvider';

const defaultSignup = {
  tenantName: '',
  contactName: '',
  adminEmail: '',
  adminPhone: '',
  password: ''
};

const defaultLogin = {
  tenantSlug: '',
  email: '',
  password: ''
};

function slugify(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OnboardingPage() {
  const [signup, setSignup] = useState(defaultSignup);
  const [login, setLogin] = useState(defaultLogin);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remembered = window.localStorage.getItem('lastTenantSlug') || '';
    if (remembered) {
      setLogin((prev) => ({ ...prev, tenantSlug: remembered }));
    }
  }, []);

  const derivedTenantSlug = useMemo(() => slugify(signup.tenantName), [signup.tenantName]);

  const canSignup = useMemo(
    () =>
      signup.tenantName.trim() &&
      signup.contactName.trim() &&
      signup.adminEmail.trim() &&
      signup.adminPhone.trim() &&
      signup.password.trim(),
    [signup]
  );

  const canLogin = useMemo(() => login.email.trim() && login.password.trim(), [login]);

  async function handleSignup(e) {
    e.preventDefault();
    if (!canSignup) {
      toast.warning('Please complete all required fields.');
      return;
    }

    setLoadingSignup(true);
    try {
      const tenantSlug = derivedTenantSlug;
      await api.post(
        '/api/onboarding/step1',
        {
          tenantName: signup.tenantName,
          tenantSlug,
          contactName: signup.contactName,
          adminEmail: signup.adminEmail,
          adminPhone: signup.adminPhone,
          password: signup.password,
          countryKey: 'IN'
        },
        false
      );

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lastTenantSlug', tenantSlug);
      }

      toast.success('Workspace created. Logging you in.');

      const result = await api.post(
        '/api/auth/login',
        {
          tenantSlug,
          email: signup.adminEmail,
          password: signup.password
        },
        false
      );
      setSession(result);
      window.location.href = '/dashboard';
    } catch (err) {
      const msg = err.message || 'Failed to create account';
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('already')) {
        toast.warning('Lab or email already exists. Please login with your existing workspace code.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingSignup(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!canLogin) {
      toast.warning('Please complete all login fields.');
      return;
    }

    setLoadingLogin(true);
    try {
      const tenantSlug = slugify(login.tenantSlug);
      const payload = {
        email: login.email,
        password: login.password
      };
      if (tenantSlug) {
        payload.tenantSlug = tenantSlug;
      }

      const result = await api.post('/api/auth/login', payload, false);
      if (typeof window !== 'undefined') {
        if (tenantSlug) {
          window.localStorage.setItem('lastTenantSlug', tenantSlug);
        }
      }
      setSession(result);
      toast.success('Login successful.');
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.message || 'Unable to login');
    } finally {
      setLoadingLogin(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1240, margin: '0 auto' }}>
      <h1 className="page-title" style={{ marginBottom: 10 }}>Welcome to LIMS</h1>
      <p style={{ marginTop: 0, color: 'var(--color-muted)', marginBottom: 20 }}>
        Create your lab account and enter the workspace immediately. The system auto-loads a ready demo environment for operations.
      </p>

      <div className="grid-12">
        <div className="span-8">
          <MsCard title="Create Lab Account" bodyClassName="ms-section">
            <form onSubmit={handleSignup} className="ms-form-grid">
              <div className="span-6">
                <MsInput
                  label="Lab Name"
                  required
                  value={signup.tenantName}
                  onChange={(e) => setSignup((prev) => ({ ...prev, tenantName: e.target.value }))}
                />
              </div>

              <div className="span-6">
                <MsInput
                  label="Contact Name"
                  required
                  value={signup.contactName}
                  onChange={(e) => setSignup((prev) => ({ ...prev, contactName: e.target.value }))}
                />
              </div>

              <div className="span-6">
                <MsInput
                  label="Admin Email"
                  required
                  type="email"
                  value={signup.adminEmail}
                  onChange={(e) => setSignup((prev) => ({ ...prev, adminEmail: e.target.value }))}
                />
              </div>

              <div className="span-6">
                <MsInput
                  label="Mobile Number"
                  required
                  value={signup.adminPhone}
                  onChange={(e) => setSignup((prev) => ({ ...prev, adminPhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 12) }))}
                />
              </div>

              <div className="span-6">
                <MsInput
                  label="Password"
                  required
                  type="password"
                  value={signup.password}
                  onChange={(e) => setSignup((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div className="span-6">
                <MsInput label="Workspace Code" value={derivedTenantSlug || 'Generated from lab name'} disabled />
              </div>

              <div className="span-12">
                <div className="summary-box" style={{ padding: '12px 14px' }}>
                  Demo users, departments, analyzers, patients, invoices, reports, and audit data will be created automatically for this lab.
                </div>
              </div>

              <div className="span-12">
                <div className="ms-actions">
                  <MsButton type="submit" disabled={!canSignup || loadingSignup}>{loadingSignup ? 'Creating...' : 'Create & Enter'}</MsButton>
                </div>
              </div>
            </form>
          </MsCard>
        </div>

        <div className="span-4">
          <MsCard title="Existing User Login" bodyClassName="ms-section">
            <form onSubmit={handleLogin} className="ms-section">
              <MsInput
                label="Workspace Code (Optional)"
                value={login.tenantSlug}
                onChange={(e) => setLogin((prev) => ({ ...prev, tenantSlug: slugify(e.target.value) }))}
              />

              <MsInput
                label="Email"
                type="email"
                value={login.email}
                onChange={(e) => setLogin((prev) => ({ ...prev, email: e.target.value }))}
              />

              <MsInput
                label="Password"
                type="password"
                value={login.password}
                onChange={(e) => setLogin((prev) => ({ ...prev, password: e.target.value }))}
              />

              <p style={{ marginTop: -4, marginBottom: 4, color: 'var(--color-muted)', fontSize: 13 }}>
                If your email belongs to one workspace, you can login without entering the workspace code.
              </p>

              <MsButton type="submit" disabled={!canLogin || loadingLogin}>{loadingLogin ? 'Logging in...' : 'Login'}</MsButton>
            </form>
          </MsCard>
        </div>
      </div>
    </div>
  );
}
