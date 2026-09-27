import type { ReactNode } from "react"

export type Column = { label: string; num?: boolean }
export type Row = { key: string; cells: ReactNode[] }

export function Table({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  const numClass = (column: Column) => (column.num === true ? "sas-table__num" : undefined)
  return (
    <table className="sas-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.label} scope="col" className={numClass(column)}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell, index) => (
              <td key={columns[index].label} data-label={columns[index].label} className={numClass(columns[index])}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
