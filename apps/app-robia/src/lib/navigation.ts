import {
  Building2,
  BarChart3,
  BellRing,
  FileText,
  LayoutDashboard,
  Layers,
  type LucideIcon,
  MessageSquare,
  Search,
  Share2,
  Target,
  Workflow,
  Zap,
  ClipboardList,
  GraduationCap,
} from "lucide-react";

// Single source of truth for the primary sidebar navigation, shared between
// Sidebar.tsx (rendering) and App.tsx's desktop breadcrumb (resolvePageTitle)
// so the two can never drift apart. Lives outside Sidebar.tsx because that
// file's default export is a component — co-locating non-component exports
// there breaks Fast Refresh (oxlint react(only-export-components)).

export interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  match?: "prefix" | "odc-appel" | "odc-formation";
}

export const NAV_VISIBILITE: NavItemConfig[] = [
  { to: "/command-center", label: "Command Center", icon: LayoutDashboard },
  { to: "/analyse", label: "Visibilité", icon: Search },
  { to: "/opportunites", label: "Opportunités", icon: Zap },
  { to: "/execution", label: "Actions", icon: Layers },
  { to: "/rapports", label: "Rapports", icon: FileText },
  { to: "/mots-cles", label: "Mots-clés", icon: Target },
  { to: "/ia", label: "Copilot", icon: MessageSquare, badge: "IA" },
  { to: "/business-profile", label: "Business Profile", icon: Building2 },
  { to: "/google-data", label: "Données Google", icon: BarChart3 },
  { to: "/meta-data", label: "Données Meta", icon: Share2 },
];

export const NAV_ODC: NavItemConfig[] = [
  { to: "/odc/programmes", label: "Candidatures ODC", icon: ClipboardList, match: "odc-appel" },
  {
    to: "/odc/programmes?vue=formation",
    label: "Formation",
    icon: GraduationCap,
    match: "odc-formation",
  },
];

export const NAV_OPS: NavItemConfig[] = [
  { to: "/ops/automations", label: "Automatisations", icon: Workflow },
  { to: "/ops/notifications", label: "Notifications", icon: BellRing },
];

// Titre de section affiché dans la barre supérieure desktop — dérivé des
// mêmes libellés que la sidebar pour ne jamais diverger. Complété par les
// entrées "Configuration" (rendues à part, hors des groupes ci-dessus) et
// par les routes de détail qui n'ont pas d'entrée de nav propre.
//
// /odc/programmes et /odc/programmes?vue=formation partagent le même
// pathname — les dériver par un simple `Object.fromEntries` sur `to.split("?")[0]`
// les fait entrer en collision (la seconde entrée écrase la première dans
// l'objet), et un lookup qui n'indexe que par pathname ne peut de toute façon
// jamais les redistinguer. Les entrées avec un `match` odc-* sont donc
// exclues de cette table générique et résolues explicitement plus bas, à
// partir du pathname ET de la query — la même paire de signaux que
// `navItemIsActive` (Sidebar.tsx) utilise déjà pour la mise en surbrillance.
const PAGE_TITLES: Record<string, string> = {
  ...Object.fromEntries(
    [...NAV_VISIBILITE, ...NAV_ODC, ...NAV_OPS]
      .filter((item) => item.match !== "odc-appel" && item.match !== "odc-formation")
      .map((item) => [item.to.split("?")[0], item.label]),
  ),
  "/billing": "Abonnement",
  "/profile": "Profil",
};

// Préfixes de routes de détail (ex. /ops/automations/:id) qui doivent
// hériter du titre de leur section parente plutôt que de rester sans titre.
// /odc/programmes et /odc/candidatures sont gérés à part (voir ci-dessous).
const PAGE_TITLE_PREFIXES: Array<[string, string]> = [
  ["/ops/automations", "Automatisations"],
  ["/ops/notifications", "Notifications"],
];

export function resolvePageTitle(pathname: string, search = ""): string | undefined {
  if (pathname.startsWith("/odc/programmes") || pathname.startsWith("/odc/candidatures")) {
    return new URLSearchParams(search).get("vue") === "formation" ? "Formation" : "Candidatures ODC";
  }

  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const prefixMatch = PAGE_TITLE_PREFIXES.find(([prefix]) => pathname.startsWith(prefix));
  return prefixMatch?.[1];
}
