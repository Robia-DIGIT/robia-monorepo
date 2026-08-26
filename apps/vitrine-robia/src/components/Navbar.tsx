import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import RobiaLogo from "../assets/logo_snom.png";

function useScrolled(threshold = 30) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return scrolled;
}

const NAV_LINKS = [
  { label: "Produit", href: "#produit" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Cas d'usage", href: "#cas" },
  { label: "Blog", href: "#blog" },
];

export function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const close = useCallback(() => setOpen(false), []);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Close on Escape, close on outside click
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e : KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClickOutside = (e : MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open, close]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5 sm:pt-2"
      >
        <div
          className={cn(
            "flex h-14 w-full max-w-7xl items-center justify-between rounded-full px-3 transition-all duration-300 sm:h-16 sm:rounded-4xl sm:px-6",
            scrolled
              ? "border border-white/50 bg-white/80 shadow-xl backdrop-blur-2xl"
              : "border border-white/20 bg-white/40 backdrop-blur-xl"
          )}
        >
          {/* Logo */}
          <Link
            to="/"
            onClick={close}
            className="flex shrink-0 items-center gap-3 transition-transform duration-300 hover:scale-105"
          >
            <img
              src={RobiaLogo}
              alt="Robia"
              className="h-7 w-auto sm:h-9"
            />
          </Link>

          {/* Desktop nav — only shown once there's real room for it */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative rounded-full px-3 py-2 text-sm font-medium text-slate-800 transition-all duration-300 hover:bg-orange-50 hover:text-slate-900 xl:px-4"
              >
                {item.label}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 origin-left scale-x-0 rounded-full bg-[#F97316] transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            <Link
              to="https://app.robia.digital/login"
              className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-900 xl:px-4"
            >
              Connexion
            </Link>

            <a
              href="#tarifs"
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#F97316] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 active:scale-95 xl:px-5 xl:py-4"
            >
              Commencer gratuitement
              <ChevronRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </div>

          {/* Mobile / tablet toggle */}
          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-800 transition-colors duration-300 hover:bg-slate-100 active:bg-slate-200 lg:hidden"
          >
            <div className={cn("transition-transform duration-300", open && "rotate-90")}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </div>
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Mobile / tablet menu */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-40 origin-top overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-xl backdrop-blur-2xl transition-all duration-300 sm:inset-x-5 sm:top-24 lg:hidden",
          open
            ? "max-h-[calc(100vh-6rem)] scale-100 opacity-100"
            : "pointer-events-none max-h-0 scale-95 opacity-0"
        )}
      >
        <nav className="flex max-h-[calc(100vh-8rem)] flex-col overflow-y-auto p-4 sm:p-5">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={close}
              className="rounded-xl px-4 py-3.5 text-base text-slate-700 transition hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100 sm:text-sm"
            >
              {item.label}
            </a>
          ))}
          <hr className="my-3 border-slate-200 sm:my-4" />
          <Link
            to="https://app.robia.digital/login"
            onClick={close}
            className="rounded-xl px-4 py-3.5 text-base text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 sm:text-sm"
          >
            Connexion
          </Link>
          <a
            href="#tarifs"
            onClick={close}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea6a13] active:scale-[0.98] sm:text-sm"
          >
            Commencer gratuitement
            <ChevronRight size={16} />
          </a>
        </nav>
      </div>
    </>
  );
}