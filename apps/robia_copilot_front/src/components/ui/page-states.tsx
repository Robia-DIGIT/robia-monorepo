"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoader({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function PageError({
  message = "Une erreur est survenue lors du chargement des données.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-sm text-light-slate max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}
