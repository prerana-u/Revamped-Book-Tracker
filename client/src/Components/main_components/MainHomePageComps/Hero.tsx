import React from "react";

interface BookProps {
  width: number;
  height: number;
  gradient: string;
  title: string;
}

const Book: React.FC<BookProps> = ({ width, height, gradient, title }) => (
  <div
    className="rounded-[3px_6px_6px_3px] cursor-pointer transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-4 hover:-rotate-2 relative flex-shrink-0"
    style={{
      width,
      height,
      background: gradient,
      boxShadow: "3px 4px 12px rgba(0,0,0,0.22)",
    }}
  >
    <div className="book-spine absolute inset-0 flex items-center justify-center font-lora italic text-[0.65rem] text-white/85 px-1 py-2 select-none">
      {title}
    </div>
  </div>
);

const books: BookProps[] = [
  {
    width: 42,
    height: 190,
    gradient: "linear-gradient(170deg,#8B2E2E,#C44040)",
    title: "The Name of the Rose",
  },
  {
    width: 38,
    height: 210,
    gradient: "linear-gradient(170deg,#2D4A6E,#3A6B9E)",
    title: "Shadow of Wind",
  },
  {
    width: 46,
    height: 175,
    gradient: "linear-gradient(170deg,#3D6B35,#5A9E4E)",
    title: "The Midnight Library",
  },
  {
    width: 40,
    height: 220,
    gradient: "linear-gradient(170deg,#6B3D7A,#9E5AB0)",
    title: "Normal People",
  },
  {
    width: 44,
    height: 195,
    gradient: "linear-gradient(170deg,#7A6230,#B5912A)",
    title: "Piranesi",
  },
  {
    width: 36,
    height: 185,
    gradient: "linear-gradient(170deg,#2E5F6B,#3D8A9E)",
    title: "Anxious People",
  },
  {
    width: 48,
    height: 205,
    gradient: "linear-gradient(170deg,#6B2E2E,#9E4040)",
    title: "Fourth Wing",
  },
  {
    width: 38,
    height: 178,
    gradient: "linear-gradient(170deg,#4A3D6B,#6A5A9E)",
    title: "Verity",
  },
];

const stats = [
  { num: "1000+", label: "Books catalogued" },
  { num: "8+", label: "Listed genres" },
  { num: "10+", label: "Books shelved" },
];

export const Hero: React.FC = () => (
  <section className="bg-cream min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center px-8 lg:px-20 pt-24 pb-16 gap-16 ">
    {/* Left: text */}
    <div className="pt-8">
      <div className="inline-flex items-center gap-1.5 font-dm bg-sienna-pale border border-sienna-light text-sienna text-[0.78rem] font-medium px-3.5 py-1 rounded-full mb-7 uppercase tracking-wider animate-fade-up animation-delay-100">
        ✦ For every kind of reader
      </div>

      <h1 className="font-lora font-semibold text-[clamp(2.6rem,4.5vw,3.8rem)] leading-[1.15] tracking-tight text-ink mb-5 animate-fade-up animation-delay-200">
        Your reading life,
        <br />
        <em className="italic text-sienna">beautifully</em> tracked.
      </h1>

      <p className="text-[1.05rem] leading-relaxed text-ink-soft max-w-110 mb-10 font-light animate-fade-up animation-delay-300">
        Discover your next great book, build shelves that tell your story, and
        connect with readers who get you. Every page, every thought — all in one
        place.
      </p>

      <div className="flex items-center gap-4 flex-wrap animate-fade-up animation-delay-400">
        <a
          href="#"
          className="text-base font-medium text-white bg-sienna px-7 py-3.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 no-underline"
        >
          Start for free
        </a>
        <a
          href="#"
          className="text-base text-ink border border-[rgba(28,26,22,0.2)] px-6 py-3.5 rounded-xl hover:border-ink-soft hover:bg-white transition-all duration-200 no-underline"
        >
          Browse books →
        </a>
      </div>

      <div className="flex gap-8 mt-10 pt-8 border-t border-border-ink animate-fade-up animation-delay-500">
        {stats.map(({ num, label }) => (
          <div key={label}>
            <div className="font-lora text-[1.6rem] font-semibold text-ink">
              {num}
            </div>
            <div className="text-[0.8rem] text-ink-muted font-normal mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Right: visual */}
    <div className="relative flex justify-center items-center h-135">
      {/* Profile card */}
      <div className="absolute top-8 right-0 lg:-right-8 bg-white border border-border-ink rounded-2xl p-4 w-52 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-float-card z-10">
        <div className="text-[0.7rem] uppercase tracking-widest text-ink-muted mb-2.5">
          📖 Currently reading
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-[52px] rounded-[2px_4px_4px_2px] shrink-0"
            style={{ background: "linear-gradient(135deg,#2D4A6E,#4A7BAF)" }}
          />
          <div>
            <div className="font-lora text-[0.8rem] font-semibold leading-snug text-ink">
              The Shadow of the Wind
            </div>
          </div>
        </div>
        <div className="mt-2.5 bg-cream-deep rounded h-1.25 overflow-hidden">
          <div
            className="h-full bg-sienna rounded animate-fill-bar"
            style={{ width: "62%" }}
          />
        </div>
        <div className="text-[0.68rem] text-ink-muted mt-1">
          62% complete · pg 312 of 501
        </div>
      </div>

      {/* Bookshelf */}
      <div className="relative w-full max-w-120">
        <div className="flex items-end gap-1.5 pb-4 justify-center">
          {books.map((book) => (
            <Book key={book.title} {...book} />
          ))}
        </div>
        {/* Shelf plank */}
        <div
          className="absolute bottom-0 -left-2 -right-2 h-4 rounded"
          style={{
            background: "linear-gradient(180deg,#C4A67A 0%,#9B7B50 100%)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        />
      </div>

      {/* Stars card */}
      <div className="absolute bottom-16 -left-5 bg-white border border-border-ink rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-float-card-delayed w-44 z-10 hidden lg:block">
        <div className="flex gap-0.5 mb-1.5">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-gold text-base">
              ★
            </span>
          ))}
        </div>
        <div className="text-[0.75rem] text-ink-soft leading-snug">
          <span className="font-medium text-ink">
            "An absolute masterpiece."
          </span>
          <br />— NYT Bestseller List
        </div>
      </div>
    </div>
  </section>
);
