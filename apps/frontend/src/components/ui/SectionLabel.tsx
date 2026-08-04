import { Sparkles } from "lucide-react";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-teal-100 text-teal-700 border border-teal-200">
      <Sparkles size={11} />
      {children}
    </span>
  );
}
