import { useState } from "react";
import { Search } from "lucide-react";

// ── Sound-wave background ─────────────────────────────────────────────────────

// function SoundWaves() {
//   const lineCount = 60;
//   const lines = Array.from({ length: lineCount }, (_, i) => {
//     const x = (i / (lineCount - 1)) * 100;
//     const centerDist = Math.abs(x - 50) / 50;
//     const heightPct = Math.max(0.05, 1 - centerDist * centerDist * 1.4);
//     const h = 20 + heightPct * 110;
//     return { x, h };
//   });

//   return (
//     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[180px] flex items-end justify-center gap-0 pointer-events-none">
//       <svg
//         viewBox="0 0 1000 180"
//         preserveAspectRatio="xMidYMax meet"
//         className="w-full h-full"
//         fill="none"
//       >
//         <defs>
//           <linearGradient id="waves-fade" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.12" />
//             <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
//           </linearGradient>
//         </defs>
//         {lines.map(({ x, h }, i) => {
//           const cx = x * 10;
//           const barH = (h / 160) * 160;
//           const evenOdd = i % 2 === 0 ? 1 : 0.55;
//           const color = i % 3 === 0 ? "#14b8a6" : "#1d4ed8";
//           return (
//             <rect
//               key={i}
//               x={cx - 3}
//               y={180 - barH}
//               width="5"
//               height={barH}
//               rx="2.5"
//               fill={color}
//               opacity={0.08 * evenOdd}
//             />
//           );
//         })}
//         {/* Fade to white at bottom */}
//         <rect
//           x="0"
//           y="100"
//           width="1000"
//           height="80"
//           fill="url(#waves-fade)"
//           opacity="0.5"
//         />
//       </svg>
//     </div>
//   );
// }

// ── Mesh gradient blobs ───────────────────────────────────────────────────────

function MeshGradient() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* 1. Bleu foncé top-right (#1f3a5f) - Apporte de la profondeur */}
      <div className="absolute -top-30 -right-20 w-75 h-75 sm:w-105 sm:h-105 md:w-125 md:h-125 rounded-full blur-[32px] bg-[radial-gradient(circle,rgba(31,58,95,0.15)_0%,transparent_70%)]" />

      {/* 2. Turquoise center-left (#14b8a6) - Apporte la touche de dynamisme */}
      <div className="absolute top-20 -left-15 w-65 h-65 sm:w-85 sm:h-85 md:w-105 md:h-105 rounded-full blur-[28px] bg-[radial-gradient(circle,rgba(20,184,166,0.12)_0%,transparent_70%)]" />

      {/* 3. Bleu foncé bottom-right (#1f3a5f) - Rappel subtil pour équilibrer */}
      <div className="absolute bottom-15 right-[10%] w-50 h-50 sm:w-62 sm:h-62 md:w-75 md:h-75 rounded-full blur-xl bg-[radial-gradient(circle,rgba(31,58,95,0.12)_0%,transparent_70%)]" />
    </div>
  );
}
// ── Search bar ────────────────────────────────────────────────────────────────

//const LANGUAGES = ["Français 🇫🇷", "English 🇬🇧"];

