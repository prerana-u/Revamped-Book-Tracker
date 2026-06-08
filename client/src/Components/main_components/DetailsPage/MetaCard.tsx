import React from 'react'

interface MetaRow {
  key: string
  value: string
}

interface MetaCardProps {
  rows: MetaRow[]
}

export const MetaCard: React.FC<MetaCardProps> = ({ rows }) => (
  <div className="w-full bg-white border border-[rgba(28,26,22,0.1)] rounded-[10px] p-4 text-[0.78rem]">
    {rows.map((row, i) => (
      <div
        key={row.key}
        className={`flex justify-between items-center py-1 ${
          i < rows.length - 1 ? 'border-b border-[rgba(28,26,22,0.06)]' : ''
        }`}
      >
        <span className="text-ink-muted">{row.key}</span>
        <span className="font-medium text-ink text-right">{row.value}</span>
      </div>
    ))}
  </div>
)
