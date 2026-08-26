"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { useStartAudit } from "@/hooks/api";

export default function AuditLoadingPage() {
  const router = useRouter();
  const startAudit = useStartAudit();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [auditStarted, setAuditStarted] = useState(false);

  const steps = [
    { name: "Analyse sémantique de la structure du site", duration: 1500 },
    { name: "Exploration des pages indexées sur Google", duration: 2000 },
    { name: "Calcul de la pertinence des mots-clés locaux", duration: 1500 },
    { name: "Identification des opportunités d'optimisation", duration: 1800 },
    { name: "Génération finale du score ROBIA Copilot", duration: 1200 },
  ];

  useEffect(() => {
    startAudit.mutate(undefined, {
      onSuccess: () => setAuditStarted(true),
      onError: () => setAuditStarted(true),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    const runSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        if (!active) return;
        setCurrentStep(i);

        const stepDuration = steps[i].duration;
        const intervalTime = 100;
        const stepsCount = stepDuration / intervalTime;
        const progressIncrement = 20 / stepsCount;

        for (let j = 0; j < stepsCount; j++) {
          if (!active) return;
          await new Promise((r) => setTimeout(r, intervalTime));
          setProgress((prev) => Math.min(prev + progressIncrement, (i + 1) * 20));
        }
      }

      if (active) {
        setProgress(100);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      }
    };

    runSteps();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-navy">Audit SEO en cours...</h1>
        <p className="text-sm text-light-slate">
          ROBIA analyse la visibilité sémantique locale de votre entreprise. Cette opération peut prendre quelques secondes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 flex flex-col items-center space-y-6">
        <div className="relative h-32 w-32 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FDF5E7" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#14B8A6"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-200 ease-out"
            />
          </svg>
          <div className="text-center">
            <span className="text-3xl font-black text-navy">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="w-full space-y-3 pt-4 border-t border-gray-100">
          {steps.map((step, idx) => {
            const isCompleted = progress >= (idx + 1) * 20;
            const isCurrent = currentStep === idx && progress < (idx + 1) * 20;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isCompleted
                    ? "bg-primary/5 border-primary/25 text-navy font-semibold"
                    : isCurrent
                      ? "bg-secondary/45 border-accent/20 text-navy font-semibold animate-pulse"
                      : "bg-gray-50 border-gray-100 text-light-slate"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-primary fill-current text-white" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 text-accent animate-spin" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="text-xs">{step.name}</span>
                </div>
                {isCompleted && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Terminé</span>
                )}
                {isCurrent && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-accent">Analyse...</span>
                )}
              </div>
            );
          })}
        </div>

        {progress === 100 && (
          <div className="w-full flex items-center gap-2 bg-primary/10 border border-primary/20 text-navy rounded-lg p-3 text-xs justify-center font-bold">
            Redirection vers le tableau de bord dans un instant...
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-xs text-light-slate hover:text-navy hover:underline transition-colors cursor-pointer"
        >
          Passer l&apos;animation
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
