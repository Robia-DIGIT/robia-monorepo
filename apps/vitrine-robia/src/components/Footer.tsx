import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, UsersRound, Funnel, CircleCheckBig } from "lucide-react";
import RobiaLogo from "../assets/logo_snom.png";

const LINK_COLUMNS = [
  {
    title: "Produit",
    links: ["Comment ça marche", "Fonctionnalités", "Tarifs", "Intégrations", "Nouveautés"],
  },
  {
    title: "Entreprise",
    links: ["À propos", "Blog", "Carrières", "Partenaires", "Contact"],
  },
  {
    title: "Support",
    links: ["Centre d'aide", "Documentation", "Statut", "CGU", "Confidentialité"],
  },
] as const;

const SOCIAL_ICONS = [BadgeCheck, UsersRound, Funnel, CircleCheckBig] as const;

export function Footer() {
  return (
    <footer className="bg-[#1E293B] px-6 pt-16 pb-8">
      <div className="relative max-w-6xl mx-auto px-6 pt-18 pb-11">

        {/* ── Hero tagline ── */}
        <div className="text-center mb-18 select-none">
          <p className="font-[Roboto] font-black leading-[0.92] tracking-[-0.045em] text-white/[0.08]"
            style={{ fontSize: 'clamp(48px, 10vw, 120px)' }}>
            BE FOUND.
          </p>
          <p className="font-[Roboto] font-black leading-[0.92] tracking-[-0.045em] text-turquoise"
            style={{ fontSize: 'clamp(48px, 10vw, 120px)', textShadow: '0 0 60px rgba(20,184,166,0.35)' }}>
            GROW.
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center">
              <img className="h-9 w-auto brightness-0 invert" src={RobiaLogo} alt="Logo Robia" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              L'AI Execution Copilot qui gère votre présence en ligne pendant que vous vous
              occupez de votre activité.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_ICONS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Réseau social"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {LINK_COLUMNS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© 2026 ROBIA Digital. Tous droits réservés.</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={12} />
            <span>Antananarivo, Madagascar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}