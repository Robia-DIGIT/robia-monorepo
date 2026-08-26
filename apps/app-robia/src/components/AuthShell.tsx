import type { ReactNode } from "react";
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

export default function AuthShell({
  eyebrow,
  title,
  description,
  footerLabel,
  footerLinkLabel,
  footerTo,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(29,78,216,0.16),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EFF6FF_100%)] text-dark">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.58)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.58)_1px,transparent_1px)] bg-size-[36px_36px] opacity-45" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <section className="hidden lg:flex lg:flex-col lg:justify-center lg:pr-8">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-navy shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-teal" />
              {eyebrow}
            </div>

            <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight text-navy-dark">
              {title}
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              {description}
            </p>

            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="text-sm font-semibold text-navy">Connexion rapide</div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Gardez un accès direct au tableau de bord et à vos analyses.
                </p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="text-sm font-semibold text-navy">Création fluide</div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Inscrivez votre entreprise en quelques secondes et démarrez.
                </p>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm text-muted">
              <img
                src={logoSnom}
                alt="ROBIA Copilot"
                className="h-12 w-12 rounded-2xl border border-white/80 bg-white object-contain p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              />
              <div>
                <div className="font-semibold text-navy-dark">ROBIA Copilot</div>
                <div>Assistant IA pour vos opérations et vos rapports.</div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur sm:p-8">
              <div className="flex justify-center">
                <img
                  src={logoSnom}
                  alt="ROBIA Copilot"
                  className="h-18 w-18 rounded-2xl border border-border-light bg-white object-contain p-2 shadow-sm"
                />
              </div>

              <div className="mt-6 space-y-2 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-dark">
                  {eyebrow}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-navy-dark">
                  {title}
                </h2>
                <p className="text-sm leading-6 text-muted">{description}</p>
              </div>

              <div className="mt-6">{children}</div>

              <p className="mt-6 text-center text-xs text-muted">
                {footerLabel}{" "}
                <Link
                  to={footerTo}
                  className="font-semibold text-teal-dark transition-colors hover:text-navy-dark hover:underline"
                >
                  {footerLinkLabel}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}