import React from "react";
import SvgIcon from "../../common_components/SvgIcon";
import BookIcon from "../../../assets/svg/books.svg";
import dartIcon from "../../../assets/svg/dart.svg";
import magnifyingGlassIcon from "../../../assets/svg/magnifyingglass.svg";
import penIcon from "../../../assets/svg/pen.svg";
import statsIcon from "../../../assets/svg/stats.svg";

interface Feature {
  icon: React.ReactNode;
  bg: string;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: (
      <SvgIcon
        src={BookIcon}
        alt={"Books Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
    bg: "#FAF0EA",
    title: "Infinite shelves",
    desc: "Organise your library your way. Create custom shelves for any mood, project, or obsession. Reading, loved, abandoned — it's all valid.",
  },
  {
    icon: (
      <SvgIcon
        src={magnifyingGlassIcon}
        alt={"Magnifying Glass Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
    bg: "#EEF5E5",
    title: "Smart discovery",
    desc: "Get recommendations that actually understand your taste — not just bestsellers, but hidden gems matched to your reading history and ratings.",
  },
  {
    icon: (
      <SvgIcon
        src={statsIcon}
        alt={"Stats Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
    bg: "#FBF3DC",
    title: "Reading stats",
    desc: "See how many pages you've read, your favourite genres, and how your reading habits shift across the seasons. Your year in books, made beautiful.",
  },
  {
    icon: (
      <SvgIcon src={penIcon} alt={"Pen Icon"} className="w-6 h-6 text-sienna" />
    ),
    bg: "#E8F0FB",
    title: "Notes & highlights",
    desc: "Capture the sentences that stop you mid-page. Keep private reading notes or share quotes that moved you with your community.",
  },
  {
    icon: (
      <SvgIcon
        src={dartIcon}
        alt={"Dart Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
    bg: "#FAF0EA",
    title: "Reading challenges",
    desc: "Set annual reading goals, join themed challenges, and celebrate every milestone. The best motivation is the one that feels like play.",
  },
];

export const Features: React.FC = () => (
  <section className="py-24 px-8 lg:px-16 bg-cream mx-auto">
    <span className="text-[0.75rem] font-dm uppercase tracking-widest font-medium text-sienna mb-4 block">
      Features
    </span>
    <h2 className="font-lora font-medium text-[clamp(1.8rem,3vw,2.8rem)] leading-tight tracking-tight text-ink mb-4 max-w-140">
      Everything a reader needs
    </h2>
    <p className="font-dm text-base text-ink-soft leading-relaxed max-w-120 font-light mb-14">
      From the book you just finished to the one you've been meaning to read for
      years — Pagebind keeps it all beautifully organised.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map(({ icon, bg, title, desc }) => (
        <div
          key={title}
          className="bg-white border border-border-ink rounded-2xl p-8 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-default"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5"
            style={{ background: bg }}
          >
            {icon}
          </div>
          <h3 className="font-lora text-[1.1rem] font-semibold text-ink mb-2.5">
            {title}
          </h3>
          <p className="text-[0.875rem] leading-relaxed text-ink-soft font-light">
            {desc}
          </p>
        </div>
      ))}
    </div>
  </section>
);
