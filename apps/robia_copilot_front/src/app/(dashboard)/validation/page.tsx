"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, History, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ValidationPage() {
  const [comments, setComments] = useState("");
  const [validationState, setValidationState] = useState<"idle" | "approved" | "rejected">("idle");

  const handleApprove = () => {
    setValidationState("approved");
  };

  const handleReject = () => {
    setValidationState("rejected");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Écran de Validation</h1>
          <p className="text-xs text-light-slate">
            Validez la conformité du document généré avant de l'envoyer ou de l'appliquer.
          </p>
        </div>
        <Link
          href="/validation/history"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-bold text-navy hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
        >
          <History className="h-4 w-4" />
          Historique
        </Link>
      </div>

      {validationState === "idle" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Review column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Document preview card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-4">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Aperçu du document</h3>
              <div className="bg-secondary/20 rounded-xl p-4 border border-accent/5 font-mono text-[10px] text-dark-slate leading-relaxed whitespace-pre-wrap">
                {`Objet : Mettre à jour la balise meta Title de la page d'accueil

Bonjour,

Dans le cadre de l'optimisation SEO locale de notre site internet, pourriez-vous s'il vous plaît mettre à jour la balise meta Title de la page d'accueil de notre CMS ?

- Nouvelle Balise Title à insérer : "Boulangerie Artisanale Paris 11 - Maison Martin | Pains Bio & Viennoiseries"

Merci d'avance pour votre aide.`}
              </div>
            </div>

            {/* Comment Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-3">
              <label htmlFor="comments" className="text-xs font-bold text-navy flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
                Ajouter une remarque ou des corrections
              </label>
              <textarea
                id="comments"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Renseignez ici des instructions complémentaires si vous rejetez le document..."
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

          </div>

          {/* Right / Actions column */}
          <div className="space-y-4">
            
            {/* Action Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-4">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Décision de validation</h3>
              
              <div className="space-y-3">
                {/* Approve button */}
                <button
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-navy hover:bg-primary/95 text-xs font-bold rounded-lg shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-navy fill-current text-white text-primary" />
                  Approuver & Publier
                </button>

                {/* Reject button */}
                <button
                  onClick={handleReject}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-200 text-red-650 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter le document
                </button>
              </div>

              <p className="text-[10px] text-light-slate text-center">
                Une validation enregistre cette action dans le journal historique.
              </p>
            </div>

          </div>
        </div>
      ) : validationState === "approved" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 text-center space-y-4 py-12">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto fill-current text-white" />
          <h2 className="text-xl font-bold text-navy">Document Approuvé avec Succès</h2>
          <p className="text-xs text-light-slate max-w-md mx-auto">
            Le document a été marqué comme valide et prêt à être envoyé. Un e-mail d'instruction a été programmé.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setValidationState("idle")}
              className="px-6 py-2.5 bg-navy text-white hover:bg-navy/95 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Retour
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 text-center space-y-4 py-12">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-navy">Document Rejeté</h2>
          <p className="text-xs text-light-slate max-w-md mx-auto">
            Le document a été renvoyé à l'état de brouillon. Vos commentaires ont été enregistrés pour corriger le contenu.
          </p>
          {comments && (
            <div className="bg-red-50 text-red-600 font-mono text-[10px] p-3 rounded-lg border border-red-100 max-w-md mx-auto text-left">
              <strong>Motif :</strong> {comments}
            </div>
          )}
          <div className="pt-4">
            <button
              onClick={() => setValidationState("idle")}
              className="px-6 py-2.5 bg-navy text-white hover:bg-navy/95 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
