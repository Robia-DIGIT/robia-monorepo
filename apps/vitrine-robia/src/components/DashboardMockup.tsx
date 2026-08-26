const SCORE = 74
const CIRCUMFERENCE = 2 * Math.PI * 42

const BARS = [
  { label: 'Google Business', val: 82, color: '#14b8a6', tw: 'bg-turquoise' },
  { label: 'Citations NAP', val: 61, color: '#f97316', tw: 'bg-orange' },
  { label: 'Avis & Réponses', val: 79, color: '#1d4ed8', tw: 'bg-electric' },
  { label: 'SEO on-page', val: 55, color: '#f97316', tw: 'bg-orange' },
]

const ACTIONS = [
  { text: 'Compléter vos horaires GBP', priority: 'Haute', color: '#f97316' },
  { text: 'Répondre à 4 avis négatifs', priority: 'Haute', color: '#f97316' },
  { text: 'Ajouter 8 photos récentes', priority: 'Moyenne', color: '#14b8a6' },
]

export default function DashboardMockup() {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-electric/25 p-6 bg-linear-to-br from-surface-2 to-surface-3"
      style={{ boxShadow: '0 0 60px rgba(20,184,166,0.08), 0 0 120px rgba(29,78,216,0.06)' }}>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-turquoise to-electric" />

      {/* Window chrome */}
      <div className="flex gap-1.5 mb-5 pt-1">
        {['bg-red-400', 'bg-amber-400', 'bg-green-400'].map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full ${c} opacity-50`} />
        ))}
        <div className="flex-1 bg-white/5 rounded h-2.5 ml-2" />
      </div>

      {/* Header row */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="font-[Inter] text-[10px] text-light-gray tracking-widest uppercase mb-1">
            Audit Local — Boulangerie Martin
          </p>
          <p className="font-[Roboto] text-[13px] font-medium text-slate-200">
            Paris 11e · Mis à jour il y a 2h
          </p>
        </div>
        <span className="bg-turquoise/10 border border-turquoise/30 rounded-md px-2.5 py-0.5 font-[Inter] text-[11px] text-turquoise font-semibold">
          ● LIVE
        </span>
      </div>

      {/* Score ring + bars */}
      <div className="flex gap-5 items-center mb-5">
        <div className="shrink-0">
          <svg width="96" height="96" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(29,78,216,0.15)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="#14b8a6" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - SCORE / 100)}
              transform="rotate(-90 50 50)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(20,184,166,0.5))' }}
            />
            <text x="50" y="46" textAnchor="middle" fill="#f1f5f9" fontSize="22" fontWeight="700" fontFamily="Roboto, sans-serif">{SCORE}</text>
            <text x="50" y="61" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Inter, sans-serif">/100</text>
          </svg>
        </div>

        <div className="flex-1 space-y-2">
          {BARS.map(item => (
            <div key={item.label}>
              <div className="flex justify-between mb-1">
                <span className="font-[Inter] text-[11px] text-slate-400">{item.label}</span>
                <span className="font-[Inter] text-[11px] font-semibold" style={{ color: item.color }}>{item.val}</span>
              </div>
              <div className="h-1 rounded-full bg-white/6">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.val}%`, background: item.color, boxShadow: `0 0 6px ${item.color}50` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <p className="font-[Inter] text-[10px] text-slate-600 tracking-widest uppercase mb-2.5">
          Actions prioritaires
        </p>
        <div className="space-y-1.5">
          {ACTIONS.map(action => (
            <div key={action.text}
              className="flex items-center justify-between px-2.5 py-2 bg-white/3 border border-white/6 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: action.color, boxShadow: `0 0 6px ${action.color}` }} />
                <span className="font-[Inter] text-[11px] text-slate-300">{action.text}</span>
              </div>
              <span className="font-[Inter] text-[10px] font-semibold" style={{ color: action.color }}>{action.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
