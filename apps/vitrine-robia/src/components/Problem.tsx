import { useState } from 'react'
import { MapPinIcon, ClockIcon, PuzzleIcon, ListIcon } from './icons'

interface ProblemItem {
  icon: React.ReactNode
  title: string
  desc: string
  hoverBorder: string
  iconBg: string
  iconText: string
}

const PROBLEMS: ProblemItem[] = [
  {
    icon: <MapPinIcon />, title: 'Présence fragmentée',
    desc: "Vos informations diffèrent selon les annuaires. Google, Pages Jaunes, Yelp — chacun raconte une histoire différente, pénalisant votre référencement.",
    hoverBorder: 'hover:border-[#f97316]/40', iconBg: 'bg-[#f97316]/10 border-[#f97316]/20', iconText: 'text-[#f97316]',
  },
  {
    icon: <ClockIcon />, title: 'Manque de temps',
    desc: "Gérer sa présence locale est chronophage. Entre les fiches, les avis, et les mises à jour, il ne reste plus de temps pour faire tourner le commerce.",
    hoverBorder: 'hover:border-[#14b8a6]/40', iconBg: 'bg-[#14b8a6]/10 border-[#14b8a6]/20', iconText: 'text-[#14b8a6]',
  },
  {
    icon: <PuzzleIcon />, title: 'Outils trop techniques',
    desc: "SEMrush, Moz, Ahrefs… conçus pour des agences, pas pour des commerçants. La courbe d'apprentissage est rédhibitoire pour une PME.",
    hoverBorder: 'hover:border-[#1d4ed8]/40', iconBg: 'bg-[#1d4ed8]/10 border-[#1d4ed8]/20', iconText: 'text-[#1d4ed8]',
  },
  {
    icon: <ListIcon />, title: "Pas de plan d'action",
    desc: "Les audits identifient des problèmes mais ne disent pas quoi faire en premier, ni comment le faire concrètement et efficacement.",
    hoverBorder: 'hover:border-[#f97316]/40', iconBg: 'bg-[#f97316]/10 border-[#f97316]/20', iconText: 'text-[#f97316]',
  },
]

function ProblemCard({ item }: { item: ProblemItem }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white border border-[#64748b]/15 ${item.hoverBorder} rounded-2xl p-7 cursor-default transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50/50`}
      style={{ boxShadow: hovered ? '0 12px 40px rgba(30,41,59,0.08)' : '0 4px 20px rgba(30,41,59,0.03)' }}
    >
      <div className={`w-11 h-11 rounded-xl ${item.iconBg} border flex items-center justify-center ${item.iconText} mb-5`}>
        {item.icon}
      </div>
      <h3 className="font-[Roboto] text-base font-bold text-[#1e293b] mb-2.5">{item.title}</h3>
      <p className="font-[Inter] text-sm text-[#64748b] leading-relaxed">{item.desc}</p>
    </div>
  )
}

export default function ProblemSection() {
  return (
    <section className="py-22 bg-gradient-to-br from-white via-[#14b8a6]/[0.03] to-[#64748b]/10">
      <div className="max-w-6xl mx-auto px-6">

        {/* Section header */}
        <div className="text-center mb-13">
          <p className="inline-block font-[Inter] text-[11px] font-semibold text-[#f97316] tracking-[0.12em] uppercase mb-3.5">
            Le problème
          </p>
          <h2 className="font-[Roboto] font-black text-[#1e293b] tracking-tight mb-3.5"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
            Pourquoi le SEO local reste un défi pour les PME
          </h2>
          <p className="font-[Inter] text-base text-[#64748b] max-w-lg mx-auto leading-relaxed">
            Quatre obstacles récurrents freinent la croissance locale de la plupart des petites entreprises.
          </p>
        </div>

        {/* 4-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEMS.map((item, i) => <ProblemCard key={i} item={item} />)}
        </div>
        
      </div>
    </section>
  )
}