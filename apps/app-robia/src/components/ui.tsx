import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import { Search, X, AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'

// ── Buttons ──────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

export function Button({
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
  const base = 'inline-flex items-center justify-center gap-2  font-semibold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none'
  
const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-13 px-4 text-[15px] gap-2',
} as const
  const variants = {
    primary: 'bg-[#F97316] text-white hover:bg-[#EA580C] focus-visible:ring-[#F97316] shadow-none disabled:opacity-50',
    secondary: 'bg-[#1F3A5F] text-white hover:bg-[#2D5282] focus-visible:ring-[#1F3A5F] shadow-none disabled:opacity-50',
    outline: 'border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] focus-visible:ring-[#1D4ED8] disabled:opacity-50',
    ghost: 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] focus-visible:ring-[#1D4ED8] disabled:opacity-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 disabled:opacity-50',
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${(disabled || loading) ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin-slow" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: 'teal' | 'orange' | 'blue' | 'gray' | 'red' | 'green'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  const variants = {
    teal: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]/60',
    orange: 'bg-[#FED7AA] text-[#C2410C] border-[#FDBA74]/60',
    blue: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]/60',
    gray: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-border shadow-[0_1px_2px_rgba(31,58,95,0.04)] ${hover ? 'hover:border-teal/35 transition-all duration-200 cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  delta?: string
  deltaUp?: boolean
  icon: ReactNode
  iconBg?: string
  suffix?: string
}

export function KpiCard({ label, value, delta, deltaUp = true, icon, iconBg = 'bg-[#CCFBF1]', suffix }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-teal">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {delta && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deltaUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-dark leading-none">
        {value}<span className="text-lg font-medium text-muted ml-1">{suffix}</span>
      </div>
      <div className="text-sm text-muted mt-1.5">{label}</div>
    </Card>
  )
}


interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: string
  label?: string
  showValue?: boolean
}

export function ProgressBar({ value, max = 100, color = '#14B8A6', height = 'h-2', label, showValue = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-muted">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-dark">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-border-light rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-dark mb-1.5">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</div>
        )}
        <input
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border ${error ? 'border-red-400' : 'border-border'} rounded-xl text-sm text-dark placeholder-[#94A3B8] focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-400/30' : 'focus:ring-teal/30'} focus:border-teal transition-all ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Search Bar ────────────────────────────────────────────────────────────────

export function SearchBar({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
        <Search size={18} />
      </div>
      <input
        className="w-full pl-12 pr-4 py-3.5 bg-white border border-border rounded-2xl text-dark placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-base shadow-sm"
        {...props}
      />
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 bg-border-light rounded-xl ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            active === tab
              ? 'bg-white text-dark shadow-sm'
              : 'text-muted hover:text-dark'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  onClose?: () => void
}

export function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  const styles = {
    info: { bg: 'bg-[#DBEAFE]', border: 'border-[#BFDBFE]', text: 'text-[#1E40AF]', Icon: Info },
    success: { bg: 'bg-[#CCFBF1]', border: 'border-[#99F6E4]', text: 'text-[#0F766E]', Icon: CheckCircle },
    warning: { bg: 'bg-[#FED7AA]', border: 'border-[#FDBA74]', text: 'text-[#C2410C]', Icon: AlertTriangle },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', Icon: AlertCircle },
  }
  const { bg, border, text, Icon } = styles[variant]
  return (
    <div className={`${bg} border ${border} rounded-xl p-4 flex gap-3`}>
      <Icon size={16} className={`${text} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <div className={`font-semibold text-sm ${text} mb-0.5`}>{title}</div>}
        <div className={`text-sm ${text} opacity-90`}>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className={`${text} opacity-60 hover:opacity-100 ml-auto shrink-0`}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

// ── Empty State ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-border-light flex items-center justify-center mb-4 text-[#94A3B8]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-dark mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-sm leading-relaxed mb-6">{description}</p>
      {action}
    </div>
  )
}

// ── Page Header ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-navy md:text-[28px]">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </div>
  )
}
