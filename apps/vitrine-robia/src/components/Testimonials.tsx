import { motion } from "motion/react";
import { Quote } from "lucide-react";

const testimonials=[
  {name:"Marie Dupont",role:"Restaurant La Bonne Table",quote:"ROBIA nous a donné une lecture claire de ce qui empêchait notre établissement d’être trouvé localement."},
  {name:"Pierre Martin",role:"Cabinet Martin",quote:"Les avis et les informations locales ne sont plus une liste de tâches dispersées. Nous savons quoi traiter en premier."},
  {name:"Sophie Bernard",role:"Hôtel Beau Rivage",quote:"Le Copilot rend les recommandations compréhensibles, même quand on n’est pas spécialiste du référencement."},
];

export function Testimonials(){return <section className="bg-white px-5 py-24 text-[#15313D] sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-7xl">
  <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#087F75]">Paroles du terrain</p><h2 className="mt-6 font-[Roboto] text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-6xl">Pensé pour les entreprises, pas pour les experts.</h2></div><div className="flex items-end"><p className="max-w-xl text-base leading-7 text-[#61747A]">La valeur de ROBIA tient dans sa capacité à rendre une situation complexe immédiatement compréhensible.</p></div></div>
  <div className="mt-20 grid border-y border-[#15313D]/20 lg:grid-cols-3">{testimonials.map((item,i)=><motion.figure initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.5}} transition={{delay:i*.08}} key={item.name} className="group border-b border-[#15313D]/20 p-7 last:border-b-0 lg:min-h-80 lg:border-b-0 lg:border-r lg:last:border-r-0"><Quote size={23} className="text-[#14B8A6]"/><blockquote className="mt-10 font-[Roboto] text-xl font-medium leading-8 tracking-[-.02em]">« {item.quote} »</blockquote><figcaption className="mt-10 border-t border-[#15313D]/15 pt-5"><strong className="block text-sm">{item.name}</strong><span className="mt-1 block text-xs text-[#738489]">{item.role}</span></figcaption></motion.figure>)}</div>
  </div></section>}
