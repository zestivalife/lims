export function toCurrency(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value));
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9+]/g, '');
}

export function nowIso() {
  return new Date().toISOString();
}
