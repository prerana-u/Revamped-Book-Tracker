import BookIcon from "../../assets/Icons/BookIcon";
import Navbar from "../common_components/Navbar";
import { Features } from "./MainHomePageComps/Features";
import GenresSection from "./MainHomePageComps/GenresSection";
import { Hero } from "./MainHomePageComps/Hero";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 w-full">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <Navbar />
      </header>

      <main className="">
        <Hero />
        <Features />
        <GenresSection />
      </main>

      <footer
        id="footer"
        className="border-t border-slate-200 bg-ink text-white px-4 py-4 sm:px-6 lg:px-14 "
      >
        <div className=" flex w-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-row gap-4">
              <div
                className="w-7 h-7 bg-sienna flex items-center justify-center shrink-0"
                style={{ borderRadius: "4px 12px 4px 12px" }}
              >
                <BookIcon />
              </div>
              <p className="text-base font-semibold ">PageBind</p>
            </div>

            <p className="mt-2 text-sm text-slate-300">
              Keep your reading journey organized and visible.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-200">
            <a href="#features" className="hover:text-slate-500">
              Features
            </a>
            <a href="#about" className="hover:text-slate-500">
              About
            </a>
            <a
              href="mailto:hello@pagebind.app"
              className="hover:text-slate-500"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
