export default function MsCard({ title, children }) {
  return (
    <section className="ms-card">
      {title ? <div className="ms-card-header">{title}</div> : null}
      <div className="ms-card-body">{children}</div>
    </section>
  );
}
