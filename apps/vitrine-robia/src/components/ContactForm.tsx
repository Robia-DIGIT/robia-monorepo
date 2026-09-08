import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
  website: "",
};

const apiBase = (
  import.meta.env.VITE_API_URL || "https://api.robiacopilot.site"
).replace(/\/+$/, "");

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSuccess(false);
    setError("");

    try {
      const response = await fetch(`${apiBase}/prospects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Le formulaire est temporairement indisponible. Réessayez dans quelques minutes.",
        );
      }

      setForm(initialForm);
      setSuccess(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "La demande n’a pas pu être envoyée.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full border border-[#15313D]/20 bg-white px-4 py-3 text-sm text-[#15313D] outline-none transition placeholder:text-[#87969A] focus:border-[#087F75] focus:ring-2 focus:ring-[#14B8A6]/20";

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="scroll-mt-24 bg-[#E0DED6] px-5 py-24 text-[#15313D] sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#F97316]">
            Parlons de votre visibilité
          </p>
          <h2
            id="contact-title"
            className="mt-6 font-[Roboto] text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-6xl"
          >
            Demandez une démonstration de ROBIA.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#61747A]">
            Présentez-nous votre entreprise et votre principal défi. L’équipe
            ROBIA vous répondra avec une prochaine étape claire.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="grid gap-5 border border-[#15313D]/15 bg-[#F7F5EF] p-6 shadow-[12px_14px_0_rgba(21,49,61,.10)] sm:grid-cols-2 sm:p-8"
        >
          <label className="text-sm font-semibold">
            Nom complet
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              className={inputClass}
              placeholder="Votre nom"
            />
          </label>

          <label className="text-sm font-semibold">
            Adresse e-mail
            <input
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              className={inputClass}
              placeholder="vous@entreprise.com"
            />
          </label>

          <label className="text-sm font-semibold">
            Entreprise
            <input
              maxLength={120}
              autoComplete="organization"
              value={form.company}
              onChange={(event) => update("company", event.target.value)}
              className={inputClass}
              placeholder="Nom de votre entreprise"
            />
          </label>

          <label className="text-sm font-semibold">
            Téléphone
            <input
              type="tel"
              maxLength={30}
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              className={inputClass}
              placeholder="+261 34 00 000 00"
            />
          </label>

          <label className="text-sm font-semibold sm:col-span-2">
            Votre besoin
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className={`${inputClass} resize-y`}
              placeholder="Décrivez votre visibilité actuelle ou le résultat que vous souhaitez obtenir."
            />
          </label>

          <label
            aria-hidden="true"
            className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
          >
            Site web
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </label>

          <div className="sm:col-span-2">
            {success && (
              <p
                role="status"
                className="mb-4 flex items-start gap-2 bg-[#D6F4EE] px-4 py-3 text-sm font-semibold text-[#087F75]"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                Votre demande a été envoyée. Notre équipe vous répondra
                rapidement.
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="mb-4 flex items-start gap-2 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-3 bg-[#102B38] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#164453] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#14B8A6]/50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              <Send size={17} />
              {submitting ? "Envoi en cours…" : "Envoyer ma demande"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
