"use client";

import { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";

interface NpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NpsModal({ isOpen, onClose }: NpsModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;
    
    // Simulate API call
    console.log("NPS Feedback Submitted:", { rating, comment });
    setIsSubmitted(true);
    setTimeout(() => {
      // Auto close after success
      setIsSubmitted(false);
      setRating(null);
      setComment("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4 relative z-10 border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-light-slate hover:text-navy hover:bg-gray-100 rounded-full transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-navy">Votre avis nous intéresse !</h3>
              <p className="text-sm text-light-slate">
                Quelle est la probabilité que vous recommandiez <strong className="text-navy">ROBIA Copilot</strong> à un collègue ou partenaire ?
              </p>
            </div>

            {/* Score Selector (0-10) */}
            <div className="space-y-2">
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                      rating === i
                        ? "bg-accent text-white scale-110 shadow-md shadow-accent/20"
                        : "bg-secondary text-navy hover:bg-primary/20"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-light-slate px-1">
                <span>Pas du tout probable</span>
                <span>Extrêmement probable</span>
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-1.5">
              <label htmlFor="nps-comment" className="text-xs font-semibold text-navy">
                Qu'est-ce qui pourrait être amélioré ? (Optionnel)
              </label>
              <textarea
                id="nps-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez vos impressions ou suggestions d'amélioration..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-dark-slate"
              />
            </div>

            {/* Submit CTA */}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-light-slate hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={rating === null}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all shadow-md cursor-pointer ${
                  rating !== null
                    ? "bg-primary text-navy hover:bg-primary/95 shadow-primary/25"
                    : "bg-gray-150 text-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                <Send className="h-4 w-4" />
                Envoyer les commentaires
              </button>
            </div>
          </form>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-navy">Merci beaucoup !</h4>
              <p className="text-sm text-light-slate">
                Vos retours précieux nous aident à améliorer ROBIA Copilot tous les jours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
