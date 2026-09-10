import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  createBillingPortalSession,
  createCheckoutSession,
  getBillingSubscription,
  type BillingSubscription,
} from "../lib/api";

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  trialing: "Essai en cours",
  past_due: "Paiement à régulariser",
  canceled: "Résilié",
  unpaid: "Impayé",
  incomplete: "Paiement incomplet",
  inactive: "Gratuit",
  pending: "Activation en cours",
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"monthly" | "annual" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const billingResult = new URLSearchParams(window.location.search).get("billing");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubscription(await getBillingSubscription());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger l’abonnement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getBillingSubscription()
      .then((value) => {
        if (active) setSubscription(value);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger l’abonnement.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const timer = billingResult === "success"
      ? window.setTimeout(() => void load(), 2500)
      : undefined;
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [billingResult, load]);

  const startCheckout = async (period: "monthly" | "annual") => {
    setBusy(period);
    setError(null);
    try {
      const { url } = await createCheckoutSession(period);
      window.location.assign(url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Impossible d’ouvrir Stripe Checkout.");
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    setError(null);
    try {
      const { url } = await createBillingPortalSession();
      window.location.assign(url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Impossible d’ouvrir le portail Stripe.");
      setBusy(null);
    }
  };

  const hasSubscription = subscription ? ACTIVE_STATUSES.has(subscription.status) : false;
  const periodEnd = subscription?.currentPeriodEnd
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <div className="min-h-full bg-slate-bg p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-border pb-6">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark">
            <CreditCard size={15} /> Facturation ROBIA
          </p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">
            Abonnement et facturation
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Choisissez ROBIA Pro ou gérez votre abonnement depuis le portail sécurisé Stripe.
          </p>
        </header>

        {billingResult === "success" && (
          <div className="mb-6 border-l-2 border-teal bg-teal/10 p-4 text-sm text-teal-dark">
            Paiement confirmé par Stripe. L’activation peut prendre quelques secondes.
          </div>
        )}
        {billingResult === "cancelled" && (
          <div className="mb-6 border-l-2 border-orange bg-orange-light/40 p-4 text-sm text-orange-dark">
            Paiement annulé : aucun prélèvement n’a été effectué.
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span>{error}</span>
          </div>
        )}

        <section className="mb-7 border border-border bg-white p-5 shadow-sm md:flex md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Offre actuelle</p>
            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold capitalize text-navy">{subscription?.plan ?? "Starter"}</span>
                  <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal-dark">
                    {STATUS_LABELS[subscription?.status ?? "inactive"] ?? subscription?.status}
                  </span>
                </div>
                {periodEnd && <p className="mt-2 text-xs text-muted">Période actuelle jusqu’au {periodEnd}.</p>}
                {subscription?.cancelAtPeriodEnd && <p className="mt-1 text-xs font-semibold text-orange-dark">Résiliation programmée en fin de période.</p>}
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2 md:mt-0">
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-bg disabled:opacity-50">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualiser
            </button>
            {subscription?.canManage && (
              <button type="button" onClick={() => void openPortal()} disabled={busy !== null} className="inline-flex items-center gap-2 bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
                {busy === "portal" ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />} Gérer dans Stripe
              </button>
            )}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <PlanCard title="Starter" price="0 €" description="Pour découvrir ROBIA et lancer votre première analyse." features={["1 établissement", "Premier audit", "Connexion Google"]} current={!hasSubscription} />
          <div className="border-2 border-teal bg-navy p-6 text-white shadow-[8px_8px_0_#14B8A6]">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal">Recommandé</p><h2 className="mt-2 text-2xl font-bold">Pro</h2></div>
              <ShieldCheck className="text-teal" size={26} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">Pour piloter activement la visibilité locale avec ROBIA Copilot.</p>
            <ul className="my-6 space-y-3 text-sm text-slate-200">
              {["3 établissements", "Audits et rapports avancés", "Copilot IA et actions prioritaires", "14 jours d’essai"].map((feature) => <li key={feature} className="flex items-center gap-2"><Check size={15} className="text-teal" />{feature}</li>)}
            </ul>
            {hasSubscription ? (
              <div className="border border-teal/40 bg-teal/10 p-3 text-center text-sm font-semibold text-teal">Votre offre Pro est active</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckoutButton label="29 €/mois" period="monthly" busy={busy} onClick={startCheckout} />
                <CheckoutButton label="278 €/an" period="annual" busy={busy} onClick={startCheckout} />
              </div>
            )}
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-muted">Paiement traité par Stripe · Aucune donnée bancaire n’est stockée par ROBIA.</p>
      </div>
    </div>
  );
}

function PlanCard({ title, price, description, features, current }: { title: string; price: string; description: string; features: string[]; current: boolean }) {
  return <div className="border border-border bg-white p-6"><div className="flex items-start justify-between"><div><h2 className="text-2xl font-bold text-navy">{title}</h2><p className="mt-1 text-3xl font-bold text-navy">{price}</p></div>{current && <span className="rounded-full bg-slate-bg px-2.5 py-1 text-xs font-semibold text-muted">Offre actuelle</span>}</div><p className="mt-4 text-sm leading-6 text-muted">{description}</p><ul className="my-6 space-y-3 text-sm text-navy">{features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check size={15} className="text-teal" />{feature}</li>)}</ul></div>;
}

function CheckoutButton({ label, period, busy, onClick }: { label: string; period: "monthly" | "annual"; busy: "monthly" | "annual" | "portal" | null; onClick: (period: "monthly" | "annual") => Promise<void> }) {
  return <button type="button" disabled={busy !== null} onClick={() => void onClick(period)} className="inline-flex items-center justify-center gap-2 bg-teal px-4 py-3 text-sm font-bold text-white hover:bg-teal-dark disabled:opacity-50">{busy === period && <Loader2 size={15} className="animate-spin" />}{label}</button>;
}
