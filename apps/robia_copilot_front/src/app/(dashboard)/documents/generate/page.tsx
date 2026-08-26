"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Send, ArrowRight, Sparkles, AlertCircle, HelpCircle } from "lucide-react";

export default function DocumentGeneratePage() {
  const router = useRouter();
  const [docType, setDocType] = useState<"email" | "script" | "report">("email");
  const [tone, setTone] = useState("professional");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate IA generation latency
    setTimeout(() => {
      setIsGenerating(false);
      // Redirect to edit page of generated document
      router.push("/documents/doc-123/edit");
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Génération de Document par IA
        </h1>
        <p className="text-xs text-light-slate">
          Créez automatiquement des e-mails d'instructions de développement, des rapports SEO ou des scripts d'optimisation basés sur vos opportunités.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          
          {/* Document Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy block">1. Type de document à générer</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "email", name: "E-mail Développeur", desc: "Consignes techniques d'intégration" },
                { id: "script", name: "Code / Script d'intégration", desc: "JSON-LD, balises META" },
                { id: "report", name: "Rapport de validation PME", desc: "Synthèse pour validation interne" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDocType(t.id as any)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-28 cursor-pointer ${
                    docType === t.id
                      ? "border-primary bg-primary/5 text-navy font-bold ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-primary/50 text-light-slate"
                  }`}
                >
                  <FileText className={`h-5 w-5 ${docType === t.id ? "text-primary" : "text-light-slate"}`} />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block text-navy">{t.name}</span>
                    <span className="text-[10px] text-light-slate block leading-tight">{t.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy block">2. Ton du document</label>
            <div className="flex gap-2">
              {[
                { id: "professional", label: "Professionnel & Technique" },
                { id: "direct", label: "Direct & Pragmatique" },
                { id: "educational", label: "Pédagogique (Explicatif)" }
              ].map((tn) => (
                <button
                  key={tn.id}
                  type="button"
                  onClick={() => setTone(tn.id)}
                  className={`px-4 py-2 text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                    tone === tn.id
                      ? "bg-navy text-white border-navy"
                      : "border-gray-200 hover:bg-gray-50 text-light-slate"
                  }`}
                >
                  {tn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Context/Instructions */}
          <div className="space-y-1.5">
            <label htmlFor="instructions" className="text-xs font-bold text-navy block">
              3. Consignes supplémentaires (Optionnel)
            </label>
            <textarea
              id="instructions"
              rows={4}
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              placeholder="Ex: Demandez d'insérer cela dans le fichier header.php avant lundi prochain..."
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-light-slate">
              <AlertCircle className="h-3.5 w-3.5 text-primary" />
              <span>Génération instantanée en moins de 5 secondes</span>
            </div>
            
            <button
              type="submit"
              disabled={isGenerating}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer ${
                isGenerating
                  ? "bg-gray-150 text-gray-400 cursor-not-allowed"
                  : "bg-accent text-white hover:bg-accent/95 shadow-accent/25"
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Génération en cours...
                </>
              ) : (
                <>
                  Lancer la génération
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
