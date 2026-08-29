import { motion } from "motion/react";
import { ArrowRight, MapPin, MoveUpRight, Radar } from "lucide-react";

const points = [
  { x: "15%", y: "24%", rank: 3 }, { x: "49%", y: "17%", rank: 1 },
  { x: "79%", y: "28%", rank: 4 }, { x: "26%", y: "57%", rank: 2 },
  { x: "65%", y: "53%", rank: 6 }, { x: "83%", y: "74%", rank: 8 },
  { x: "42%", y: "82%", rank: 5 },
];

export default function Hero() {
  return <section id="produit" className="relative overflow-hidden bg-[#F3F1EA] px-5 pb-20 pt-28 text-[#15313D] sm:px-8 lg:px-12 lg:pb-28 lg:pt-32">
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between border-t border-[#15313D]/60 pt-3 text-[10px] font-semibold uppercase tracking-[.18em] text-[#52686F]">
        <span>Intelligence de visibilité locale</span><span className="hidden sm:block">Diagnostic en temps réel · 01</span>
      </div>
      <div className="grid items-center gap-14 pt-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:pt-20">
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.65,ease:[.22,1,.36,1]}}>
          <p className="mb-7 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#087F75]"><span className="h-2 w-2 rounded-full bg-[#14B8A6] motion-safe:animate-pulse"/>ROBIA COPILOT</p>
          <h1 className="max-w-3xl font-[Roboto] text-[clamp(3rem,5.5vw,5rem)] font-black leading-[.98] tracking-[-.055em]">Votre entreprise existe.<br/><span className="text-[#087F75]">Faites-la trouver.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#566A71] sm:text-lg">À Antananarivo et partout à Madagascar, ROBIA révèle où votre présence locale disparaît, explique pourquoi et transforme chaque signal en action concrète.</p>
          <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8"><a href="#tarifs" className="group inline-flex items-center gap-3 rounded-sm bg-[#F97316] px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#E5650C] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#14B8A6]/40">Analyser ma visibilité <ArrowRight size={17} className="transition group-hover:translate-x-1"/></a><a href="#solution" className="border-b border-[#15313D]/40 pb-1 text-sm font-semibold">Voir comment ROBIA agit ↘</a></div>
          <p className="mt-14 text-[10px] uppercase tracking-[.14em] text-[#7A898D]">Google Business Profile · Classements locaux · Réputation</p>
        </motion.div>

        <motion.div initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{duration:.75,delay:.12,ease:[.22,1,.36,1]}} className="bg-[#102B38] p-4 text-white shadow-[16px_18px_0_#D9DED7] sm:p-6">
          <div className="flex items-start justify-between border-b border-white/15 pb-5"><div><span className="text-[9px] uppercase tracking-[.18em] text-[#8BA2AA]">Aperçu produit · Visibilité locale</span><strong className="mt-2 block text-base">Quartier Analakely</strong></div><div className="font-[Roboto] text-4xl font-black">74<span className="text-xs text-[#8BA2AA]">/100</span></div></div>
          <div className="relative h-[360px] overflow-hidden bg-[#173B48] sm:h-[430px]">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:40px_40px]"/>
            <div className="absolute left-[-20%] top-[45%] h-7 w-[140%] -rotate-[24deg] border-y border-white/10 bg-[#274854]"/><div className="absolute left-[-20%] top-[55%] h-7 w-[140%] rotate-[42deg] border-y border-white/10 bg-[#274854]"/>
            {[210,340].map((size,i)=><motion.div key={size} className="absolute left-1/2 top-1/2 rounded-full border border-[#14B8A6]/35" style={{width:size,height:size,x:'-50%',y:'-50%'}} animate={{opacity:[.3,.8,.3],scale:[.96,1.02,.96]}} transition={{duration:4+i,repeat:Infinity,ease:'easeInOut'}}/>)}
            {points.map((p,i)=><motion.span key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:.4+i*.06,type:'spring'}} className={`absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#173B48] text-[11px] font-bold ${p.rank<=3?'bg-[#14B8A6]':p.rank<=6?'bg-[#E4AC42]':'bg-[#DB7252]'}`} style={{left:p.x,top:p.y}}>{p.rank}</motion.span>)}
            <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 bg-white px-3 py-2 text-[11px] font-bold text-[#15313D]"><MapPin size={16} fill="#F97316" className="text-[#F97316]"/>Votre établissement</div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-[#B4C6CB]"><Radar size={15}/>Zone analysée · 5 km</div>
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-5 text-[10px] text-[#B5C5CA]"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#14B8A6]"/>Positions fortes</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#F97316]"/>Opportunités</span><span className="ml-auto flex items-center gap-1 text-[#82D8CC]"><MoveUpRight size={14}/>Progression suivie</span></div>
        </motion.div>
      </div>
    </div>
  </section>;
}
