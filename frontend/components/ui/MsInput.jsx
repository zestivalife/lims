export default function MsInput({ label, required = false, error = '', as = 'input', className = '', ...props }) {
  const InputTag = as;
  return (
    <div>
      {label && <label className="ms-label">{label}{required ? ' *' : ''}</label>}
      <InputTag className={as === 'textarea' ? `ms-textarea ${className}` : `ms-input ${className}`} {...props} />
      {error ? <div style={{ color: 'var(--color-error)', marginTop: 4, fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}
