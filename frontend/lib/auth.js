export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken') || '';
}

export function setSession(session) {
  if (typeof window === 'undefined') return;
  if (session?.accessToken) localStorage.setItem('accessToken', session.accessToken);
  if (session?.refreshToken) localStorage.setItem('refreshToken', session.refreshToken);

  const user = session?.user || {
    id: 'patient-portal',
    role: 'PATIENT',
    email: 'patient@portal.local',
    tenantId: 'tenant-demo'
  };
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function hasSession() {
  return Boolean(getToken());
}
