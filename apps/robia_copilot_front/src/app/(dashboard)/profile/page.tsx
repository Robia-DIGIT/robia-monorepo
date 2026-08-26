"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Check,
  X,
  LogOut,
  Shield,
  Bell,
  Lock,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Globe2,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import { api } from "@/lib/api";
import { apiService } from "@/lib/apiService";
import { sessionStore } from "@/lib/session";

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  bio: string;
};

type OrgData = {
  name: string;
  sector: string;
  city: string;
  country: string;
};

type ToastState = { type: "success" | "error"; message: string } | null;

const emptyProfile: ProfileData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  bio: "",
};

const emptyOrg: OrgData = { name: "", sector: "", city: "", country: "" };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [profileData, setProfileData] = useState<ProfileData>(emptyProfile);
  const [draftProfile, setDraftProfile] = useState<ProfileData>(emptyProfile);
  const [orgData, setOrgData] = useState<OrgData>(emptyOrg);
  const [draftOrg, setDraftOrg] = useState<OrgData>(emptyOrg);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [userRes, org] = await Promise.all([
          api.get("/users/me"),
          apiService.getCurrentOrganization(),
        ]);
        if (!mounted) return;

        const u = userRes.data || {};
        const nextProfile: ProfileData = {
          name: u.name ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          company: u.company ?? "",
          role: u.role ?? "",
          bio: u.bio ?? "",
        };
        const nextOrg: OrgData = {
          name: org?.name ?? "",
          sector: org?.sector ?? "",
          city: org?.city ?? "",
          country: org?.country ?? "",
        };

        setProfileData(nextProfile);
        setDraftProfile(nextProfile);
        setOrgData(nextOrg);
        setDraftOrg(nextOrg);
      } catch {
        if (!mounted) return;
        setLoadError(
          "Impossible de charger votre profil pour le moment. Vérifiez votre connexion et réessayez.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const initials = useMemo(
    () => getInitials(profileData.name || profileData.email),
    [profileData.name, profileData.email],
  );

  const hasOrgInfo = Boolean(
    orgData.name || orgData.sector || orgData.city || orgData.country,
  );

  function startEditing() {
    setDraftProfile(profileData);
    setDraftOrg(orgData);
    setFieldErrors({});
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftProfile(profileData);
    setDraftOrg(orgData);
    setFieldErrors({});
    setIsEditing(false);
  }

  function updateDraftProfile(field: keyof ProfileData, value: string) {
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
  }

  function updateDraftOrg(field: keyof OrgData, value: string) {
    setDraftOrg((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!draftProfile.name.trim()) {
      errors.name = "Le nom est requis.";
    }
    if (draftProfile.email && !isValidEmail(draftProfile.email)) {
      errors.email = "Adresse e-mail invalide.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.patch("/users/me", {
        phone: draftProfile.phone,
        company: draftProfile.company,
        bio: draftProfile.bio,
      });

      const orgPayload: Partial<OrgData> = {};
      if (draftOrg.name) orgPayload.name = draftOrg.name;
      if (draftOrg.sector) orgPayload.sector = draftOrg.sector;
      if (draftOrg.city) orgPayload.city = draftOrg.city;
      if (draftOrg.country) orgPayload.country = draftOrg.country;

      if (Object.keys(orgPayload).length) {
        await apiService.updateCurrentOrganization(orgPayload);
      }

      setProfileData(draftProfile);
      setOrgData(draftOrg);
      setIsEditing(false);
      setToast({ type: "success", message: "Profil mis à jour avec succès." });
    } catch  {
      setToast({
        type: "error",
        message: "Une erreur est survenue lors de l'enregistrement.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiService.logout();
    } finally {
      sessionStore.clearSession();
      router.replace("/login");
    }
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-slate-900">
            Chargement impossible
          </h2>
          <p className="mb-6 text-sm text-slate-600">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-all hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 pb-16">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-primary text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 pt-8">
        {/* Header / hero card */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-24 w-full bg-linear-to-r from-navy via-primary to-accent" />

          {!isEditing ? (
            <button
              onClick={startEditing}
              className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy shadow-sm backdrop-blur transition-all hover:bg-white"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          ) : (
            <div className="absolute right-5 top-5 flex items-center gap-2">
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition-all hover:bg-white disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Enregistrer
              </button>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 px-8 pb-8">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-primary text-2xl font-bold text-white shadow-md">
              {initials}
            </div>

            <div className="w-full max-w-sm text-center">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={draftProfile.name}
                    onChange={(e) => updateDraftProfile("name", e.target.value)}
                    placeholder="Votre nom"
                    className={`mb-1 w-full rounded-lg border px-4 py-2 text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary ${
                      fieldErrors.name ? "border-red-400" : "border-slate-300"
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mb-2 text-xs font-medium text-red-500">
                      {fieldErrors.name}
                    </p>
                  )}
                  <input
                    type="text"
                    value={draftProfile.role}
                    onChange={(e) => updateDraftProfile("role", e.target.value)}
                    placeholder="Votre rôle"
                    className="w-full rounded-lg border border-slate-300 px-4 py-1.5 text-center text-sm text-slate-600 outline-none focus:ring-2 focus:ring-primary"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    {profileData.name || "Nom non renseigné"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {profileData.role || "Rôle non renseigné"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-900">
            Informations personnelles
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <InfoField
              icon={Mail}
              label="Email"
              editing={isEditing}
              value={isEditing ? draftProfile.email : profileData.email}
              onChange={(v) => updateDraftProfile("email", v)}
              type="email"
              error={fieldErrors.email}
              placeholder="vous@exemple.com"
            />
            <InfoField
              icon={Phone}
              label="Téléphone"
              editing={isEditing}
              value={isEditing ? draftProfile.phone : profileData.phone}
              onChange={(v) => updateDraftProfile("phone", v)}
              type="tel"
              placeholder="+261 34 00 000 00"
            />
            <InfoField
              icon={Building2}
              label="Entreprise"
              editing={isEditing}
              value={isEditing ? draftProfile.company : profileData.company}
              onChange={(v) => updateDraftProfile("company", v)}
              placeholder="Nom de votre entreprise"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
              <Sparkles className="h-4 w-4 text-primary" />
              Biographie
            </label>
            {isEditing ? (
              <textarea
                value={draftProfile.bio}
                onChange={(e) => updateDraftProfile("bio", e.target.value)}
                placeholder="Parlez un peu de vous ou de votre activité…"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                rows={4}
              />
            ) : (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {profileData.bio ||
                  "Aucune biographie renseignée pour le moment."}
              </p>
            )}
          </div>
        </div>

        {/* Organization Section */}
        {(isEditing || hasOrgInfo) && (
          <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">
              Organisation
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <InfoField
                icon={Building2}
                label="Nom de l'organisation"
                editing={isEditing}
                value={isEditing ? draftOrg.name : orgData.name}
                onChange={(v) => updateDraftOrg("name", v)}
                placeholder="Ex. ROBIA Copilot"
              />
              <InfoField
                icon={Briefcase}
                label="Secteur"
                editing={isEditing}
                value={isEditing ? draftOrg.sector : orgData.sector}
                onChange={(v) => updateDraftOrg("sector", v)}
                placeholder="Ex. Restauration"
              />
              <InfoField
                icon={MapPin}
                label="Ville"
                editing={isEditing}
                value={isEditing ? draftOrg.city : orgData.city}
                onChange={(v) => updateDraftOrg("city", v)}
                placeholder="Ex. Antananarivo"
              />
              <InfoField
                icon={Globe2}
                label="Pays"
                editing={isEditing}
                value={isEditing ? draftOrg.country : orgData.country}
                onChange={(v) => updateDraftOrg("country", v)}
                placeholder="Ex. Madagascar"
              />
            </div>
          </div>
        )}

        {/* Settings Section */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-900">Paramètres</h3>

          <div className="space-y-3">
            <SettingsRow
              icon={Bell}
              title="Notifications"
              description="Gérer vos préférences de notification"
            />
            <SettingsRow
              icon={Lock}
              title="Sécurité & confidentialité"
              description="Modifier votre mot de passe"
            />
            <SettingsRow
              icon={Shield}
              title="Sessions actives"
              description="Gérer vos sessions de connexion"
            />
          </div>
        </div>

        {/* Logout Section */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 font-medium text-red-600 transition-all hover:bg-red-100"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">
              Se déconnecter ?
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              Vous devrez vous reconnecter pour accéder à votre espace ROBIA.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                disabled={loggingOut}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-70"
              >
                {loggingOut && <Loader2 className="h-4 w-4 animate-spin" />}
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({
  icon: Icon,
  label,
  editing,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  editing: boolean;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </label>
      {editing ? (
        <>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary ${
              error ? "border-red-400" : "border-slate-300"
            }`}
          />
          {error && (
            <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
          )}
        </>
      ) : (
        <p className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-900">
          {value || <span className="text-slate-400">Non renseigné</span>}
        </p>
      )}
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <button className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-linear-to-br from-slate-50 to-slate-100 pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-24 w-full bg-slate-200" />
          <div className="flex flex-col items-center gap-3 px-8 pb-8">
            <div className="-mt-12 h-24 w-24 rounded-full border-4 border-white bg-slate-200" />
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-4 w-28 rounded bg-slate-200" />
          </div>
        </div>
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 h-5 w-48 rounded bg-slate-200" />
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="h-9 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 h-5 w-32 rounded bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
