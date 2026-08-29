import { BarChart3, FileText, Globe, Search, Star, Zap } from "lucide-react";
import { motion } from "motion/react";

const features=[
  {icon:Globe,n:"01",title:"Présence unifiée",body:"Google, Facebook, Instagram et votre site restent cohérents depuis un seul espace de contrôle.",signal:"Informations synchronisées"},
  {icon:Search,n:"02",title:"SEO local continu",body:"ROBIA suit les signaux qui influencent votre visibilité et révèle les écarts qui comptent dans votre zone.",signal:"Opportunités détectées"},
  {icon:FileText,n:"03",title:"Contenu guidé",body:"Posts, descriptions et réponses sont préparés dans la voix de votre entreprise, prêts à être validés.",signal:"Action recommandée"},
  {icon:Star,n:"04",title:"Réputation suivie",body:"Chaque nouvel avis devient un signal de confiance à traiter rapidement, sans perdre votre ton humain.",signal:"Avis prioritaire"},
  {icon:BarChart3,n:"05",title:"Résultats lisibles",body:"Positions, visites, appels et progression sont réunis dans une lecture conçue pour décider.",signal:"Progression mesurée"},
];

export function Features(){return <section className="bg-[#E0DED6] px-5 py-24 text-[#15313D] sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-7xl">
  <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-24"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#087F75]">Le système ROBIA</p><h2 className="mt-6 font-[Roboto] text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-6xl">Pas plus d’outils.<br/>Une meilleure lecture.</h2></div><div className="flex items-end"><p className="max-w-xl text-base leading-7 text-[#61747A]">ROBIA réunit les signaux dispersés de votre présence locale et les transforme en une séquence de travail simple.</p></div></div>
  <div className="mt-20 border-t border-[#15313D]/25">{features.map(({icon:Icon,n,title,body,signal},i)=><motion.article initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.5}} transition={{delay:i*.05}} key={n} className="group grid gap-5 border-b border-[#15313D]/20 py-7 transition-colors hover:bg-[#F3F1EA]/60 sm:grid-cols-[50px_1fr_1.4fr_190px] sm:items-center sm:px-3"><span className="text-[10px] font-bold text-[#7B8B90]">{n}</span><h3 className="flex items-center gap-4 font-[Roboto] text-lg font-bold"><Icon size={19} className="text-[#087F75]"/>{title}</h3><p className="text-sm leading-6 text-[#61747A]">{body}</p><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#087F75]"><i className="h-2 w-2 rounded-full bg-[#14B8A6]"/>{signal}</span></motion.article>)}</div>
  <div className="mt-10 flex flex-col items-start justify-between gap-5 border-l-2 border-[#F97316] pl-5 sm:flex-row sm:items-center"><div><p className="flex items-center gap-2 font-[Roboto] text-lg font-bold"><Zap size={18} className="text-[#F97316]"/>ROBIA ne s’arrête pas au constat.</p><p className="mt-1 text-sm text-[#61747A]">Il transforme l’analyse en prochaine action.</p></div><a href="#solution" className="text-sm font-bold text-[#15313D] underline decoration-[#14B8A6] underline-offset-8">Voir le parcours produit →</a></div>
  </div></section>}
