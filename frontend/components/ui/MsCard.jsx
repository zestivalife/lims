export default function MsCard({ title, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`ms-card ${className}`.trim()}>
      {title ? <div className="ms-card-header">{title}</div> : null}
      <div className={`ms-card-body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}
