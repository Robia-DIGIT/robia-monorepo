import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { forgotPassword } from '../lib/api'

const fieldClass = 'w-full rounded-lg border border-border bg-white py-3 pr-3 pl-10 text-sm text-dark outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-dark focus:ring-2 focus:ring-teal/15 disabled:bg-border-light'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || normalizedEmail.length > 254) {
      setError('Veuillez renseigner une adresse e-mail valide.')
      return
    }

    setError('')
    setMessage('')
    setIsLoading(true)
    try {
      const response = await forgotPassword({ email: normalizedEmail })
      setMessage(response.message)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'La demande n’a pas pu être envoyée.')
    } finally {
      setIsLoading(false)
    }
  }

  return <AuthShell eyebrow="Accès sécurisé" title="Réinitialiser votre mot de passe" description="Indiquez l’adresse e-mail de votre compte ROBIA. Si elle correspond à un compte, vous recevrez un lien valable 15 minutes." footerLabel="Vous connaissez votre mot de passe ?" footerLinkLabel="Revenir à la connexion" footerTo="/login">
    {error && <div role="alert" className="mb-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {message && <div role="status" className="mb-5 border-l-2 border-teal bg-teal/10 px-4 py-3 text-sm text-navy">{message}</div>}
    {!message && <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block"><span className="mb-2 block text-xs font-bold text-navy">Adresse e-mail</span><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="email" type="email" required autoComplete="email" disabled={isLoading} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@entreprise.fr" className={fieldClass} /></div></label>
      <button type="submit" disabled={isLoading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-55">{isLoading ? 'Envoi en cours…' : 'Recevoir le lien'}<ArrowRight size={16} /></button>
    </form>}
    <Link to="/login" className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-teal-dark hover:underline"><ArrowLeft size={15} />Revenir à la connexion</Link>
  </AuthShell>
}
