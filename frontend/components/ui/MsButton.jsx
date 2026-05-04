export default function MsButton({ variant = 'primary', type = 'button', disabled = false, onClick, children, className = '' }) {
  const cls = variant === 'secondary' ? 'ms-btn ms-btn-secondary' : variant === 'danger' ? 'ms-btn ms-btn-danger' : 'ms-btn ms-btn-primary';
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${cls} ${className}`.trim()}>
      {children}
    </button>
  );
}
