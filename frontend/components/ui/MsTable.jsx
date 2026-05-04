import MsBadge from './MsBadge';

export default function MsTable({ columns, rows, statusKey, onSort, sortKey, paginationLabel = 'Pagination ready' }) {
  return (
    <div className="ms-table-wrap">
      <table className="ms-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} onClick={() => onSort?.(c.key)} style={{ cursor: onSort ? 'pointer' : 'default' }}>
                {c.label} {sortKey === c.key ? '↑↓' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className={row.abnormal ? 'abnormal-row' : ''}>
              {columns.map((c) => (
                <td key={c.key}>
                  {statusKey === c.key ? <MsBadge status={row[c.key]} /> : c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', marginTop: 12, color: 'var(--color-muted)' }}>{paginationLabel}</div>
    </div>
  );
}
