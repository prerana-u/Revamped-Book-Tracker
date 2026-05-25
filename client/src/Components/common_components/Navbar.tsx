/* eslint-disable react-hooks/set-state-in-effect */

import BookIcon from "../../assets/Icons/BookIcon";
import { LogOut } from "lucide-react";
import profilePicture from "../../assets/png/profilePic.png";
import { useAuth } from "../../context/useAuth";
const navLinks = ["Discover", "Shelves", "Community", "Lists"];

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  // const [profilePicture, setProfilePicture] = useState("");

  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   // localStorage.removeItem("userProfile");
  //   setIsLoggedIn(false);
  //   window.location.href = "/home";
  // };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-16 py-[1.1rem] bg-[rgba(247,243,236,0.9)] backdrop-blur-md border-b border-[rgba(28,26,22,0.12)]">
      <a href="#" className="flex items-center gap-2 no-underline">
        <div
          className="w-7 h-7 bg-sienna flex items-center justify-center shrink-0"
          style={{ borderRadius: "4px 12px 4px 12px" }}
        >
          <BookIcon />
        </div>
        <span className="font-lora text-2xl font-semibold text-ink tracking-tight">
          Pagebind
        </span>
      </a>
      <ul className="hidden md:flex font-dm items-center gap-8 list-none">
        {navLinks.map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-sm text-ink-soft no-underline font-normal hover:text-ink transition-colors duration-200"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
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
              href="/signup-pagea"
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
