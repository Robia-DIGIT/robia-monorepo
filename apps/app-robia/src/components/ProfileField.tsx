import { Lock } from "lucide-react";

interface BaseProps {
  id: string;
  label: string;
  editing: boolean;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  readOnlyHint?: string;
  error?: string | null;
  hint?: string;
}

interface TextFieldProps extends BaseProps {
  as?: "text";
  onChange?: (value: string) => void;
}

interface TextareaFieldProps extends BaseProps {
  as: "textarea";
  onChange?: (value: string) => void;
  maxLength?: number;
}

type ProfileFieldProps = TextFieldProps | TextareaFieldProps;

const inputClasses =
  "w-full rounded-lg border border-dark-slate/15 bg-white px-3 py-2 text-sm text-dark-slate placeholder:text-light-slate/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

export function ProfileField(props: ProfileFieldProps) {
  const { id, label, editing, value, placeholder, readOnly, readOnlyHint, error, hint } = props;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-light-slate">
          {label}
        </label>
        {readOnly && (
          <span className="flex items-center gap-1 text-[11px] text-light-slate/80">
            <Lock size={11} aria-hidden="true" />
            {readOnlyHint ?? "Non modifiable"}
          </span>
        )}
      </div>

      {editing && !readOnly ? (
        <>
          {props.as === "textarea" ? (
            <textarea
              id={id}
              rows={3}
              value={value}
              placeholder={placeholder}
              maxLength={props.maxLength}
              onChange={(e) => props.onChange?.(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className={`${inputClasses} resize-none`}
            />
          ) : (
            <input
              id={id}
              type="text"
              value={value}
              placeholder={placeholder}
              onChange={(e) => props.onChange?.(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className={inputClasses}
            />
          )}
          {props.as === "textarea" && props.maxLength && (
            <div className="mt-1 text-right text-[11px] text-light-slate/70">
              {value.length}/{props.maxLength}
            </div>
          )}
          {error && (
            <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
              {error}
            </p>
          )}
          {!error && hint && <p className="mt-1 text-xs text-light-slate/80">{hint}</p>}
        </>
      ) : (
        <p className={`text-sm ${value ? "text-dark-slate" : "text-light-slate/70 italic"}`}>
          {value || "Non renseigné"}
        </p>
      )}
    </div>
  );
}