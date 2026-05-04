export default function MsModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-card ms-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ms-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          <button className="ms-btn ms-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="ms-card-body">{children}</div>
      </div>
    </div>
  );
}
