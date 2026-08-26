"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function ChatbotIcon() {
  return (
    <Link
      href="/chatbot"
      className="
        relative
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        text-slate-500
        transition-all
        hover:bg-slate-100
        hover:text-slate-900
        focus:ring-2
        focus:ring-primary/50
      "
      title="Ouvrir le ChatBot"
    >
      <MessageCircle className="h-5 w-5" />
    </Link>
  );
}
