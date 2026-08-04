import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import RobiaLogo from "../assets/logo_snom.png";

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);

    window.addEventListener("scroll", handler, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handler);
  }, []);

  return scrolled;
}

const NAV_LINKS = [
  {
    label: "Produit",
    href: "#produit",
  },
  {
    label: "Tarifs",
    href: "#tarifs",
  },
  {
    label: "Cas d'usage",
    href: "#cas",
  },
  {
    label: "Blog",
    href: "#blog",
  },
];

export function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-1 left-0 right-0 z-50 flex justify-center px-5">
        <div
          className={cn(
            "w-full max-w-7xl h-16 rounded-[2rem] transition-all duration-300",
            "flex items-center justify-between px-6",
            scrolled
              ? "bg-white/80 backdrop-blur-2xl border border-white/50 shadow-xl"
              : "bg-white/40 backdrop-blur-xl border border-white/20"
          )}
        >
          {/* Logo */}

          <a
            href="#"
            className="flex items-center gap-3 transition-transform duration-300 hover:scale-105"
          >
            <img
              src={RobiaLogo}
              alt="Robia"
              className="h-9 w-auto"
            />
          </a>

          {/* Desktop */}

          <nav className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative rounded-full px-4 py-2 text-sm font-medium text-slate-800 transition-all duration-300 hover:bg-orange-50 hover:text-slate-900"
              >
                {item.label}

                <span
                  className="
                    absolute
                    left-4
                    right-4
                    bottom-1
                    h-[2px]
                    origin-left
                    scale-x-0
                    rounded-full
                    bg-[#F97316]
                    transition-transform
                    duration-300
                    group-hover:scale-x-100
                  "
                />
              </a>
            ))}
          </nav>

          {/* CTA */}

          <div className="hidden md:flex items-center gap-3">
            <a
              href="#"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Connexion
            </a>

            <a
              href="#tarifs"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-[#F97316]
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-orange-500/20
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:shadow-xl
                hover:shadow-orange-500/30
                active:scale-95
              "
            >
              Commencer gratuitement

              <ChevronRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </div>

          {/* Mobile button */}

          <button
            aria-label="Menu"
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 transition-all duration-300 hover:bg-slate-100 md:hidden"
          >
            <div
              className={cn(
                "transition-transform duration-300",
                open && "rotate-90"
              )}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}

      <div
        className={cn(
          "fixed left-5 right-5 top-24 z-40 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl transition-all duration-300 md:hidden",
          open
            ? "max-h-[450px] opacity-100"
            : "max-h-0 opacity-0 border-0"
        )}
      >
        <nav className="flex flex-col p-5">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"
            >
              {item.label}
            </a>
          ))}

          <hr className="my-4 border-slate-200" />

          <a
            href="#"
            onClick={() => setOpen(false)}
            className="rounded-xl px-4 py-3 text-slate-700 transition hover:bg-slate-100"
          >
            Connexion
          </a>

          <a
            href="#tarifs"
            onClick={() => setOpen(false)}
            className="mt-3 rounded-xl bg-[#F97316] px-5 py-3 text-center font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea6a13]"
          >
            Commencer gratuitement
          </a>
        </nav>
      </div>
    </>
  );
}