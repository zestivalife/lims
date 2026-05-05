'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import { useToast } from '@/components/ui/ToastProvider';

const defaultSignup = {
  tenantName: '',
  tenantSlug: '',
  adminEmail: '',
  adminPhone: '',
  password: '',
  countryKey: 'IN'
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

  const canSignup = useMemo(
    () =>
      signup.tenantName.trim() &&
      signup.tenantSlug.trim() &&
      signup.adminEmail.trim() &&
      signup.adminPhone.trim() &&
      signup.password.trim(),
    [signup]
  );

  const canLogin = useMemo(
    () => login.tenantSlug.trim() && login.email.trim() && login.password.trim(),
    [login]
  );

  async function handleSignup(e) {
    e.preventDefault();
    if (!canSignup) {
      toast.warning('Please complete all required fields.');
      return;
    }

    setLoadingSignup(true);
    try {
      await api.post('/api/onboarding/step1', signup, false);
      toast.success('Account created. Logging you in.');

      const result = await api.post(
        '/api/auth/login',
        {
          tenantSlug: signup.tenantSlug,
          email: signup.adminEmail,
          password: signup.password
        },
        false
      );
      setSession(result);
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
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
      const result = await api.post('/api/auth/login', login, false);
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
    <div className="page" style={{ maxWidth: 1280, margin: '0 auto' }}>
      <h1 className="page-title" style={{ marginBottom: 10 }}>Welcome to LIMS</h1>
      <p style={{ marginTop: 0, color: 'var(--color-muted)', marginBottom: 20 }}>Create your lab account and start directly. Configuration can be done inside the system.</p>

      <div className="grid-12">
        <div className="span-8">
          <MsCard title="Create Lab Account" bodyClassName="ms-section">
            <form onSubmit={handleSignup} className="ms-form-grid">
              <div className="span-6">
                <MsInput
                  label="Lab Name"
                  required
                  value={signup.tenantName}
                  onChange={(e) => {
                    const tenantName = e.target.value;
                    setSignup((prev) => ({
                      ...prev,
                      tenantName,
                      tenantSlug: prev.tenantSlug || slugify(tenantName)
                    }));
                  }}
                />
              </div>

              <div className="span-6">
                <MsInput
                  label="Lab Slug"
                  required
                  value={signup.tenantSlug}
                  onChange={(e) => setSignup((prev) => ({ ...prev, tenantSlug: slugify(e.target.value) }))}
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
                  label="Admin Phone"
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
                <label className="ms-label">Country</label>
                <select
                  className="ms-select"
                  value={signup.countryKey}
                  onChange={(e) => setSignup((prev) => ({ ...prev, countryKey: e.target.value }))}
                >
                  <option value="IN">India</option>
                  <option value="US">USA</option>
                  <option value="EU">EU</option>
                  <option value="UK">UK</option>
                  <option value="ME_AED">UAE</option>
                  <option value="ME_SAR">Saudi Arabia</option>
                </select>
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
                label="Tenant Slug"
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

              <MsButton type="submit" disabled={!canLogin || loadingLogin}>{loadingLogin ? 'Logging in...' : 'Login'}</MsButton>
            </form>
          </MsCard>
        </div>
      </div>
    </div>
  );
}
