"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  Globe,
  FileSearch,
  Clock,
  CheckSquare,
  CalendarDays,
  Settings,
  ShieldAlert,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Onboarding PME",
    href: "/onboarding",
    icon: UserCheck,
  },
  // {
  //   name: "Profil",
  //   href: "/profile",
  //   icon: User,
  // },
  {
    name: "Connexion Site",
    href: "/connect-site",
    icon: Globe,
  },
  {
    name: "Lancement Audit",
    href: "/audit/loading",
    icon: FileSearch,
  },
  {
    name: "Historique Audits",
    href: "/audit/history",
    icon: Clock,
  },
  {
    name: "Tracker Actions",
    href: "/action-tracker",
    icon: CheckSquare,
  },
  {
    name: "Plan 30 Jours",
    href: "/action-plan",
    icon: CalendarDays,
  },
  {
    name: "Générer Doc",
    href: "/documents/generate",
    icon: FileText,
  },
  {
    name: "Validation",
    href: "/validation",
    icon: ShieldAlert,
  },
  {
    name: "Connexion GBP",
    href: "/connect-gbp",
    icon: Settings,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    // collapsible="icon" active le pattern officiel Shadcn: la sidebar se
    // réduit à une colonne d'icônes au lieu de disparaître complètement.
    <Sidebar
      collapsible="icon"
      className="border-r border-navy/20"
      style={
        {
          "--sidebar-background": "var(--color-navy)",
        } as React.CSSProperties
      }
    >
      {/* Header */}

      <SidebarHeader className="bg-dark-slate border-b h-16 justify-center items-center border-white/10">
        <div className="flex items-center justify-center ">
          <Link
            href="/onboarding"
            className="flex items-center gap-3 font-bold text-white overflow-hidden group-data-[collapsible=icon]:hidden"
          >
            {/* <Image
              src="/logo_robia_copilot.svg"
              alt="Logo"
              width={35}
              height={35}
              className="shrink-0 group-data-[collapsible=icon]:hidden"
            /> */}
            <Image
              src="/logo_snom.png"
              width={20}
              height={20}
              className=" w-auto  brightness-0 invert group-data-[collapsible=icon]:hidden"
              alt="Logo Robia"
            />
          </Link>

          <SidebarHeaderTrigger />
        </div>
      </SidebarHeader>

      {/* Menu */}

      <SidebarContent className="bg-dark-slate ">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.name}
                      className={cn(
                        "group/item relative h-12 rounded-full px-3",
                        "transition-all duration-200 ease-out",
                        "group-data-[collapsible=icon]:justify-center",
                        "group-data-[collapsible=icon]:px-0",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",

                        active
                          ? "bg-primary text-navy shadow-lg  space-y-2 shadow-primary/20 font-medium"
                          : "text-white/70 hover:text-white  space-y-2 hover:bg-white/5",
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-navy/40 group-data-[collapsible=icon]:hidden" />
                        )}

                        <item.icon
                          className={cn(
                            "h-9 w-9 shrink-0 transition-colors",
                            active
                              ? "text-navy"
                              : "text-primary/70 group-hover/item:text-primary",
                          )}
                        />

                        <span
                          className={cn(
                            "truncate text-sm leading-none group-data-[collapsible=icon]:hidden",
                            active
                              ? "font-medium text-navy "
                              : "font-normal text-white/70 group-hover/item:text-white",
                          )}
                        >
                          {item.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer

      <SidebarFooter className="bg-dark-slate border-t border-white/10">
        <SidebarFooterContent />
      </SidebarFooter> */}

      {/* Poignée fine sur le bord de la sidebar pour la replier/déplier
          au clic-glisser, en plus du bouton explicite du header */}
      <SidebarRail />
    </Sidebar>
  );
}

function SidebarHeaderTrigger() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarTrigger
      onClick={toggleSidebar}
      className="text-white/60 absolute left-2 top-5 hover:text-white hover:bg-white/5 shrink-0"
    >
      {isCollapsed ? (
        <PanelLeftOpen className="h-18 w-18" />
      ) : (
        <PanelLeftClose className="h-18 w-18" />
      )}
    </SidebarTrigger>
  );
}

// Le footer s'adapte à l'état replié: on masque le nom/l'email et on
// centre l'avatar + le bouton de déconnexion pour rester lisible en
// colonne d'icônes.
// function SidebarFooterContent() {
//   const { state } = useSidebar();
//   const isCollapsed = state === "collapsed";

//   return (
//     <>
//       <div
//         className={cn(
//           "flex items-center gap-3 p-4",
//           isCollapsed && "justify-center p-2",
//         )}
//       >
//         <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">
//           JD
//         </div>

//         {!isCollapsed && (
//           <div className="flex-1 overflow-hidden">
//             <p className="truncate text-sm font-semibold text-white">
//               John Doe
//             </p>

//             <p className="truncate text-xs text-white/50">john.doe@pme.com</p>
//           </div>
//         )}
//       </div>

//       <button
//         onClick={() => {
//           localStorage.removeItem("token");
//           window.location.href = "https://robiacopilot.vercel.app/";
//         }}
//         className={cn(
//           "mx-2 mb-3 flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-accent",
//           isCollapsed ? "w-9 mx-auto" : "w-[calc(100%-16px)]",
//         )}
//         title="Déconnexion"
//       >
//         <LogOut className="h-4 w-4 shrink-0" />
//         {!isCollapsed && "Déconnexion"}
//       </button>
//     </>
//   );
// }
