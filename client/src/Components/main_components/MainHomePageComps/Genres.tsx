import React, { useState } from 'react'

interface Genre {
  emoji: string
  name: string
  count: string
}

const genres: Genre[] = [
  { emoji: '📖', name: 'Literary Fiction', count: '42k' },
  { emoji: '🔮', name: 'Fantasy', count: '98k' },
  { emoji: '🔬', name: 'Sci-Fi', count: '74k' },
  { emoji: '🔍', name: 'Mystery', count: '56k' },
  { emoji: '💘', name: 'Romance', count: '115k' },
  { emoji: '📜', name: 'Historical', count: '38k' },
  { emoji: '😨', name: 'Thriller', count: '61k' },
  { emoji: '🧠', name: 'Non-fiction', count: '89k' },
  { emoji: '👻', name: 'Horror', count: '33k' },
  { emoji: '🌍', name: 'Translated', count: '28k' },
  { emoji: '🎭', name: 'Short Stories', count: '19k' },
  { emoji: '🧒', name: 'YA', count: '67k' },
]

export const Genres: React.FC = () => {
  const [active, setActive] = useState('Literary Fiction')

  return (
    <div className="bg-[#EFE8DB] py-16 px-8 lg:px-16">
      <div className="max-w-[1400px] mx-auto">
        <span className="text-[0.75rem] uppercase tracking-widest font-medium text-sienna mb-4 block">Browse by genre</span>
        <h2 className="font-lora text-[clamp(1.8rem,3vw,2.8rem)] leading-tight tracking-tight text-ink">
          Whatever you're in the mood for
        </h2>
        <div className="flex flex-wrap gap-3 mt-8">
          {genres.map(({ emoji, name, count }) => (
            <button
              key={name}
              onClick={() => setActive(name)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.875rem] cursor-pointer transition-all duration-200 border whitespace-nowrap hover:-translate-y-0.5 ${
                active === name
                  ? 'bg-sienna text-white border-sienna'
                  : 'bg-white text-[#4A4640] border-[rgba(28,26,22,0.12)] hover:bg-sienna hover:text-white hover:border-sienna'
              }`}
            >
              {emoji} {name}
              <span className={`text-[0.72rem] ${active === name ? 'opacity-70' : 'opacity-50'}`}>{count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