function SearchBar() {
  const [query, setQuery] = useState("");
  // const [lang, setLang] = useState(0);
  const [focused, setFocused] = useState(false);
  // const [selectOpen, setSelectOpen] = useState(false);

  return (
    <div
      className={`relative flex items-center bg-white rounded-full border-[1.5px] transition-all duration-200 py-1.5 pl-4 sm:pl-6 pr-1.5 gap-0 w-full max-w-[620px] ${
        focused
          ? "border-blue-700 shadow-[0_0_0_4px_rgba(29,78,216,0.10),0_8px_32px_rgba(0,0,0,0.08)]"
          : "border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
      }`}
    >
      {/* Search icon */}
      <Search
        className="shrink-0 mr-2 sm:mr-2.5 text-slate-400"
        size={16}
        strokeWidth={2.5}
      />

      {/* Text input */}
      {/*
        text-[16px] en base : sous 16px, Safari iOS zoome automatiquement la
        page au focus d'un champ texte. On repasse à 15px seulement à partir
        de lg, où l'appareil n'est plus tactile/mobile.
      */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Recherchez un rapport, une transaction, un client..."
        className="flex-1 border-none outline-none text-[16px] items-center lg:text-[15px] font-sans text-slate-800 bg-transparent min-w-0 placeholder-slate-400 truncate"
      />

      {/* Divider 
      <div className="w-[1px] h-7 bg-slate-200 mx-2.5 shrink-0" />
      */}

      {/* Language selector 
      <div className="relative shrink-0">
        <button
          onClick={() => setSelectOpen(!selectOpen)}
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[13px] font-medium text-slate-500 font-sans py-1 px-2 rounded-md hover:bg-slate-50 transition-colors"
        >
          {LANGUAGES[lang]}
          <ChevronDown className="text-slate-400" size={14} strokeWidth={2.5} />
        </button>

        {selectOpen && (
          <div className="absolute bottom-[calc(100%+8px)] right-0 bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50 min-w-[160px]">
            {LANGUAGES.map((l, i) => (
              <button
                key={l}
                onClick={() => {
                  setLang(i);
                  setSelectOpen(false);
                }}
                className={`block w-full text-left py-2.5 px-4 border-none cursor-pointer text-[13px] font-sans transition-colors ${
                  i === lang
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "bg-white text-slate-600 font-normal hover:bg-slate-50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      */}

      {/* Divider 
      <div className="w-[1px] h-7 bg-slate-200 mx-2.5 shrink-0" />
      */}

      {/* CTA button */}
      <button className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white border-none rounded-full py-2.5 px-4 sm:py-3 sm:px-5 text-xs sm:text-sm font-bold font-sans cursor-pointer shadow-[0_4px_12px_rgba(249,115,22,0.4)] transition-all duration-150 hover:-translate-y-[1px] whitespace-nowrap">
        Rechercher
      </button>
    </div>
  );
}

// ── Badge chip (Conservé au cas où tu réactives les tags) ────────────────────

/* function Badge({
  children,
  color,
  bg,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold py-1 px-3 rounded-full"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}
  */

// ── Hero ──────────────────────────────────────────────────────────────────────

export default function Hero() {
  return (
    <section
      className="relative pt-24 sm:pt-10 pb-16 sm:pb-0 min-h-dvh w-full flex flex-col justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
      // ⬇️ Modifie l'URL ci-dessous avec le chemin vers ton image de fond ⬇️
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop')",
      }}
    >
      <div className="absolute inset-0 bg-deep-blue/65 backdrop-blur-[2px] z-0" />

      <MeshGradient />

      <div className="w-full max-w-285 mx-auto px-4 sm:px-6 relative z-10">
        {/* Headline */}
        <h1 className="text-[clamp(36px,7vw,82px)] font-black leading-[1.12] sm:leading-[1.06] font-[Poppins] font-sans tracking-[-1px] sm:tracking-[-2px] md:tracking-[-3px] text-center max-w-[900px] mx-auto mb-5 sm:mb-6 text-white">
          Pilotez votre business
          <br />
          <span className="relative inline-block">
            avec{" "}
            <span className="bg-turquoise bg-clip-text text-transparent">
              précision
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-[clamp(15px,2vw,20px)] text-slate-200 leading-relaxed text-center max-w-140 mx-auto mb-8 sm:mb-10 font-sans font-normal px-2 sm:px-0">
          Une plateforme tout-en-un pour analyser, automatiser et accélérer
          votre croissance. Données en temps réel, tableaux de bord
          intelligents.
        </p>

        {/* Search bar */}
        <div className="flex justify-center mb-0 lg:mb-8">
          <SearchBar />
        </div>

        {/* Dashboard mockup (Commenté)
        <div className="relative mt-8">
          <SoundWaves />
          <div className="relative z-10">
            <DashboardMockup />
          </div>
        </div>
        */}
      </div>
    </section>
  );
}