export default function MsBadge({ status = 'normal' }) {
  const value = String(status).toUpperCase();
  const cls = value.includes('CRITICAL') || value.includes('ABNORMAL') ? 'ms-badge ms-badge-abnormal' : value.includes('PENDING') || value.includes('IN_PROGRESS') ? 'ms-badge ms-badge-pending' : 'ms-badge ms-badge-normal';
  return <span className={cls}>{value}</span>;
}
