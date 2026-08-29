import { motion } from "motion/react";

const stages = [
  ["01","Votre entreprise existe","Votre fiche, vos horaires et votre réputation sont déjà en ligne."],
  ["02","Vos clients cherchent","Ils expriment une intention précise, à quelques rues de vous."],
  ["03","La visibilité se fragmente","Une information manquante ou un concurrent mieux placé suffit à vous masquer."],
  ["04","ROBIA détecte l’écart","Chaque signal devient une opportunité lisible et priorisée."],
];

export default function Problem(){return <section className="bg-[#F3F1EA] px-5 py-24 text-[#15313D] sm:px-8 lg:px-12 lg:py-32">
  <div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr] lg:gap-24"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#F97316]">Le problème de visibilité</p><h2 className="mt-6 font-[Roboto] text-4xl font-black leading-[1.05] tracking-[-.045em] sm:text-5xl">Être présent ne veut pas dire être trouvé.</h2></div><p className="max-w-lg self-end text-base leading-7 text-[#64767C]">Entre l’existence numérique d’une entreprise et la décision d’un client, il y a un territoire invisible. ROBIA le rend mesurable.</p></div>
  <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4">{stages.map(([n,title,copy],i)=><motion.article initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.4}} transition={{delay:i*.08}} key={n} className="relative border-l border-[#AEB8B8] px-6 pb-10 pt-2 lg:min-h-64 lg:border-l-0 lg:border-t lg:px-0 lg:pb-0 lg:pr-8 lg:pt-7"><span className={`absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border-2 border-[#F3F1EA] lg:-top-[5px] lg:left-0 ${i===3?'bg-[#14B8A6] ring-8 ring-[#14B8A6]/10':'bg-[#74868B]'}`}/><small className="text-[10px] font-bold text-[#859398]">{n}</small><h3 className="mt-7 font-[Roboto] text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#66777D]">{copy}</p></motion.article>)}</div>
  </div></section>}
