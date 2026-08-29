import { Check, Clock, MapPin, Shield, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

const outcomes=[
  {icon:MapPin,title:"Être trouvé au bon endroit",body:"Comprenez précisément les zones où votre entreprise apparaît — et celles où elle disparaît."},
  {icon:Clock,title:"Savoir quoi faire maintenant",body:"Les opportunités sont classées par impact et traduites en tâches claires, sans jargon technique."},
  {icon:Shield,title:"Construire une présence fiable",body:"Informations, avis et contenus restent cohérents sur les points de contact qui inspirent confiance."},
  {icon:TrendingUp,title:"Voir le progrès réel",body:"Suivez les mouvements de classement et les actions réalisées au lieu de vous fier à une impression."},
];

export function Benefits(){return <section className="bg-[#F3F1EA] px-5 py-24 text-[#15313D] sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
  <div className="lg:sticky lg:top-28 lg:self-start"><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#F97316]">L’impact métier</p><h2 className="mt-6 font-[Roboto] text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-6xl">La visibilité devient une discipline quotidienne.</h2><p className="mt-6 max-w-lg text-base leading-7 text-[#61747A]">ROBIA ne promet pas des chiffres abstraits. Il donne à chaque entreprise locale une méthode pour observer, décider et progresser.</p></div>
  <div className="border-t border-[#15313D]/25">{outcomes.map(({icon:Icon,title,body},i)=><motion.article initial={{opacity:0,x:18}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.5}} transition={{delay:i*.06}} key={title} className="grid grid-cols-[45px_1fr_24px] gap-4 border-b border-[#15313D]/20 py-8 sm:grid-cols-[55px_200px_1fr_24px] sm:items-center"><span className="grid h-10 w-10 place-items-center border border-[#15313D]/20 text-[#087F75]"><Icon size={18}/></span><h3 className="font-[Roboto] text-lg font-bold">{title}</h3><p className="col-start-2 text-sm leading-6 text-[#61747A] sm:col-start-auto">{body}</p><Check size={18} className="text-[#14B8A6]"/></motion.article>)}</div>
  </div></section>}
