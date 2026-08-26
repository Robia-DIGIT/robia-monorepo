"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, Copy, FileDown, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";

export default function DocumentEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [documentTitle, setDocumentTitle] = useState("Instruction SEO - Titre Page Accueil");
  const [content, setContent] = useState(`Bonjour,

Dans le cadre de l'optimisation SEO locale de notre site internet, pourriez-vous s'il vous plaît mettre à jour la balise meta Title de la page d'accueil de notre CMS ?

Voici les informations à intégrer :

- Balise Title Actuelle : "Accueil - Boulangerie Martin"
- Nouvelle Balise Title à insérer : "Boulangerie Artisanale Paris 11 - Maison Martin | Pains Bio & Viennoiseries"

Ces modifications sont très importantes pour améliorer notre positionnement sur les recherches locales liées aux boulangeries dans le 11e arrondissement de Paris.

Merci d'avance pour votre aide.

Cordialement,
L'équipe Maison Martin`);

  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Redirect to validation screen
      router.push("/validation");
    }, 1200);
  };

  const handlePdfExport = () => {
    alert("Exportation PDF en cours de traitement...");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push("/documents/generate")}
          className="flex items-center gap-2 text-xs font-bold text-navy hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au générateur
        </button>
        <span className="text-[10px] bg-primary/10 border border-primary/20 text-navy font-bold px-2 py-0.5 rounded">
          Document Éditable
        </span>
      </div>

      {/* Editor & Sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Editor Textarea (P0/P1) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 lg:col-span-3 space-y-4">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="w-full text-lg font-bold text-navy border-b border-gray-150 pb-2 focus:outline-none focus:border-primary"
          />

          <textarea
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-xs font-mono border border-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-dark-slate leading-relaxed resize-y"
          />
        </div>

        {/* Sidebar Actions Panel (P1 - Export / Actions) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 h-fit space-y-6">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Options d&apos;export</h3>

          <div className="space-y-3">
            
            {/* Copy Content */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                isCopied
                  ? "bg-green-50 border-green-200 text-green-600"
                  : "border-gray-200 text-navy hover:bg-gray-50"
              }`}
            >
              <Copy className="h-4 w-4" />
              {isCopied ? "Copié !" : "Copier le texte"}
            </button>

            {/* Export PDF */}
            <button
              onClick={handlePdfExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg border border-gray-200 text-navy hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              Exporter en PDF
            </button>

          </div>

          <div className="border-t border-gray-150 pt-6 space-y-3">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Soumettre</h3>
            <p className="text-[10px] text-light-slate">
              Soumettez ce document pour validation interne avant envoi.
            </p>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-navy hover:bg-primary/95 text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
            >
              {isSaving ? "Enregistrement..." : "Soumettre pour Validation"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
