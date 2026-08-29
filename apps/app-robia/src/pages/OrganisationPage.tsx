import {
  useId,
  useMemo,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ChangeEvent,
  type FocusEvent,
} from 'react'
import {
  Building2,
  MapPin,
  Store,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Star,
  Globe2,
  AlertCircle,
  Radar,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createOrganization, type Organization } from '../lib/api'
import { clearWorkspaceOnboarding, readWorkspaceOnboarding } from '../lib/onboarding'

// ─────────────────────────────────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none'
  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-[15px] gap-2',
  } as const
  const variants = {
    primary:
      'bg-[#F97316] text-white hover:bg-[#EA580C] active:bg-[#C2410C] focus-visible:ring-[#F97316] shadow-sm shadow-[#F97316]/20 disabled:opacity-50 disabled:shadow-none',
    outline:
      'border border-border text-dark hover:bg-slate-bg hover:border-[#CBD5E1] focus-visible:ring-[#1D4ED8] disabled:opacity-50',
    ghost:
      'text-muted hover:bg-border-light hover:text-dark focus-visible:ring-[#1D4ED8] disabled:opacity-50',
  }
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

interface BadgeProps {
  variant?: 'teal' | 'orange' | 'gray'
  children: ReactNode
}

function Badge({ variant = 'gray', children }: BadgeProps) {
  const variants = {
    teal: 'bg-teal-light text-teal-dark border-[#99F6E4]/60',
    orange: 'bg-[#FED7AA] text-[#C2410C] border-[#FDBA74]/60',
    gray: 'bg-border-light text-[#475569] border-border',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

function Input({ label, error, hint, icon, id, className = '', ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-dark mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border ${
            error ? 'border-red-400' : 'border-border'
          } rounded-xl text-sm text-dark placeholder-[#94A3B8] focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-400/30' : 'focus:ring-teal/30'
          } focus:border-teal transition-all disabled:bg-slate-bg disabled:text-muted ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[#94A3B8]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  icon?: ReactNode
}

function Select({ label, icon, id, className = '', children, ...props }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-dark mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            {icon}
          </div>
        )}
        <select
          id={selectId}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-8 py-2.5 bg-white border border-border rounded-xl text-sm text-dark focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none text-xs">
          ▾
        </div>
      </div>
    </div>
  )
}

interface AlertProps {
  variant?: 'error' | 'success'
  children: ReactNode
}

function Alert({ variant = 'error', children }: AlertProps) {
  const styles = {
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', Icon: AlertCircle },
    success: { bg: 'bg-teal-light', border: 'border-[#99F6E4]', text: 'text-teal-dark', Icon: CheckCircle2 },
  } as const
  const { bg, border, text, Icon } = styles[variant]
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`${bg} border ${border} rounded-xl p-3.5 flex gap-2.5 items-start`}>
      <Icon size={16} className={`${text} shrink-0 mt-0.5`} aria-hidden />
      <div className={`text-sm ${text}`}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Domain constants
// ─────────────────────────────────────────────────────────────────────────

const SECTEURS = [
  'Alimentation',
  'Commerce & Détail',
  'Artisanat',
  'Services',
  'Tourisme & Hôtellerie',
  'Santé & Bien-être',
  'Éducation',
  'Technologie',
  'Autre',
] as const

const REQUIRED_FIELDS = ['name'] as const
const TRACKED_FIELDS = ['name', 'sector', 'city', 'country'] as const

interface OrganizationForm {
  name: string
  sector: string
  city: string
  country: string
}

type FieldErrors = Partial<Record<keyof OrganizationForm, string>>
type Status = 'idle' | 'loading' | 'error' | 'success'

const EMPTY_FORM: OrganizationForm = { name: '', sector: '', city: '', country: 'Madagascar' }

function validate(form: OrganizationForm): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = 'Le nom de l\u2019organisation est requis.'
  else if (form.name.trim().length < 2) errors.name = 'Le nom doit contenir au moins 2 caractères.'
  return errors
}

// ─────────────────────────────────────────────────────────────────────────
// Preview card
// ─────────────────────────────────────────────────────────────────────────

