"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Settings, LogOut, Bell, Lock, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { apiService } from "@/lib/apiService";
import { sessionStore } from "@/lib/session";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    setIsOpen(false);

    try {
      await apiService.logout();
    } finally {
      sessionStore.clearSession();
      router.replace("/login");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          ml-2
          flex
          items-center
          gap-2
          rounded-full
          p-1
          transition-all
          hover:bg-slate-100
          focus:ring-2
          focus:ring-primary/50
        "
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          JD
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
          absolute
          right-0
          top-full
          mt-2
          w-64
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-lg
          z-50
        "
        >
          {/* User Info */}
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                JD
              </div>
              <div>
                <p className="font-semibold text-slate-900">Jean Dupont</p>
                <p className="text-sm text-slate-600">
                  jean.dupont@example.com
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="
                flex
                items-center
                gap-3
                px-4
                py-3
                text-slate-700
                transition-all
                hover:bg-slate-50
                hover:text-primary
              "
            >
              <User className="h-4 w-4" />
              Mon Profil
            </Link>

            <button
              onClick={() => {
                void handleLogout();
              }}
              className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-slate-700
              transition-all
              hover:bg-slate-50
              hover:text-primary
            "
            >
              <Bell className="h-4 w-4" />
              Notifications
            </button>

            <button
              className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-slate-700
              transition-all
              hover:bg-slate-50
              hover:text-primary
            "
            >
              <Lock className="h-4 w-4" />
              Sécurité
            </button>

            <button
              className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-slate-700
              transition-all
              hover:bg-slate-50
              hover:text-primary
            "
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </button>
          </nav>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Logout */}
          <button
            onClick={() => {
              void handleLogout();
            }}
            className="
            w-full
            flex
            items-center
            gap-3
            px-4
            py-3
            text-left
            font-medium
            text-red-600
            transition-all
            hover:bg-red-50
          "
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
