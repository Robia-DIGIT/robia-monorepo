import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser } from "../lib/api";
import { clearAuthResponse, isAuthenticated } from "../lib/auth";

const SLOW_CHECK_THRESHOLD_MS = 4000;

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

    const timeout = setTimeout(
      () => setIsTakingLong(true),
      SLOW_CHECK_THRESHOLD_MS
    );

    return () => clearTimeout(timeout);
  }, [isChecking]);

  if (isChecking && !hasCheckedOnceRef.current) {
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy px-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/6 blur-3xl" />

        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Robot */}
        <div className="relative flex items-center justify-center">
          <div className="relative robot-float">
            {/* Antenna */}
            <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 flex-col items-center">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
              <span className="h-2.5 w-px bg-teal/40" />
            </div>

            {/* Head */}
            <div className="relative h-16 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0">
                <div className="robot-scan" />
              </div>

              <div className="absolute inset-2 z-10 flex items-center justify-center rounded-xl border border-white/5 bg-black/10">
                <div className="relative z-20 flex gap-4">
                  <span className="h-2 w-2 rounded-full bg-teal shadow-[0_0_12px_rgba(45,212,191,1)]" />
                  <span className="h-2 w-2 rounded-full bg-teal shadow-[0_0_12px_rgba(45,212,191,1)]" />
                </div>
              </div>

              <div className="absolute -left-1 top-5 h-6 w-1 rounded-full bg-white/10" />
              <div className="absolute -right-1 top-5 h-6 w-1 rounded-full bg-white/10" />
            </div>

            {/* Body */}
            <div className="relative mx-auto mt-2 h-8 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/4">
              <div className="pointer-events-none absolute inset-0">
                <div className="robot-scan" />
              </div>

              <div className="relative z-10 flex h-full items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="relative mt-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />

            <p className="text-sm font-medium tracking-wide text-white">
              Vérification de la session
            </p>

            <span className="flex w-4 gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-teal/70" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-teal/70 [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-teal/70 [animation-delay:300ms]" />
            </span>
          </div>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
            Secure authentication
          </p>

          <p
            className={`mt-4 text-xs text-white/40 transition-all duration-500 ${
              isTakingLong
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0"
            }`}
          >
            {isTakingLong
              ? "La vérification prend plus de temps que prévu..."
              : "\u00A0"}
          </p>
        </div>

        <span className="sr-only">
          Vérification de la session, veuillez patienter.
        </span>

        <style>{`
          .robot-float {
            animation: float 3s ease-in-out infinite;
          }

          @keyframes float {
            0%,100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-5px);
            }
          }

          @keyframes robotScan {
            0% {
              transform: translateX(-120%);
            }

            100% {
              transform: translateX(220%);
            }
          }

          .robot-scan {
            position: absolute;
            inset: -20%;
            pointer-events: none;
            will-change: transform;

            background: linear-gradient(
              90deg,
              transparent 0%,
              transparent 42%,
              rgba(45,212,191,0.08) 48%,
              rgba(45,212,191,0.45) 50%,
              rgba(45,212,191,0.08) 52%,
              transparent 58%,
              transparent 100%
            );

            animation: robotScan 1.8s linear infinite;
            filter: blur(6px);
          }
        `}</style>
      </div>
    );
  }

  return isAuthorized ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location }}
    />
  );
}