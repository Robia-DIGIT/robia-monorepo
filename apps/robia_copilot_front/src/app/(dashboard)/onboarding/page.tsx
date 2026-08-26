"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Globe, FileText, Users, Landmark, ArrowRight, Contact } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/api";
import { PageLoader } from "@/components/ui/page-states";

const SIZE_MAP: Record<string, number> = {
  "1-10": 5,
  "11-50": 30,
  "51-200": 100,
  "200+": 250,
};

const SIZE_REVERSE: Record<number, string> = {
  5: "1-10",
  30: "11-50",
  100: "51-200",
  250: "200+",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    companyName: "",
    website: "",
    adresse: "",
    industry: "Technologie",
    size: "1-10",
    contact: "",
    description: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || "",
        website: profile.website || "",
        adresse: "",
        industry: profile.industry || "Technologie",
        size: SIZE_REVERSE[profile.size] || "1-10",
        contact: "",
        description: profile.description || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      companyName: formData.companyName,
      website: formData.website,
      industry: formData.industry,
      size: SIZE_MAP[formData.size] || 5,
      description: formData.description,
    });
    router.push("/connect-site");
  };

  if (isLoading) {
    return <PageLoader rows={5} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-extrabold text-navy">Étape 1: Profil de votre PME</h1>
        <p className="text-sm text-light-slate">
          Renseignez les détails de votre entreprise pour que notre IA puisse adapter son audit SEO et sémantique.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="h-2.5 w-12 rounded-full bg-primary" />
          <span className="h-2.5 w-12 rounded-full bg-gray-200" />
          <span className="h-2.5 w-12 rounded-full bg-gray-200" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="companyName" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Nom de l&apos;entreprise
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ex. Robia Tech"
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Site internet (URL)
              </label>
              <input
                id="website"
                type="url"
                required
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.mon-entreprise.fr"
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-primary" />
                Adresse
              </label>
              <input
                id="address"
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Antananarivo, Madagascar , LOT 123, Rue 456"
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Contact className="h-3.5 w-3.5 text-primary" />
                Contact
              </label>
              <input
                id="contact"
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="John Doe, +261 34 12 345 67"
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="industry" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Secteur d&apos;activité
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white transition-all"
              >
                <option value="Technologie">Technologie / Logiciel</option>
                <option value="Services">Services aux entreprises</option>
                <option value="Commerce">Commerce / E-commerce</option>
                <option value="Santé">Santé & Bien-être</option>
                <option value="Construction">BTP & Construction</option>
                <option value="Artisanat">Artisanat & Commerce local</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="size" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Taille de l&apos;entreprise
              </label>
              <div className="grid grid-cols-4 gap-3">
                {["1-10", "11-50", "51-200", "200+"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, size: s })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      formData.size === s
                        ? "bg-primary text-navy border-primary shadow-sm"
                        : "border-gray-250 hover:bg-gray-50 text-light-slate"
                    }`}
                  >
                    {s} salariés
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="description" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Description de l&apos;activité & cibles (Mots clés importants, etc.)
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez vos services, vos clients cibles et votre positionnement sur le marché..."
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 py-3 px-6 bg-accent text-white hover:bg-accent/95 text-sm font-bold rounded-lg shadow-md shadow-accent/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {updateProfile.isPending ? "Enregistrement..." : "Étape suivante: Connexion du site"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
