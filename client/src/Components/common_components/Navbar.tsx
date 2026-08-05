/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BookIcon from "../../assets/Icons/BookIcon";
import { Loader, LogOut, SearchIcon } from "lucide-react";
import profilePicture from "../../assets/png/profilePic.png";
import { useAuth } from "../../context/useAuth";
const navLinks = ["Discover", "Shelves", "Community", "Lists"];

interface BookSuggestion {
  id: string;
  title: string;
  authors: string[];
  thumbnail?: string;
}

interface SearchBookResponse {
  data: Array<{
    googleId: string;
    id?: string;
    title: string;
    authors?: string[];
    thumbnail?: string;
  }>;
}

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const debounceId = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axios.get<SearchBookResponse>(
          `${API_BASE_URL}/searchbookdata`,
          {
            params: { q: searchTerm },
          },
        );

        const books = response.data?.data || [];
        setSuggestions(
          books.map((book) => ({
            id: book.googleId || book.id || "",
            title: book.title || "Unknown title",
            authors: book.authors || [],
            thumbnail: book.thumbnail || "",
          })),
        );
        setIsSearching(false);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error fetching book suggestions:", error);
        setSuggestions([]);
        setIsSearching(false);
      }
    }, 500);

    return () => window.clearTimeout(debounceId);
  }, [API_BASE_URL, searchTerm]);

  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   // localStorage.removeItem("userProfile");
  //   setIsLoggedIn(false);
  //   window.location.href = "/home";
  // };
  useEffect(() => {
    console.log(suggestions);
  }, [suggestions]);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-16 py-[1.1rem] bg-[rgba(247,243,236,0.9)] backdrop-blur-md border-b border-border-ink">
      <a href="#" className="flex items-center gap-2 no-underline">
        <div
          className="w-7 h-7 bg-sienna flex items-center justify-center shrink-0"
          style={{ borderRadius: "4px 12px 4px 12px" }}
        >
          <BookIcon />
        </div>
        <Link
          to="/"
          className="font-lora text-2xl font-semibold text-ink tracking-tight"
        >
          Pagebind
        </Link>
      </a>

      <ul className="hidden md:flex font-dm items-center gap-8 list-none">
        {navLinks.map((link) => (
          <li key={link}>
            <a
              href={
                link === "Discover"
                  ? "/discover"
                  : link === "Shelves"
                    ? "/dashboard"
                    : "#"
              }
              className="text-sm text-ink-soft no-underline font-normal hover:text-ink transition-colors duration-200"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
      <div
        ref={searchRef}
        className="hidden lg:flex relative items-center bg-[#f7f3ec] border border-border-ink rounded-xl px-4 py-2 gap-2 w-80"
      >
        <div className=" flex-1">
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onKeyDown={(event) => {
              if (!showDropdown || suggestions.length === 0) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlightedIndex((current) =>
                  Math.min(current + 1, suggestions.length - 1),
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex((current) => Math.max(current - 1, 0));
              }
              if (event.key === "Enter" && highlightedIndex >= 0) {
                event.preventDefault();
                const selected = suggestions[highlightedIndex];
                if (selected) {
                  setSearchTerm(selected.title);
                  setShowDropdown(false);
                  navigate(`/book-details/${selected.id}`);
                }
              }
              if (event.key === "Escape") {
                setShowDropdown(false);
              }
            }}
            className="bg-transparent text-sm text-ink placeholder:text-ink-soft outline-none w-full"
          />
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-40  rounded-xl border border-border-ink bg-white shadow-lg">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-ink-soft">
                  Searching...
                </div>
              ) : suggestions.length > 0 ? (
                <ul className="max-h-72 rounded-md overflow-auto">
                  {suggestions
                    .filter((item) => item.thumbnail !== "")
                    .map((suggestion, index) => (
                      <li
                        key={suggestion.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSearchTerm(suggestion.title);
                          setShowDropdown(false);
                          navigate(`/book-details/${suggestion.id}`);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors duration-150 ${
                          highlightedIndex === index
                            ? "bg-cream text-ink"
                            : "bg-white text-ink-soft hover:bg-cream"
                        }`}
                      >
                        <div className="h-12 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {suggestion.thumbnail ? (
                            <img
                              src={suggestion.thumbnail}
                              alt={suggestion.title}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-ink">
                            {suggestion.title}
                          </div>
                          <div className="truncate text-xs text-ink-soft">
                            {suggestion.authors?.join(", ") || "Unknown author"}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-ink-soft">
                  No books found.
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (suggestions.length > 0) {
              navigate(`/book-details/${suggestions[0].id}`);
            }
          }}
          className="text-sm text-ink-soft px-2 py-2 shrink-0 rounded-lg hover:bg-cream-deep hover:text-ink transition-colors duration-200"
        >
          {isSearching ? (
            <Loader className="w-4 h-4" />
          ) : (
            <SearchIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className=" font-dm flex items-center gap-3">
        {!isAuthenticated ? (
          <>
            <a
              href="/login"
              className="text-sm text-ink-soft px-4 py-2 rounded-lg hover:bg-cream-deep transition-colors duration-200 no-underline"
            >
              Sign in
            </a>
            <a
              href="/signup-page"
              className="text-sm font-medium font-dm text-white bg-sienna px-5 py-2.25 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all duration-200 no-underline"
            >
              Get started
            </a>
          </>
        ) : (
          <>
            {profilePicture && (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <button
              onClick={logout}
              className="text-sm text-ink-soft flex flex-row gap-2 px-4 py-2 rounded-lg hover:bg-cream-deep transition-colors duration-200 bg-transparent border-none cursor-pointer"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
