import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { resetPassword } from '../lib/api'

const fieldClass = 'w-full rounded-lg border border-border bg-white py-3 pr-11 pl-10 text-sm text-dark outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-dark focus:ring-2 focus:ring-teal/15 disabled:bg-border-light'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const invalidToken = token.length < 40 || token.length > 256

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (invalidToken) {
      setError('Ce lien de réinitialisation est invalide ou incomplet.')
      return
    }
    if (password.length < 8 || password.length > 128) {
      setError('Le mot de passe doit contenir entre 8 et 128 caractères.')
      return
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setError('')
    setIsLoading(true)
    try {
      const response = await resetPassword({ token, password })
      setMessage(response.message)
      setPassword('')
      setConfirmation('')
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Le mot de passe n’a pas pu être modifié.')
    } finally {
      setIsLoading(false)
    }
  }

  return <AuthShell eyebrow="Accès sécurisé" title="Choisir un nouveau mot de passe" description="Votre nouveau mot de passe doit contenir au moins 8 caractères." footerLabel="Vous avez déjà terminé ?" footerLinkLabel="Se connecter" footerTo="/login">
    {(error || invalidToken) && !message && <div role="alert" className="mb-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Ce lien de réinitialisation est invalide ou incomplet.'}</div>}
    {message ? <div className="space-y-5"><div role="status" className="border-l-2 border-teal bg-teal/10 px-4 py-3 text-sm text-navy">{message}</div><Link to="/login" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-dark">Se connecter<ArrowRight size={16} /></Link></div> : !invalidToken && <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block"><span className="mb-2 block text-xs font-bold text-navy">Nouveau mot de passe</span><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="password" type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete="new-password" disabled={isLoading} value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-navy" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      <label className="block"><span className="mb-2 block text-xs font-bold text-navy">Confirmer le mot de passe</span><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input id="password-confirmation" type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete="new-password" disabled={isLoading} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={fieldClass} /></div></label>
      <button type="submit" disabled={isLoading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-55">{isLoading ? 'Modification en cours…' : 'Modifier mon mot de passe'}<ArrowRight size={16} /></button>
    </form>}
  </AuthShell>
}
