"use client";

import { Bell, Search, Star, Menu } from "lucide-react";
import { useState } from "react";
import NpsModal from "@/components/nps/NpsModal";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import ChatbotIcon from "@/components/layout/ChatbotIcon";
import { useSidebar } from "@/components/ui/sidebar";
import Image from "next/image";

export default function Navbar() {
  const [showNps, setShowNps] = useState(false);
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          {/* Mobile Sidebar */}
          <button
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Rechercher..."
              className="
          h-11
          w-80
          rounded-full
          border
          border-slate-200
          bg-slate-50
          pl-11
          pr-12
          text-sm
          outline-none
          transition-all
          placeholder:text-slate-400
          focus:border-primary
          focus:bg-white
          focus:ring-4
          focus:ring-primary/10
        "
            />

            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border bg-white px-2 py-0.5 text-[10px] text-slate-400 lg:flex">
              ⌘ K
            </kbd>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNps(true)}
            className="
        hidden
        items-center
        gap-2
        rounded-full
        border
        border-amber-200
        bg-amber-50
        px-4
        py-2
        text-sm
        font-medium
        text-amber-700
        transition-all
        hover:border-amber-300
        hover:bg-amber-100
        lg:flex
      "
          >
            <Star className="h-4 w-4 fill-current" />
            Donner mon avis
          </button>

          {/* ChatBot */}
          <ChatbotIcon />

          {/* Notifications */}
          <button
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
      "
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
          </button>

          {/* Avatar Dropdown */}
          <ProfileDropdown />
        </div>
      </header>

      {/* NPS Modal */}
      <NpsModal isOpen={showNps} onClose={() => setShowNps(false)} />
    </>
  );
}
