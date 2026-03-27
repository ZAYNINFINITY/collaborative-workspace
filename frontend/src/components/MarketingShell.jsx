import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import logoImage from "../assets/collab-logo.png";
import { useAuth } from "../auth/useAuth";

const navLinkClassName = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? "bg-white/10 text-white"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

const MarketingShell = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImage} alt="Collab" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-semibold text-cyan-300">Collab</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <NavLink to="/features" className={navLinkClassName}>
              Features
            </NavLink>
            <NavLink to="/pricing" className={navLinkClassName}>
              Pricing
            </NavLink>
            <NavLink to="/security" className={navLinkClassName}>
              Security
            </NavLink>
            <NavLink to="/contact" className={navLinkClassName}>
              Contact
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex rounded-lg border border-white/20 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-black/20 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
              <NavLink
                to="/features"
                className={navLinkClassName}
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </NavLink>
              <NavLink
                to="/pricing"
                className={navLinkClassName}
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </NavLink>
              <NavLink
                to="/security"
                className={navLinkClassName}
                onClick={() => setMobileMenuOpen(false)}
              >
                Security
              </NavLink>
              <NavLink
                to="/contact"
                className={navLinkClassName}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </NavLink>
            </nav>
          </div>
        )}
      </header>

      {children}

      <footer className="border-t border-white/10 bg-white/5 py-10 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Collab Workspace
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <NavLink to="/privacy" className={navLinkClassName}>
                Privacy
              </NavLink>
              <NavLink to="/terms" className={navLinkClassName}>
                Terms
              </NavLink>
              <NavLink to="/contact" className={navLinkClassName}>
                Contact
              </NavLink>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/45">
            Collab is a real-time team workspace for chat, tasks, notes, and documents.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MarketingShell;
