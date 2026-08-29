import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  Mail,
  RefreshCw,
  Lock,
  Loader2,
  Check,
  ExternalLink,
  Camera,
  Upload,
  X,
  LogOut,
  Radar,
} from "lucide-react";

import {
  getCurrentOrganization,
  getMe,
  logout,
  updateCurrentOrganization,
  updateMe,
  type Organization,
  type UserProfile,
} from "../lib/api";
import { useEditableResource } from "../hooks/useEditableResource";

const PHONE_PATTERN = /^\+?[\d\s]{6,20}$/;
const BIO_MAX_LENGTH = 240;
const BIO_WARN_THRESHOLD = 0.9; // start warning at 90% of the limit
const MAX_LOGO_SIZE_MB = 5;
const ACCEPTED_LOGO_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/gif"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhoneNumber(value: string): string {
  if (!value) return "";
  const clean = value.replace(/[^\d+]/g, "");

  if (clean.startsWith("+261") || clean.startsWith("261")) {
    const hasPlus = clean.startsWith("+");
    const prefix = hasPlus ? "+261" : "261";
    const rest = clean.slice(prefix.length);
    const parts = [];
    if (rest.length > 0) parts.push(rest.slice(0, 2));
    if (rest.length > 2) parts.push(rest.slice(2, 4));
    if (rest.length > 4) parts.push(rest.slice(4, 7));
    if (rest.length > 7) parts.push(rest.slice(7, 9));
    if (rest.length > 9) parts.push(rest.slice(9));
    return `${hasPlus ? "+" : ""}261 ${parts.join(" ")}`.trim();
  }

  if (clean.startsWith("0")) {
    const rest = clean.slice(1);
    const parts = ["0" + rest.slice(0, 2)];
    const restDigits = rest.slice(2);
    if (restDigits.length > 0) parts.push(restDigits.slice(0, 2));
    if (restDigits.length > 2) parts.push(restDigits.slice(2, 5));
    if (restDigits.length > 5) parts.push(restDigits.slice(5, 7));
    if (restDigits.length > 7) parts.push(restDigits.slice(7));
    return parts.join(" ").trim();
  }

  return clean;
}

// Keep slugs URL-safe as the user types: lowercase, ascii, hyphen-separated.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function CardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
      <AlertTriangle className="mx-auto mb-2 text-red-500" size={24} aria-hidden="true" />
      <p className="mb-3 text-sm font-semibold text-red-700">Impossible de charger ces informations.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-50 hover:border-red-300 cursor-pointer shadow-sm active:scale-95"
      >
        <RefreshCw size={13} aria-hidden="true" />
        Réessayer
      </button>
    </div>
  );
}

const SisyphusLogo = () => (
  <svg
    viewBox="0 0 32 32"
    className="w-full h-full text-white"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 20L20 8" />
    <path d="M12 24L24 12" />
    <path d="M16 28L28 16" />
    <path d="M4 16L16 4" />
  </svg>
);