function OrganizationPreview({ form }: { form: OrganizationForm }) {
  const location = [form.city, form.country].filter(Boolean).join(', ')

  return (
    <div className="lg:sticky lg:top-6">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">
        Aperçu de votre fiche locale
      </p>
      <div className="border-t-2 border-orange bg-white overflow-hidden">
        <div className="h-20 bg-navy relative">
          <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-sm flex items-center justify-center">
            <div className="w-full h-full rounded-xl bg-orange-light flex items-center justify-center">
              <Store size={20} className="text-[#C2410C]" aria-hidden />
            </div>
          </div>
        </div>
        <div className="pt-9 px-5 pb-5">
          <h3 className="font-bold text-dark text-[15px] leading-snug truncate">
            {form.name || <span className="text-[#CBD5E1]">Nom de votre organisation</span>}
          </h3>

          <div className="flex items-center gap-1 mt-1.5" aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={12} className="text-border fill-border" />
            ))}
            <span className="text-[11px] text-[#94A3B8] ml-1">Pas encore d&apos;avis</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {form.sector ? (
              <Badge variant="orange">{form.sector}</Badge>
            ) : (
              <Badge variant="gray">Secteur non défini</Badge>
            )}
          </div>

          <div className="flex items-start gap-1.5 mt-3.5 text-[13px] text-muted">
            <MapPin size={13} className="shrink-0 mt-0.5 text-[#94A3B8]" aria-hidden />
            <span>{location || 'Localisation à renseigner'}</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[#94A3B8] mt-2.5 px-1 leading-relaxed">
        C&apos;est à partir de ces informations que ROBIA générera votre premier audit de visibilité
        locale.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Success state
// ─────────────────────────────────────────────────────────────────────────

function SuccessPanel({ organization, onReset }: { organization: Organization; onReset: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-140 w-full flex items-center justify-center bg-slate-bg rounded-2xl p-6">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-light flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={26} className="text-teal-dark" aria-hidden />
        </div>
        <h2 className="text-lg font-bold text-dark mb-1.5">Organisation créée</h2>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          <span className="font-semibold text-dark">{organization.name}</span> est prête. Ajoutez un
          site web pour lancer votre premier audit local.
        </p>
        <Button
          className="w-full"
          iconRight={<ArrowRight size={15} />}
          onClick={() => navigate('/analyse', { replace: true })}
        >
          Ajouter mon site web
        </Button>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 text-xs text-[#94A3B8] hover:text-muted focus:outline-none focus-visible:underline"
        >
          Créer une autre organisation
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

interface CreateOrganizationPageProps {
  onCreated?: (organization: Organization) => void
}

export default function CreateOrganizationPage({ onCreated }: CreateOrganizationPageProps) {
  const onboarding = useMemo(() => readWorkspaceOnboarding(), [])
  const [form, setForm] = useState<OrganizationForm>(() => ({
    ...EMPTY_FORM,
    name: onboarding?.company ?? '',
  }))
  const [touched, setTouched] = useState<Partial<Record<keyof OrganizationForm, boolean>>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState('')
  const [created, setCreated] = useState<Organization | null>(null)
  const navigate = useNavigate()

  const errors = useMemo(() => validate(form), [form])

  const filledCount = useMemo(
    () => TRACKED_FIELDS.filter((field) => form[field].trim().length > 0).length,
    [form],
  )
  const progress = Math.round((filledCount / TRACKED_FIELDS.length) * 100)

  function update(field: keyof OrganizationForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function markTouched(field: keyof OrganizationForm) {
    return (_e: FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
      setTouched((t) => ({ ...t, [field]: true }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTouched((t) => ({ ...t, ...Object.fromEntries(REQUIRED_FIELDS.map((f) => [f, true])) }))
    if (Object.keys(errors).length > 0) return

    setStatus('loading')
    setSubmitError('')
    try {
      const organization = await createOrganization({
        name: form.name.trim(),
        sector: form.sector || null,
        city: form.city || null,
        country: form.country || null,
      })
      setCreated(organization)
      setStatus('success')
      clearWorkspaceOnboarding()
      onCreated?.(organization)
      navigate('/analyse', { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setStatus('error')
    }
  }

  function handleReset() {
    setStatus('idle')
    setCreated(null)
    setTouched({})
    setForm(EMPTY_FORM)
  }

  if (status === 'success' && created) {
    return <SuccessPanel organization={created} onReset={handleReset} />
  }

  return (
    <div className="min-h-screen w-full bg-slate-bg p-5 md:p-8">
      <header className="mb-7 border-b border-border pb-6">
        <div className="max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Étape 2 · Profil entreprise</p>
          <h1 className="text-2xl font-bold text-dark">Créer votre organisation</h1>
          <p className="text-sm text-muted mt-0.5">
            Ces informations servent de base à votre audit de référencement local.
          </p>
          {onboarding && (
            <p className="mt-2 inline-flex rounded-full bg-teal-light px-3 py-1 text-xs font-semibold text-teal-dark">
              Rôle : {onboarding.role === 'owner' ? 'Propriétaire' : onboarding.role === 'manager' ? 'Responsable' : 'Membre'}
            </p>
          )}
        </div>
      </header>

      <div className="grid max-w-6xl lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="border-t-2 border-teal bg-white p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              Informations générales
            </span>
            <span className="text-xs font-semibold text-teal tabular-nums">{progress}% complété</span>
          </div>
          <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden -mt-3 mb-1">
            <div
              className="h-full bg-teal rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <Input
            label="Nom de l'organisation"
            placeholder="Ex : Boulangerie Test"
            icon={<Building2 size={16} />}
            value={form.name}
            onChange={update('name')}
            onBlur={markTouched('name')}
            error={touched.name ? errors.name : undefined}
            required
          />

          <Select
            label="Secteur d'activité"
            icon={<Store size={16} />}
            value={form.sector}
            onChange={update('sector')}
          >
            <option value="">Sélectionner un secteur</option>
            {SECTEURS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ville"
              placeholder="Antananarivo"
              icon={<MapPin size={16} />}
              value={form.city}
              onChange={update('city')}
            />
            <Input
              label="Pays"
              placeholder="Madagascar"
              icon={<Globe2 size={16} />}
              value={form.country}
              onChange={update('country')}
            />
          </div>

          {status === 'error' && <Alert variant="error">{submitError}</Alert>}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              size="lg"
              loading={status === 'loading'}
              disabled={Object.keys(errors).length > 0}
              iconRight={<ArrowRight size={16} />}
            >
              Créer l&apos;organisation
            </Button>
            <span className="text-xs text-[#94A3B8]">Vous pourrez modifier ces infos plus tard</span>
          </div>
        </form>

        {/* Live preview */}
        <OrganizationPreview form={form} />
      </div>
    </div>
  )
}