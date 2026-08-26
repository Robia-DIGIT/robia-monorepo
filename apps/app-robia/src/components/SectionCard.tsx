import type { ReactNode } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

interface SectionCardProps {
  title: string;
  description?: string;
  editing: boolean;
  isDirty: boolean;
  saving: boolean;
  saveError: string | null;
  justSaved: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  children: ReactNode;
}

export function SectionCard({
  title,
  description,
  editing,
  isDirty,
  saving,
  saveError,
  justSaved,
  onEdit,
  onCancel,
  onSave,
  saveDisabled,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-dark-slate/10 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-dark-slate">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-light-slate">{description}</p>}
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={onEdit}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dark-slate/15 px-3 py-1.5 text-xs font-medium text-dark-slate transition-colors hover:border-primary hover:text-primary"
          >
            <Pencil size={13} aria-hidden="true" />
            Modifier
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            {justSaved && !isDirty && (
              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                <Check size={13} aria-hidden="true" />
                Enregistré
              </span>
            )}
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-light-slate transition-colors hover:text-dark-slate disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !isDirty || saveDisabled}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
              Enregistrer
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">{children}</div>

      {saveError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <X size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}
    </section>
  );
}