function Toast({
  tone,
  title,
  message,
}: {
  tone: "success" | "error";
  title: string;
  message: string;
}) {
  const isSuccess = tone === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed sm:absolute top-4 right-4 left-4 sm:left-auto sm:w-auto rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-md flex items-center gap-2.5 animate-slide-up z-20 ${isSuccess
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-red-50 text-red-800 border-red-200"
        }`}
    >
      <div
        className={`w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 ${isSuccess ? "bg-emerald-500" : "bg-red-500"
          }`}
      >
        {isSuccess ? <Check size={12} strokeWidth={3} /> : <AlertTriangle size={12} strokeWidth={3} />}
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className={`text-[10px] font-normal ${isSuccess ? "text-emerald-700/90" : "text-red-700/90"}`}>
          {message}
        </p>
      </div>
    </div>
  );
}

function FormRow({
  title,
  description,
  helpHref,
  helpLabel,
  children,
}: {
  title: string;
  description: string;
  helpHref?: string;
  helpLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-6 px-8 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <h3 className="text-xs font-bold text-dark uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
        {helpHref && (
          <a href={helpHref} className="inline-block text-xs font-bold text-teal hover:underline mt-2 transition-colors">
            {helpLabel}
          </a>
        )}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

function BrandingCheckbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3.5 cursor-pointer select-none group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-teal/40 peer-focus-visible:ring-offset-1 ${checked ? "bg-teal border-teal text-white shadow-sm shadow-teal/15" : "border-border bg-white group-hover:border-teal/50"
            }`}
        >
          {checked && <Check size={12} strokeWidth={3} />}
        </div>
      </div>
      <div>
        <span className="text-xs font-bold text-dark group-hover:text-teal transition-colors">{label}</span>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const user = useEditableResource<UserProfile>(getMe, updateMe);
  const org = useEditableResource<Organization>(getCurrentOrganization, updateCurrentOrganization);

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [orgNameTouched, setOrgNameTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldShakePhone, setShouldShakePhone] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for fields not yet backed by the API
  const [websiteSlug, setWebsiteSlug] = useState(() => localStorage.getItem("robia_website_slug") || "sisyphus");
  const [brandingReports, setBrandingReports] = useState(() => {
    const val = localStorage.getItem("robia_branding_reports");
    return val !== null ? val === "true" : true;
  });
  const [brandingEmails, setBrandingEmails] = useState(() => {
    const val = localStorage.getItem("robia_branding_emails");
    return val !== null ? val === "true" : true;
  });
  const [socialTwitter, setSocialTwitter] = useState(() => localStorage.getItem("robia_social_twitter") || "sisyphusvc");
  const [socialFacebook, setSocialFacebook] = useState(() => localStorage.getItem("robia_social_facebook") || "sisyphusvc");
  const [socialLinkedin, setSocialLinkedin] = useState(() => localStorage.getItem("robia_social_linkedin") || "sisyphusvc");

  // Logo: committed = what's actually saved; pending = a newly picked file awaiting Save
  const [committedLogoUrl, setCommittedLogoUrl] = useState<string | null>(
    () => localStorage.getItem("robia_logo_url") || null
  );
  const [pendingLogo, setPendingLogo] = useState<{ file: File; previewUrl: string } | null>(null);
  const displayedLogoUrl = pendingLogo?.previewUrl ?? committedLogoUrl;

  const [initialLocalValues, setInitialLocalValues] = useState(() => ({
    websiteSlug: localStorage.getItem("robia_website_slug") || "sisyphus",
    brandingReports: localStorage.getItem("robia_branding_reports") !== "false",
    brandingEmails: localStorage.getItem("robia_branding_emails") !== "false",
    socialTwitter: localStorage.getItem("robia_social_twitter") || "sisyphusvc",
    socialFacebook: localStorage.getItem("robia_social_facebook") || "sisyphusvc",
    socialLinkedin: localStorage.getItem("robia_social_linkedin") || "sisyphusvc",
  }));

  // Release object URLs when replaced/unmounted to avoid leaking memory
  useEffect(() => {
    return () => {
      if (pendingLogo) URL.revokeObjectURL(pendingLogo.previewUrl);
    };
  }, [pendingLogo]);

  const handleSlugChange = (value: string) => {
    setWebsiteSlug(slugify(value));
  };

  // Live formatting only — no shake while the person is still typing.
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    user.setField("phone", formatted);
    if (!formatted || PHONE_PATTERN.test(formatted)) {
      setPhoneError(null);
    }
  };

  // Validate once the person leaves the field — shaking mid-typing just gets in the way.
  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const value = user.values.phone ?? "";
    if (value && !PHONE_PATTERN.test(value)) {
      setPhoneError("Format de téléphone invalide.");
      setShouldShakePhone(true);
    } else {
      setPhoneError(null);
    }
  };

  useEffect(() => {
    if (shouldShakePhone) {
      const timer = setTimeout(() => setShouldShakePhone(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShakePhone]);

  const orgNameError = orgNameTouched && !org.values.name?.trim() ? "Le nom de l'organisation est requis." : null;


  const handleLogout = async () => {
    await logout()
    window.location.assign('/login')
  }
  const isLocalDirty = useMemo(() => {
    return (
      websiteSlug !== initialLocalValues.websiteSlug ||
      brandingReports !== initialLocalValues.brandingReports ||
      brandingEmails !== initialLocalValues.brandingEmails ||
      socialTwitter !== initialLocalValues.socialTwitter ||
      socialFacebook !== initialLocalValues.socialFacebook ||
      socialLinkedin !== initialLocalValues.socialLinkedin
    );
  }, [websiteSlug, brandingReports, brandingEmails, socialTwitter, socialFacebook, socialLinkedin, initialLocalValues]);

  const hasUnsavedChanges = user.isDirty || org.isDirty || isLocalDirty || Boolean(pendingLogo);
  const canSave = hasUnsavedChanges && !phoneError && !orgNameError;

  // Warn before leaving the tab with unsaved changes.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const validateLogoFile = (file: File): string | null => {
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      return "Format non pris en charge. Utilisez SVG, PNG, JPG ou GIF.";
    }
    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      return `L'image dépasse ${MAX_LOGO_SIZE_MB} Mo.`;
    }
    return null;
  };

  const handleLogoFile = useCallback((file: File) => {
    const error = validateLogoFile(file);
    if (error) {
      setLogoError(error);
      return;
    }
    setLogoError(null);
    setPendingLogo((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  const removePendingLogo = () => {
    if (pendingLogo) URL.revokeObjectURL(pendingLogo.previewUrl);
    setPendingLogo(null);
    setLogoError(null);
  };

  const handleSave = async () => {
    setOrgNameTouched(true);
    setPhoneTouched(true);
    if (phoneError || orgNameError) {
      if (phoneError) setShouldShakePhone(true);
      return;
    }
    setIsSaving(true);
    try {
      const promises = [];
      if (user.isDirty) promises.push(user.save());
      if (org.isDirty) promises.push(org.save());

      const results = await Promise.all(promises);
      const allSuccess = results.every((res) => res === true);

      if (allSuccess) {
        localStorage.setItem("robia_website_slug", websiteSlug);
        localStorage.setItem("robia_branding_reports", String(brandingReports));
        localStorage.setItem("robia_branding_emails", String(brandingEmails));
        localStorage.setItem("robia_social_twitter", socialTwitter);
        localStorage.setItem("robia_social_facebook", socialFacebook);
        localStorage.setItem("robia_social_linkedin", socialLinkedin);

        // TODO: replace with the real logo upload endpoint once available.
        if (pendingLogo) {
          localStorage.setItem("robia_logo_url", pendingLogo.previewUrl);
          setCommittedLogoUrl(pendingLogo.previewUrl);
          setPendingLogo(null);
        }

        setInitialLocalValues({
          websiteSlug,
          brandingReports,
          brandingEmails,
          socialTwitter,
          socialFacebook,
          socialLinkedin,
        });

        setJustSaved(true);
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    user.discardDraft();
    org.discardDraft();
    setPhoneError(null);
    setShouldShakePhone(false);
    setPhoneTouched(false);
    setOrgNameTouched(false);
    removePendingLogo();

    setWebsiteSlug(initialLocalValues.websiteSlug);
    setBrandingReports(initialLocalValues.brandingReports);
    setBrandingEmails(initialLocalValues.brandingEmails);
    setSocialTwitter(initialLocalValues.socialTwitter);
    setSocialFacebook(initialLocalValues.socialFacebook);
    setSocialLinkedin(initialLocalValues.socialLinkedin);
  };

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [justSaved]);

  if (user.status === "loading" || org.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-bg px-4 py-12 sm:px-8 flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-4xl bg-white rounded-2xl border border-border p-8 shadow-sm">
          <div className="h-8 w-40 rounded-xl bg-muted/20" />
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="h-12 rounded-xl bg-muted/10" />
            <div className="h-12 rounded-xl bg-muted/10" />
            <div className="h-24 rounded-xl bg-muted/10" />
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "error" || org.status === "error") {
    return (
      <div className="min-h-screen bg-slate-bg px-4 py-12 sm:px-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <CardError
            onRetry={() => {
              user.reload();
              org.reload();
            }}
          />
        </div>
      </div>
    );
  }

  const bioLength = (user.values.bio ?? "").length;
  const bioNearLimit = bioLength >= BIO_MAX_LENGTH * BIO_WARN_THRESHOLD;
  const bioAtLimit = bioLength >= BIO_MAX_LENGTH;

  const SaveCancelActions = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isSaving || !hasUnsavedChanges}
        className="px-4 py-2.5 text-xs font-bold text-dark bg-white border border-border rounded-xl hover:bg-slate-bg active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !canSave}
        className={`px-4 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer active:scale-95 ${canSave ? "bg-dark hover:bg-dark/90 shadow-md shadow-dark/10" : "bg-dark"
          }`}
      >
        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
        {compact ? "Enregistrer" : "Enregistrer les modifications"}
      </button>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-slate-bg px-4 py-8 sm:px-8 relative overflow-x-hidden"
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .animate-shake { animation: none; }
        }
      `}</style>

      {justSaved && <Toast tone="success" title="Succès !" message="Vos modifications ont été enregistrées." />}
      {(user.saveError || org.saveError) && (
        <Toast tone="error" title="Erreur de sauvegarde" message={user.saveError || org.saveError || ""} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES.join(",")}
        onChange={handleFileInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="mx-auto max-w-5xl">
        <header className="mb-7 border-b border-border pb-6">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Identité de l’espace ROBIA</p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Profil et présence de l’entreprise</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Gérez les informations utilisées dans vos profils, rapports et communications.</p>
        </header>
        {/* Sticky action bar: stays reachable while scrolling a long form */}
        <div className="sticky top-4 z-10 mb-4 flex items-center justify-between gap-4 rounded-lg border border-border bg-white px-5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-dark truncate">Profil de l'entreprise</p>
            {hasUnsavedChanges ? (
              <p className="text-[11px] font-semibold text-amber-600">Modifications non enregistrées</p>
            ) : (
              <p className="text-[11px] text-muted">Tout est à jour</p>
            )}
          </div>
          <SaveCancelActions compact />
        </div>

        <div className="relative border-t-2 border-teal bg-white transition-all duration-300">
          {/* Banner Header */}
          <div className="pt-6 pb-6 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
            <button
              type="button"
              onClick={openFilePicker}
              aria-label="Changer le logo de l'entreprise"
              className="absolute -top-14 left-8 group w-28 h-28 rounded-full border-4 border-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
            >
              <div className="relative w-full h-full rounded-full bg-navy flex items-center justify-center overflow-hidden p-6 hover:scale-[1.03] transition-all duration-200">
                {displayedLogoUrl ? (
                  <img src={displayedLogoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <SisyphusLogo />
                )}
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
                  <Camera size={18} className="mb-0.5" aria-hidden="true" />
                  <span className="text-[9px] font-bold tracking-wider uppercase">Changer</span>
                </div>
              </div>
              <span className="absolute bottom-1 right-1 bg-dark text-white rounded-full p-1 border-2 border-white shadow-md flex items-center justify-center w-6.5 h-6.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="sr-only">Organisation vérifiée</span>
              </span>
            </button>

            <div className="md:pl-36 min-w-0 flex-1 mt-10 md:mt-0">
              <h1 className="text-xl font-extrabold text-dark flex items-center gap-2">
                {org.values.name || "Profil de l'entreprise"}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                <a
                  href={`https://robia.dev/${websiteSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal font-medium cursor-pointer flex items-center gap-1.5 transition-colors group"
                >
                  robia.dev/{websiteSlug || "sisyphus"}
                  <ExternalLink size={12} className="text-muted/60 group-hover:text-teal transition-colors" aria-hidden="true" />
                </a>
              </div>
            </div>


          </div>

          <FormRow title="Profil public" description="Ces informations seront affichées publiquement sur votre profil d'organisation.">
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={org.values.name ?? ""}
                  onChange={(e) => org.setField("name", e.target.value)}
                  onBlur={() => setOrgNameTouched(true)}
                  placeholder="Nom de l'organisation"
                  aria-invalid={Boolean(orgNameError)}
                  aria-required="true"
                  className={`w-full max-w-lg rounded-xl border bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-muted/50 transition-all focus:outline-none focus:ring-2 ${orgNameError
                    ? "border-red-400 focus:ring-red-400/20 focus:border-red-400"
                    : "border-border focus:ring-teal/30 focus:border-teal"
                    }`}
                />
                {orgNameError && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} aria-hidden="true" />
                    {orgNameError}
                  </p>
                )}
              </div>
              <div>
                <div className="flex max-w-lg rounded-xl border border-border overflow-hidden bg-white focus-within:ring-2 focus-within:ring-teal/30 focus-within:border-teal transition-all">
                  <span className="inline-flex items-center px-3.5 border-r border-border bg-slate-bg text-xs font-semibold text-muted select-none">
                    robia.dev/
                  </span>
                  <input
                    type="text"
                    value={websiteSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="slug"
                    className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-dark placeholder:text-muted/50 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-muted/70 mt-1">Lettres minuscules, chiffres et tirets uniquement.</p>
              </div>
            </div>
          </FormRow>

          <FormRow
            title="Logo de l'entreprise"
            description="Utilisé sur votre profil, vos rapports et vos e-mails. Cliquez sur l'avatar ci-dessus ou déposez un fichier ici."
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFilePicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              aria-label="Téléverser un logo"
              className={`max-w-md border-2 border-dashed rounded-xl p-5 flex items-center gap-4 text-left cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${isDragging ? "border-teal bg-teal/5 scale-[1.01] shadow-sm" : "border-border hover:border-teal/40 bg-white"
                }`}
            >
              {displayedLogoUrl ? (
                <img src={displayedLogoUrl} alt="Aperçu du logo" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center border ${isDragging ? "bg-teal/10 border-teal text-teal" : "bg-slate-bg border-border text-muted"}`}>
                  <Upload size={18} className={isDragging ? "animate-bounce" : ""} aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-dark font-medium">
                  <span className="text-teal font-semibold">Cliquez pour choisir un fichier</span> ou glissez-déposer
                </p>
                <p className="text-[10px] text-muted mt-1">SVG, PNG, JPG ou GIF · {MAX_LOGO_SIZE_MB} Mo max</p>
              </div>
              {pendingLogo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePendingLogo();
                  }}
                  aria-label="Annuler le nouveau logo"
                  className="shrink-0 rounded-lg p-1.5 text-muted hover:text-dark hover:bg-slate-bg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {logoError && (
              <p className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1">
                <AlertTriangle size={12} aria-hidden="true" />
                {logoError}
              </p>
            )}
            {pendingLogo && !logoError && (
              <p className="mt-2 text-xs text-amber-600 font-semibold">Nouveau logo prêt — enregistrez pour l'appliquer.</p>
            )}
          </FormRow>

          <FormRow title="Branding" description="Ajoutez votre logo aux rapports et aux e-mails sortants." helpHref="#" helpLabel="Voir des exemples">
            <div className="space-y-4">
              <BrandingCheckbox
                label="Rapports"
                description="Inclure mon logo dans les rapports de synthèse générés par l'IA."
                checked={brandingReports}
                onChange={setBrandingReports}
              />
              <BrandingCheckbox
                label="E-mails"
                description="Inclure mon logo dans les e-mails automatisés envoyés aux clients."
                checked={brandingEmails}
                onChange={setBrandingEmails}
              />
            </div>
          </FormRow>

          <FormRow title="Informations de contact" description="Gérez vos informations de contact personnelles et votre biographie.">
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">Adresse e-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.values.email ?? ""}
                    readOnly
                    className="w-full rounded-xl border border-border bg-slate-bg/60 px-3.5 py-2.5 pr-10 text-xs font-semibold text-muted cursor-not-allowed focus:outline-none"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50">
                    <Lock size={14} aria-hidden="true" />
                  </div>
                </div>
                <p className="text-[10px] text-muted/70 mt-1">Géré par votre connexion sociale.</p>
              </div>

              <div className={shouldShakePhone ? "animate-shake" : ""}>
                <label htmlFor="phone" className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
                  Téléphone
                </label>
                <input
                  id="phone"
                  type="text"
                  value={formatPhoneNumber(user.values.phone ?? "")}
                  placeholder="+261 34 00 000 00"
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={handlePhoneBlur}
                  aria-invalid={Boolean(phoneError)}
                  className={`w-full rounded-xl border ${phoneError && phoneTouched
                    ? "border-red-400 focus:ring-red-400/20 focus:border-red-400 bg-red-50/20"
                    : "border-border focus:ring-teal/30 focus:border-teal bg-white"
                    } px-3.5 py-2.5 text-sm text-dark placeholder:text-muted/40 transition-all focus:outline-none focus:ring-2`}
                />
                {phoneError && phoneTouched && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} aria-hidden="true" />
                    {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="bio" className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
                  Biographie / Description
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={user.values.bio ?? ""}
                  placeholder="Parlez un peu de vous ou de votre activité…"
                  maxLength={BIO_MAX_LENGTH}
                  onChange={(e) => user.setField("bio", e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-muted/40 transition-all focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
                />
                <div
                  className={`mt-1 text-right text-[10px] font-semibold ${bioAtLimit ? "text-red-500" : bioNearLimit ? "text-amber-600" : "text-muted"
                    }`}
                >
                  {bioLength}/{BIO_MAX_LENGTH}
                </div>
              </div>
            </div>
          </FormRow>

          <FormRow title="Profils sociaux" description="Liez vos comptes de réseaux sociaux pour la présence en ligne de l'organisation.">
            <div className="space-y-3.5 max-w-lg">
              {[
                { label: "twitter.com/", value: socialTwitter, setValue: setSocialTwitter },
                { label: "facebook.com/", value: socialFacebook, setValue: setSocialFacebook },
                { label: "linkedin.com/company/", value: socialLinkedin, setValue: setSocialLinkedin },
              ].map((social) => (
                <div
                  key={social.label}
                  className="flex rounded-xl border border-border overflow-hidden bg-white focus-within:ring-2 focus-within:ring-teal/30 focus-within:border-teal transition-all"
                >
                  <span className="inline-flex items-center px-3.5 border-r border-border bg-slate-bg text-xs font-semibold text-muted select-none w-44 truncate">
                    {social.label}
                  </span>
                  <input
                    type="text"
                    value={social.value}
                    onChange={(e) => social.setValue(e.target.value)}
                    placeholder="username"
                    className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-dark placeholder:text-muted/40 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </FormRow>

          <div className="py-6 px-8 flex justify-between gap-3 bg-slate-bg/30 rounded-b-lg">
            <div className="flex items-center  gap-3 self-end md:self-auto">
              <button
                type="button"
                onClick={handleLogout}
                title="Se déconnecter"
                className="px-4 py-2 flex gap-2 items-center text-xs font-bold text-white bg-orange border border-border rounded-xl hover:bg-amber-700 active:scale-95 transition-all shadow-sm cursor-pointer"
              // className={cx(
              //   "shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/50 transition-colors hover:bg-white/8 hover:text-white",
              //   FOCUS_RING,
              // )}
              >
                <LogOut size={13} strokeWidth={2.5}/>
                Déconnexion
              </button>
            </div>
            <SaveCancelActions />
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted/70">
          <Mail size={12} aria-hidden="true" />
          Besoin de changer d'adresse email ? Contactez le support.
        </p>
      </div>
    </div>
  );
}