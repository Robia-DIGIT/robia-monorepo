import { useState } from 'react'
import { LayoutGrid, PieChart, CreditCard, FileText, Settings, Calendar, TrendingUp, TrendingDown } from 'lucide-react'

// ── Tiny chart helpers ────────────────────────────────────────────────────────

function AreaChart({ color, fill }: { color: string; fill: string }) {
  const pts = [18, 32, 22, 48, 36, 62, 54, 78, 66, 88, 74, 96]
  const w = 200
  const h = 56
  const max = Math.max(...pts)
  const coords = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w
    const y = h - (p / max) * h
    return [x, y] as [number, number]
  })
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="w-full">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={linePath} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.slice(-1).map(([x, y]) => (
        <circle key="dot" cx={x} cy={y} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  )
}

function BarChart() {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
  const vals = [42, 68, 53, 85, 71, 94]
  const prev = [30, 52, 44, 70, 60, 78]
  return (
    <div>
      <div className="flex items-end gap-1.5 h-[72px] mb-2">
        {vals.map((v, i) => (
          <div key={i} className="flex-1 flex gap-0.5 items-end">
            <div
              className="flex-1 rounded-t bg-blue-700/20"
              style={{ height: `${(prev[i] / 100) * 72}px` }}
            />
            <div
              className={`flex-1 rounded-t ${i === 5 ? 'bg-orange-500' : 'bg-blue-700'}`}
              style={{ height: `${(v / 100) * 72}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {months.map((m) => (
          <div key={m} className="flex-1 text-center text-[9px] text-slate-400 font-medium">
            {m}
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart() {
  const segments = [
    { value: 45, color: '#1d4ed8' },
    { value: 30, color: '#14b8a6' },
    { value: 15, color: '#f97316' },
    { value: 10, color: '#e2e8f0' },
  ]
  const total = segments.reduce((a, b) => a + b.value, 0)
  let offset = 0
  const r = 28
  const circ = 2 * Math.PI * r
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * circ
    const gap = circ - dash
    const arc = { dash, gap, offset, color: seg.color }
    offset += dash
    return arc
  })
  return (
    <div className="relative w-[72px] h-[72px] shrink-0">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="9"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-sm font-extrabold font-sans text-slate-800 leading-none">94%</span>
        <span className="text-[7px] text-slate-400 font-medium">Score</span>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  sub,
}: {
  label: string
  value: string
  delta: string
  color: string
  sub?: string
}) {
  const isPos = delta.startsWith('+')
  return (
    <div className="bg-white rounded-xl py-3.5 px-4 border border-slate-100 flex-1 min-w-[100px]">
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.06em] mb-2">
        {label}
      </p>
      <p className="text-xl font-extrabold text-slate-800 font-[Poppins] font-sanstracking-tight mb-1">
        {value}
      </p>
      {sub && <p className="text-[10px] text-slate-400 mb-1">{sub}</p>}
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-2 rounded-full ${
          isPos ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
        }`}
      >
        {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {delta}
      </span>
    </div>
  )
}

// ── Activity row ──────────────────────────────────────────────────────────────

function Activity({
  name,
  type,
  amount,
  time,
  color,
}: {
  name: string
  type: string
  amount: string
  time: string
  color: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-800">{name}</p>
          <p className="text-[10px] text-slate-400">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-bold text-slate-800">{amount}</p>
        <p className="text-[9px] text-slate-400">{time}</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardMockup() {
  const [activeTab, setActiveTab] = useState('Aperçu')
  const tabs = ['Aperçu', 'Analytiques', 'Rapports']

  const menuItems = [
    { icon: LayoutGrid, label: 'Tableau de bord', active: true },
    { icon: PieChart, label: 'Analytiques', active: false },
    { icon: CreditCard, label: 'Transactions', active: false },
    { icon: FileText, label: 'Rapports', active: false },
    { icon: Settings, label: 'Paramètres', active: false },
  ]

  return (
    <div className="w-full max-w-[1000px] mx-auto bg-slate-50 border border-slate-200 rounded-[20px] overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.03),0_20px_60px_rgba(0,0,0,0.08),0_40px_100px_rgba(29,78,216,0.06)]">
      {/* Window chrome */}
      <div className="bg-white border-b border-slate-200 py-3 px-5 flex items-center gap-2.5">
        <div className="flex gap-1.5">
          {['bg-orange-500', 'bg-amber-400', 'bg-green-500'].map((colorClass, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${colorClass} opacity-80`} />
          ))}
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-slate-100 rounded-md py-1 px-3.5 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] text-slate-500 font-sans">app.robia.digital/dashboard</span>
          </div>
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-[460px]">
        {/* Sidebar */}
        <div className="w-[180px] bg-white border-r border-slate-100 py-4 px-3 flex flex-col gap-0.5 shrink-0">
          <div className="py-2 px-3 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-700 to-teal-500 flex items-center justify-center">
                <span className="text-[11px] font-extrabold text-white">r</span>
              </div>
              <span className="text-[13px] font-bold text-slate-800 font-[Poppins]">robia</span>
            </div>
          </div>

          {menuItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer ${
                item.active ? 'bg-blue-700/10' : 'bg-transparent hover:bg-slate-50'
              }`}
            >
              <item.icon
                size={14}
                className={item.active ? 'text-blue-700' : 'text-slate-400'}
                strokeWidth={item.active ? 2.5 : 2}
              />
              <span
                className={`text-xs ${
                  item.active ? 'font-semibold text-blue-700' : 'font-normal text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}

          <div className="mt-auto py-2 px-2.5 rounded-lg bg-teal-500/5 border border-teal-500/15">
            <p className="text-[9px] text-teal-500 font-semibold mb-0.5">Plan Pro</p>
            <div className="bg-slate-200 rounded h-1 overflow-hidden">
              <div className="w-[72%] h-full bg-gradient-to-r from-blue-700 to-teal-500 rounded" />
            </div>
            <p className="text-[9px] text-slate-500 mt-1">72% utilisé</p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
          {/* Top bar */}
          <div className="flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-[Poppins] mb-0.5">
                Tableau de bord
              </h2>
              <p className="text-[11px] text-slate-400">Lundi 28 juillet 2025, 10:42</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="bg-slate-100 rounded-lg py-1.5 px-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" /> Juillet 2025
              </div>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-teal-500 flex items-center justify-center shadow-sm">
                <span className="text-[11px] font-bold text-white">SL</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-[3px] shrink-0 w-fit">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`py-1 px-3.5 rounded-md border-none text-[11px] font-semibold font-sans cursor-pointer transition-all ${
                  activeTab === t
                    ? 'bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                    : 'bg-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Stat row */}
          <div className="flex gap-3 shrink-0 flex-wrap">
            <StatCard label="Revenus" value="€84,320" delta="+18.4%" color="#1d4ed8" sub="Ce mois" />
            <StatCard label="Clients" value="12,847" delta="+7.2%" color="#14b8a6" sub="Actifs" />
            <StatCard label="Transactions" value="3,421" delta="-2.1%" color="#f97316" sub="7 derniers jours" />
          </div>

          {/* Charts row */}
          <div className="flex gap-3 flex-1 min-h-0">
            {/* Area chart card */}
            <div className="flex-[2] bg-white rounded-2xl p-4 border border-slate-100 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Croissance mensuelle</p>
                  <p className="text-xl font-extrabold text-slate-800 font-[Poppins] tracking-tight">
                    +32.4%
                  </p>
                </div>
                <span className="bg-green-100 text-green-600 text-[10px] font-bold py-1 px-2.5 rounded-full">
                  En hausse
                </span>
              </div>
              <div className="flex-1">
                <AreaChart color="#14b8a6" fill="#14b8a6" />
              </div>
            </div>

            {/* Right column */}
            <div className="flex-[1.2] flex flex-col gap-3">
              {/* Bar chart */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 flex-1">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-semibold text-slate-400">Volume</p>
                  <div className="flex gap-1.5 items-center">
                    <span className="flex items-center gap-1 text-[9px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-sm bg-blue-700/20 block" /> N-1
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-sm bg-blue-700 block" /> 2025
                    </span>
                  </div>
                </div>
                <BarChart />
              </div>

              {/* Donut */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 mb-2.5">Répartition</p>
                <div className="flex items-center gap-3.5">
                  <DonutChart />
                  <div className="flex flex-col gap-1.5 flex-1">
                    {[
                      { label: 'SaaS', color: '#1d4ed8', pct: '45%' },
                      { label: 'Services', color: '#14b8a6', pct: '30%' },
                      { label: 'Licences', color: '#f97316', pct: '15%' },
                      { label: 'Autres', color: '#e2e8f0', pct: '10%' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-sm shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-[9px] text-slate-500">{s.label}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-800">{s.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-2xl py-3.5 px-4 border border-slate-100 shrink-0 mt-auto">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[0.06em]">
              Activité récente
            </p>
            <Activity name="Stripe Inc." type="Paiement reçu" amount="+€ 3,200" time="Il y a 3 min" color="#14b8a6" />
            <Activity name="Adobe Systems" type="Abonnement" amount="-€ 54" time="Il y a 28 min" color="#f97316" />
            <Activity name="Vercel Pro" type="Infrastructure" amount="-€ 20" time="Il y a 1h" color="#1d4ed8" />
          </div>
        </div>
      </div>
    </div>
  )
}