export default function MsBadge({ status = 'normal', label }) {
  const value = String(status || '').toUpperCase();
  const cls = value.includes('CRITICAL') || value.includes('ABNORMAL') || value.includes('FAILED') || value.includes('INACTIVE')
    ? 'ms-badge ms-badge-abnormal'
    : value.includes('PENDING') || value.includes('IN_PROGRESS') || value.includes('BOOKED')
      ? 'ms-badge ms-badge-pending'
      : 'ms-badge ms-badge-normal';
  return <span className={cls}>{String(label || status).toUpperCase()}</span>;
}
