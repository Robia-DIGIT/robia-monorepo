import { useEffect, useState } from "react";
import { disableAnalytics, enableAnalytics } from "../lib/analytics";

const CONSENT_KEY = "robia_analytics_consent";
const OPEN_SETTINGS_EVENT = "robia:open-cookie-settings";

type ConsentChoice = "granted" | "denied" | null;

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

export function AnalyticsConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY) as ConsentChoice;
    setChoice(stored);

    if (stored === "granted") {
      enableAnalytics();
    } else if (stored === "denied") {
      disableAnalytics();
    } else {
      setOpen(true);
    }

    const showSettings = () => setOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, showSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, showSettings);
  }, []);

  const accept = () => {
    window.localStorage.setItem(CONSENT_KEY, "granted");
    setChoice("granted");
    setOpen(false);
    enableAnalytics();
  };

  const refuse = () => {
    window.localStorage.setItem(CONSENT_KEY, "denied");
    setChoice("denied");
    setOpen(false);
    disableAnalytics();
  };

  if (!open) return null;

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-title"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl border border-white/15 bg-[#102B38] p-5 text-white shadow-2xl sm:p-6"
    >
      <h2 id="cookie-title" className="font-[Roboto] text-xl font-bold">
        Vos choix de confidentialité
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#C5D3D7]">
        ROBIA utilise Google Analytics uniquement avec votre accord afin de
        comprendre l’utilisation du site. Le refus n’empêche aucune
        fonctionnalité.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={refuse}
          className="border border-white/30 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Refuser Analytics
        </button>
        <button
          type="button"
          onClick={accept}
          className="bg-[#F97316] px-5 py-3 text-sm font-bold transition hover:bg-[#E5650C]"
        >
          Accepter Analytics
        </button>
      </div>
      {choice !== null && (
        <p className="mt-3 text-xs text-[#8FA6AD]">
          Choix actuel : {choice === "granted" ? "accepté" : "refusé"}
        </p>
      )}
    </aside>
  );
}
