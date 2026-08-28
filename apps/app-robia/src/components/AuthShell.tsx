import type { ReactNode } from "react";
import { Building2, Check, MapPin, Radar, Route } from "lucide-react";
import { Link } from "react-router-dom";
import logoSnom from "../assets/logo_snom.png";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  footerLabel: string;
  footerLinkLabel: string;
  footerTo: string;
  children: ReactNode;
}

export default function AuthShell({ eyebrow, title, description, footerLabel, footerLinkLabel, footerTo, children }: AuthShellProps) {
  const isRegistration = footerTo === "/login";

  return (
    <main className="min-h-screen bg-slate-bg text-dark lg:grid lg:grid-cols-[minmax(360px,0.82fr)_minmax(520px,1.18fr)]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-navy px-10 py-9 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div className="flex items-center gap-3">
          <img src={logoSnom} alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1.5" />
          <div><p className="text-[15px] font-bold tracking-tight">Rob<span className="text-teal">IA</span> Copilot</p><p className="mt-0.5 text-[11px] text-white/45">Intelligence de visibilité locale</p></div>
        </div>

        <div className="my-auto max-w-lg py-12">
          <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal"><Radar size={15} /> Signal local</p>
          <h1 className="max-w-md text-[40px] font-bold leading-[1.08] tracking-[-0.035em]">Votre activité locale, rendue visible et actionnable.</h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/60">ROBIA rassemble les signaux de votre entreprise, identifie ce qui limite sa visibilité et indique clairement la prochaine action.</p>

          <div className="relative mt-10 h-56 max-w-md overflow-hidden border-y border-white/10" aria-hidden="true">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="absolute left-[42%] top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/15" />
            <div className="absolute left-[42%] top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/30" />
            <div className="absolute left-[42%] top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal text-white"><MapPin size={20} /></div>
            <div className="absolute right-2 top-8 border-l-2 border-orange bg-white/5 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-orange">Opportunité</p><p className="mt-1 text-xs text-white/65">Un signal devient une action.</p></div>
            <div className="absolute bottom-7 left-2 flex items-center gap-2 text-xs text-white/50"><Route size={15} className="text-teal" /> Entreprise → site → visibilité</div>
          </div>
        </div>

        <p className="text-xs leading-5 text-white/35">Un espace sécurisé pour piloter votre présence locale et suivre l’impact de vos actions.</p>
      </aside>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden"><img src={logoSnom} alt="ROBIA Copilot" className="h-9 w-9 rounded-lg bg-white object-contain p-1 ring-1 ring-border" /><span className="text-sm font-bold text-navy">ROBIA Copilot</span></div>
          <p className="text-xs text-muted">{footerLabel} <Link to={footerTo} className="ml-1 font-bold text-teal-dark hover:text-navy hover:underline">{footerLinkLabel}</Link></p>
        </header>

        <div className={`mx-auto flex w-full flex-1 items-center py-10 ${isRegistration ? "max-w-2xl" : "max-w-md"}`}>
          <div className="w-full">
            {isRegistration && <div className="mb-7 flex items-center gap-3" aria-label="Étape 1 sur 2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal text-white"><Check size={14} /></span><span className="h-px flex-1 bg-border" /><span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-xs font-bold text-muted">2</span><span className="ml-1 text-[11px] font-semibold text-muted">Profil entreprise</span></div>}

            <div className="mb-7">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark">{isRegistration ? <Building2 size={14} /> : <Radar size={14} />}{eyebrow}</p>
              <h2 className="text-[30px] font-bold leading-tight tracking-[-0.03em] text-navy md:text-[34px]">{title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>
            </div>

            <div>{children}</div>
            <p className="mt-7 text-center text-xs text-muted lg:hidden">{footerLabel} <Link to={footerTo} className="font-bold text-teal-dark hover:underline">{footerLinkLabel}</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}