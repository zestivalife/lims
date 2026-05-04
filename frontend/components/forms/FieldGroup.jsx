export default function FieldGroup({ children, cols = 2 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        gap: 16
      }}
    >
      {children}
    </div>
  );
}
