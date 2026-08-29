import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Building2, MapPin, Sparkles } from "lucide-react";
import { getCurrentUser } from "../lib/api";
import { clearAuthResponse, isAuthenticated } from "../lib/auth";

const SLOW_CHECK_THRESHOLD_MS = 4000;

function RobiaSessionLoader({ isTakingLong }: { isTakingLong: boolean }) {
  return (
    <main
      className="robia-loader relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-navy text-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* --- Background atmosphere --- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="robia-blob robia-blob-teal absolute -left-24 -top-24 h-[42vmax] w-[42vmax] rounded-full blur-3xl" />
        <div className="robia-blob robia-blob-orange absolute -bottom-32 -right-16 h-[36vmax] w-[36vmax] rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(4,10,20,0.65)_75%)]" />
        <div className="robia-grid absolute inset-0 opacity-[0.06]" />
      </div>


      {/* --- Central scene --- */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative grid h-[46vmin] w-[46vmin] max-h-72 max-w-72 min-h-56 min-w-56 place-items-center">
          {/* dashed orbit ring, slow rotation */}
          <svg className="robia-ring-rotate absolute inset-0 h-full w-full" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="92" stroke="rgba(20,184,166,0.35)" strokeWidth="1" strokeDasharray="2 8" />
          </svg>

          {/* pulsing concentric rings */}
          <span className="robia-pulse-ring robia-pulse-ring-1 absolute h-[70%] w-[70%] rounded-full border border-teal/25" />
          <span className="robia-pulse-ring robia-pulse-ring-2 absolute h-[70%] w-[70%] rounded-full border border-teal/25" />

          {/* orbiting satellites */}
          <div className="robia-orbit-spin absolute h-full w-full">
            <span className="robia-satellite robia-satellite-a absolute left-1/2 top-0 -translate-x-1/2">
              <span className="robia-counter-spin robia-satellite-icon"><Building2 size={14} /></span>
            </span>
            <span className="robia-satellite robia-satellite-b absolute left-full top-1/2 -translate-y-1/2">
              <span className="robia-counter-spin robia-satellite-icon"><Building2 size={14} /></span>
            </span>
            <span className="robia-satellite robia-satellite-c absolute bottom-0 left-1/2 -translate-x-1/2">
              <span className="robia-counter-spin robia-satellite-icon"><Building2 size={14} /></span>
            </span>
          </div>

          {/* opportunity ping */}
          <span className="absolute right-[8%] top-[16%]">
            <span className="robia-ping-soft absolute inline-flex h-3 w-3 rounded-full bg-orange opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-orange" />
          </span>

          {/* core */}
          <span className="robia-core-halo absolute h-[46%] w-[46%] rounded-full bg-teal/20 blur-md" />
          <span className="robia-core-float relative grid h-16 w-16 place-items-center rounded-2xl bg-teal text-white shadow-[0_16px_40px_rgba(20,184,166,0.35)] sm:h-[4.5rem] sm:w-[4.5rem]">
            <MapPin size={28} strokeWidth={2.4} />
          </span>
        </div>

        {/* --- Status card --- */}
        <section className="robia-fade-up mt-10 w-full max-w-sm text-center">
          <div className="robia-glass rounded-3xl px-6 py-6 sm:px-8 sm:py-7">
            <h1 className="text-xl font-semibold tracking-[-0.025em] text-white sm:text-[22px]">
              Vérification de votre session
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">ROBIA prépare votre espace.</p>

            <div className="mx-auto mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <span className="robia-shimmer-bar block h-full w-2/5 rounded-full bg-gradient-to-r from-teal/40 via-teal to-teal/40" />
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
              <span className="robia-dot robia-dot-1 h-1.5 w-1.5 rounded-full bg-white/50" />
              <span className="robia-dot robia-dot-2 h-1.5 w-1.5 rounded-full bg-white/50" />
              <span className="robia-dot robia-dot-3 h-1.5 w-1.5 rounded-full bg-white/50" />
            </div>

            <p
              className={`mt-4 min-h-5 text-xs leading-5 text-white/50 transition-opacity duration-500 ${
                isTakingLong ? "opacity-100" : "opacity-0"
              }`}
            >
              {isTakingLong
                ? "La connexion prend un peu plus de temps que prévu. Nous poursuivons la vérification."
                : "Vérification en cours."}
            </p>
          </div>
        </section>
      </div>

      <span className="sr-only">Vérification de votre session. ROBIA prépare votre espace, veuillez patienter.</span>

      {/* --- Animations --- */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .robia-blob { animation: robia-drift 14s ease-in-out infinite alternate; }
          .robia-blob-teal { background: radial-gradient(circle, rgba(20,184,166,0.35), transparent 70%); animation-delay: 0s; }
          .robia-blob-orange { background: radial-gradient(circle, rgba(249,115,22,0.25), transparent 70%); animation-delay: -6s; }
          @keyframes robia-drift {
            0% { transform: translate(0,0) scale(1); }
            100% { transform: translate(6%, 8%) scale(1.12); }
          }

          .robia-ring-rotate { animation: robia-spin 40s linear infinite; }
          .robia-orbit-spin { animation: robia-spin 16s linear infinite; }
          .robia-counter-spin { animation: robia-spin-reverse 16s linear infinite; }
          @keyframes robia-spin { to { transform: rotate(360deg); } }
          @keyframes robia-spin-reverse { to { transform: rotate(-360deg); } }

          .robia-satellite-icon {
            display: grid; place-items: center;
            height: 28px; width: 28px; border-radius: 9999px;
            background: rgba(20,184,166,0.15);
            border: 1px solid rgba(20,184,166,0.4);
            color: #5eead4;
            box-shadow: 0 0 16px rgba(20,184,166,0.25);
          }
          .robia-satellite-a { animation: robia-satellite-fade 16s linear infinite; }
          .robia-satellite-b { animation: robia-satellite-fade 16s linear infinite; animation-delay: -5.3s; }
          .robia-satellite-c { animation: robia-satellite-fade 16s linear infinite; animation-delay: -10.6s; }
          @keyframes robia-satellite-fade {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 0.4; }
          }

          .robia-pulse-ring { animation: robia-pulse 3.2s cubic-bezier(0.22,1,0.36,1) infinite; }
          .robia-pulse-ring-2 { animation-delay: 1.6s; }
          @keyframes robia-pulse {
            0% { transform: scale(0.75); opacity: 0.6; }
            100% { transform: scale(1.35); opacity: 0; }
          }

          .robia-core-halo { animation: robia-halo 3.2s ease-in-out infinite; }
          @keyframes robia-halo {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.12); }
          }
          .robia-core-float { animation: robia-float 3.6s ease-in-out infinite; }
          @keyframes robia-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }

          .robia-ping-soft { animation: robia-ping 2s cubic-bezier(0,0,0.2,1) infinite; }
          @keyframes robia-ping {
            75%, 100% { transform: scale(2.2); opacity: 0; }
          }

          .robia-shimmer-bar {
            background-size: 200% 100%;
            animation: robia-shimmer 1.6s ease-in-out infinite;
          }
          @keyframes robia-shimmer {
            0% { background-position: 200% 0; transform: translateX(-30%); }
            100% { background-position: -200% 0; transform: translateX(150%); }
          }

          .robia-dot { animation: robia-bounce 1.2s ease-in-out infinite; }
          .robia-dot-2 { animation-delay: 0.15s; }
          .robia-dot-3 { animation-delay: 0.3s; }
          @keyframes robia-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-4px); opacity: 1; }
          }

          .robia-fade-down { animation: robia-fade-down 0.6s ease-out both; }
          @keyframes robia-fade-down {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .robia-fade-up { animation: robia-fade-up 0.7s 0.15s ease-out both; }
          @keyframes robia-fade-up {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }

        .robia-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        }

        .robia-glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        }

        .robia-satellite-a { top: -14px; left: 50%; }
        .robia-satellite-b { top: 50%; left: calc(100% - 14px); }
        .robia-satellite-c { bottom: -14px; left: 50%; }
      `}</style>
    </main>
  );
}

export default function RequireAuth() {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const hasCheckedOnceRef = useRef(false);

  useEffect(() => {
    let active = true;
    const verifySession = async () => {
      setIsTakingLong(false);
      if (!isAuthenticated()) {
        if (active) {
          setIsAuthorized(false);
          setIsChecking(false);
        }
        return;
      }
      try {
        await getCurrentUser();
        if (active) {
          setIsAuthorized(true);
          setIsChecking(false);
        }
      } catch {
        if (active) {
          clearAuthResponse();
          setIsAuthorized(false);
          setIsChecking(false);
        }
      }
    };
    void verifySession();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!isChecking || hasCheckedOnceRef.current) {
      if (!isChecking) {
        hasCheckedOnceRef.current = true;
      }
      return;
    }
    const timeout = setTimeout(() => setIsTakingLong(true), SLOW_CHECK_THRESHOLD_MS);
    return () => clearTimeout(timeout);
  }, [isChecking]);

  if (isChecking && !hasCheckedOnceRef.current) {
    return <RobiaSessionLoader isTakingLong={isTakingLong} />;
  }
  return isAuthorized ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}