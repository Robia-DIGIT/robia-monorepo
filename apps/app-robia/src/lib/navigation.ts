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
const PAGE_TITLES: Record<string, string> = {
  ...Object.fromEntries(
    [...NAV_VISIBILITE, ...NAV_ODC, ...NAV_OPS].map((item) => [item.to.split("?")[0], item.label]),
  ),
  "/billing": "Abonnement",
  "/profile": "Profil",
};

// Préfixes de routes de détail (ex. /ops/automations/:id) qui doivent
// hériter du titre de leur section parente plutôt que de rester sans titre.
const PAGE_TITLE_PREFIXES: Array<[string, string]> = [
  ["/ops/automations", "Automatisations"],
  ["/ops/notifications", "Notifications"],
  ["/odc/programmes", "Candidatures ODC"],
  ["/odc/candidatures", "Candidatures ODC"],
];

export function resolvePageTitle(pathname: string): string | undefined {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const prefixMatch = PAGE_TITLE_PREFIXES.find(([prefix]) => pathname.startsWith(prefix));
  return prefixMatch?.[1];
}
