import React from 'react'

interface GenrePillsProps {
  genres: string[]
}

export const GenrePills: React.FC<GenrePillsProps> = ({ genres }) => (
  <div className="mb-8">
    <p className="text-[0.72rem] uppercase tracking-[0.08em] text-ink-muted font-medium mb-2.5">Genres</p>
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <a
          key={genre}
          href="#"
          className="bg-white border border-[rgba(28,26,22,0.14)] rounded-full px-3.5 py-[5px] text-[0.8rem] text-ink-soft no-underline font-dm transition-all duration-200 hover:bg-sienna-pale hover:border-sienna hover:text-sienna"
        >
          {genre}
        </a>
      ))}
    </div>
  </div>
)
