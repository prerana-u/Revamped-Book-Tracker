import React from 'react'

interface EditionRow {
  key: string
  value: string
}

interface EditionTableProps {
  rows: EditionRow[]
}

export const EditionTable: React.FC<EditionTableProps> = ({ rows }) => (
  <div>
    <h3 className="font-lora text-[1.1rem] font-semibold text-ink mb-3.5">This edition</h3>
    <table className="w-full text-[0.875rem] border-collapse">
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.key} className={i < rows.length - 1 ? 'border-b border-[rgba(28,26,22,0.07)]' : ''}>
            <td className="py-2.5 text-ink-muted w-[120px]">{row.key}</td>
            <td className="py-2.5 font-medium text-ink">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
