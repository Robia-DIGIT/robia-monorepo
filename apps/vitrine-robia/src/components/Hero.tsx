import { ArrowRightIcon } from './icons'
import DashboardMockup from './DashboardMockup'

const STATS = [
  { n: '+340', label: 'PME actives' },
  { n: '4.9★', label: '128 avis'   },
  { n: '2 min', label: 'Onboarding' },
]

const AVATARS = [
  { letter: 'M', color: '#14b8a6' }, // Turquoise
  { letter: 'L', color: '#1d4ed8' }, // Bleu electrique
  { letter: 'S', color: '#f97316' }, // Orange vif
  { letter: 'P', color: '#14b8a6' }, // Turquoise
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 bg-gradient-to-br from-[#1e293b] via-[#1f3a5f] to-[#1e293b]">
      
      {/* Radial glows adaptés pour le mode sombre */}
      <div className="pointer-events-none absolute -top-44 -right-44 w-[560px] h-[560px] rounded-full mix-blend-screen"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)' }} />
      
      <div className="pointer-events-none absolute -bottom-20 -left-28 w-[480px] h-[480px] rounded-full mix-blend-screen"
        style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: copy ── */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#14b8a6]/[0.08] border border-[#14b8a6]/20 rounded-full px-3.5 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" style={{ boxShadow: '0 0 8px #14b8a6' }} />
              <span className="font-[Inter] text-xs text-[#14b8a6] font-semibold tracking-wide">Copilote IA · SEO Local</span>
            </div>

            {/* Headline */}
            <h1 className="font-[Roboto] font-black text-slate-100 leading-[1.08] tracking-tight mb-5"
              style={{ fontSize: 'clamp(34px, 4.5vw, 56px)' }}>
              De l'audit local aux{' '}
              <span className="bg-gradient-to-r from-[#14b8a6] to-[#1d4ed8] bg-clip-text text-transparent">
                actions prêtes
              </span>{' '}
              à appliquer.
            </h1>

            {/* Sub */}
            <p className="font-[Inter] text-lg text-[#64748b] leading-relaxed mb-9">
              Copilote IA de SEO local pour PME. Identifiez vos lacunes, priorisez vos actions et développez votre visibilité locale — sans expertise technique.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-11">
              <a href="#pricing"
                className="inline-flex items-center gap-2 font-[Roboto] font-bold lg:text-[15px] text-[13px] bg-orange text-white px-3 lg:px-7 py-3.5 rounded-xl transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
                style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.3)' }}>
                Démarrer gratuitement <ArrowRightIcon />
              </a>
              <a href="#solution"
                className="inline-block font-[Roboto] font-medium lg:text-[15px] text-[13px] text-slate-300 border border-[#1f3a5f] px-3 lg:px-7 py-3 rounded-xl transition-all duration-200 hover:border-[#1d4ed8] hover:text-slate-100 bg-[#1e293b]/50">
                Voir la démo
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex">
                {AVATARS.map((a, i) => (
                  <div key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#1e293b] flex items-center justify-center font-[Roboto] text-[11px] font-bold text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}80)`, marginLeft: i === 0 ? 0 : '-9px', zIndex: 4 - i }}>
                    {a.letter}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-[Inter] text-sm font-semibold text-slate-100">+340 PME nous font confiance</p>
                <p className="font-[Inter] text-xs text-[#64748b] mt-0.5">★★★★★ 4.9 / 5 — 128 avis</p>
              </div>
            </div>
          </div>

          {/* ── Right: dashboard ── */}
          <DashboardMockup />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 mt-18 rounded-xl overflow-hidden border border-[#1f3a5f]/50 backdrop-blur-sm"
          style={{ background: 'rgba(30, 41, 59, 0.4)', gap: '1px' }}>
          {STATS.map((s, i) => (
            <div key={i} className="bg-[#1f3a5f]/20 py-7 px-8 text-center transition-colors hover:bg-[#1f3a5f]/40">
              <p className="font-[Roboto] font-black text-[32px] text-slate-100 tracking-tight">{s.n}</p>
              <p className="font-[Inter] text-sm text-[#64748b] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}