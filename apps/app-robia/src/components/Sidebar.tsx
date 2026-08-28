import type { ReactNode } from "react";
import {
  Building2,
  FileText,
  HelpCircle,
  Layers,
  type LucideIcon,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Search,
  Settings,
  Zap,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import logoSnom from "../assets/logo_snom.png";
import type { Organization, UserSummary } from "../lib/api";
import type { ConnectionStatus } from "../App";

// ---------------------------------------------------------------------------
// En mode réduit, on vise le "rail d'icônes" façon Claude.ai : pas de
// bordures entre les sections, pas de fond derrière l'icône active, pas de
// carte autour du sélecteur d'org — juste des icônes centrées, espacées
// généreusement, avec la couleur d'accent qui fait tout le travail.
// En mode étendu, on garde le style carte/bordures existant.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: "/analyse", label: "Analyse", icon: Search },
  { to: "/opportunites", label: "Opportunités", icon: Zap },
  { to: "/execution", label: "Exécution", icon: Layers },
  { to: "/rapports", label: "Rapports", icon: FileText },
  { to: "/ia", label: "IA Conversationnelle", icon: MessageSquare, badge: "AI" },
  { to: "/business-profile", label: "Business Profile", icon: Building2 },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-navy";

// ---------------------------------------------------------------------------
// Small utils
// ---------------------------------------------------------------------------

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function getConnectionMeta(
  status: ConnectionStatus,
  org: Organization | null,
): { dot: string; label: string; textClass: string } {
  const locationLine = [org?.city, org?.country].filter(Boolean).join(", ");
  if (locationLine) {
    return { dot: "bg-teal", label: locationLine, textClass: "text-teal" };
  }
  switch (status) {
    case "connected":
      return { dot: "bg-teal", label: "Connectée au backend", textClass: "text-teal" };
    case "partial":
      return { dot: "bg-[#F97316]", label: "Synchronisation partielle", textClass: "text-[#FDBA74]" };
    case "error":
      return { dot: "bg-red-500", label: "Serveur indisponible", textClass: "text-red-300" };
    case "loading":
    default:
      return { dot: "bg-white/30 animate-pulse", label: "Connexion en cours…", textClass: "text-white/50" };
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SidebarProps {
  activePath: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate: () => void;
  isOpen: boolean;
  organization: Organization | null;
  currentUser: UserSummary | null;
  onLogout: () => Promise<void>;
  connectionStatus: ConnectionStatus;
  orgInitial: string;
  userInitial: string;
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function Pill({ children, tone = "orange" }: { children: ReactNode; tone?: "orange" | "muted" }) {
  return (
    <span
      className={cx(
        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone === "orange" ? "bg-orange/15 text-orange" : "bg-white/8 text-white/45",
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function ComingSoonRow({
  icon: Icon,
  label,
  collapsed,
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label={collapsed ? `${label} (bientôt disponible)` : undefined}
      title="Bientôt disponible"
      className={cx(
        "flex w-full cursor-not-allowed items-center text-sm font-medium text-white/40 opacity-70",
        collapsed ? "justify-center py-3" : "gap-3 rounded-lg px-3 py-2.5",
      )}
    >
      <Icon size={17} className="shrink-0" aria-hidden="true" />
      {!collapsed && label}
    </button>
  );
}

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavItemConfig;
  isActive: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cx(
        "relative flex items-center text-sm font-medium transition-colors duration-150",
        FOCUS_RING,
        collapsed
          // Rail d'icônes : pas de radius/fond de bouton, juste l'icône centrée.
          ? "justify-center py-3"
          : "gap-3 rounded-lg px-3 py-2.5",
        isActive
          ? collapsed
            ? "text-teal"
            : "bg-teal/15 text-white"
          : cx("text-white/55 hover:text-white", !collapsed && "hover:bg-white/6"),
      )}
    >
      <Icon size={18} aria-hidden="true" className={isActive ? "text-teal" : undefined} />
      {!collapsed && item.label}
      {item.badge &&
        (collapsed ? (
          // En rail réduit : un simple point de notification, pas un badge texte.
          <span
            className="absolute right-2.5 top-1 h-1.5 w-1.5 rounded-full bg-orange"
            aria-hidden="true"
          />
        ) : (
          <span className="ml-auto">
            <Pill>{item.badge}</Pill>
          </span>
        ))}
    </NavLink>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar({
  activePath,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  isOpen,
  organization,
  currentUser,
  connectionStatus,
  orgInitial,
  userInitial,
}: SidebarProps) {
  const navigate = useNavigate();
  const organizationLabel = organization?.name ?? "Organisation active";
  const meta = getConnectionMeta(connectionStatus, organization);
  const userName = currentUser?.name ?? currentUser?.email ?? "Compte connecté";
  const userEmail = currentUser?.email ?? "support@robia.dev";

  return (
    <aside
      className={cx(
        "fixed left-0 top-0 z-30 flex h-full w-72 shrink-0 flex-col bg-navy text-white transition-all duration-300 ease-in-out lg:relative lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-14" : "lg:w-72",
      )}
    >
      {/* Brand + toggle */}
      <div
        className={cx(
          !collapsed && "border-b border-white/8",
          collapsed ? "px-0 py-5" : "px-5 py-6",
        )}
      >
        <div className={cx("flex items-center", collapsed ? "flex-col gap-4" : "gap-3")}>
          {!collapsed && (
            <img
              src={logoSnom}
              alt="Logo SNOM"
              className="h-9 w-9 rounded-xl bg-white object-contain p-1"
            />
          )}

          {!collapsed && (
            <div>
              <div className="text-[15px] font-semibold leading-none text-white">
                Rob<span className="text-teal">IA</span>
              </div>
              <div className="mt-0.5 text-[13px] font-medium tracking-wide text-white/50">Copilot</div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cx(
              "hidden items-center justify-center text-white/60 transition-colors hover:text-white lg:flex",
              collapsed ? "mx-auto h-9 w-9" : "ml-auto h-8 w-8 rounded-lg hover:bg-white/8",
              FOCUS_RING,
            )}
            aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
            title={collapsed ? "Développer le menu" : "Réduire le menu"}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      {/* Org switcher */}
      <div className={cx(!collapsed && "border-b border-white/8", collapsed ? "px-0 py-3" : "px-3 py-4")}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label={collapsed ? `${organizationLabel} — bientôt disponible` : undefined}
          title="Changement d'organisation bientôt disponible"
          className={cx(
            "group flex cursor-not-allowed items-center text-left opacity-70",
            collapsed ? "mx-auto justify-center" : "w-full gap-3 rounded-lg bg-white/5 px-3 py-2.5",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-electric to-navy-light text-sm font-bold text-white">
            {orgInitial}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{organizationLabel}</div>
                <div className={cx("flex items-center gap-1.5 truncate text-[11px]", meta.textClass)}>
                  <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                  <span className="truncate">{meta.label}</span>
                </div>
              </div>
              <Pill tone="muted">Bientôt</Pill>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Navigation principale"
        className={cx(
          "flex-1 overflow-y-auto scrollbar-hide",
          collapsed ? "space-y-1 px-0 py-4" : "space-y-0.5 px-3 py-4",
        )}
      >
        {!collapsed && (
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Navigation
          </div>
        )}

        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.to}
            item={item}
            isActive={activePath === item.to}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        <div className={collapsed ? "mt-2" : "mt-4 border-t border-white/8 pt-4"}>
          {!collapsed && (
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Configuration
            </div>
          )}
          <ComingSoonRow icon={Settings} label="Paramètres" collapsed={collapsed} />
          <ComingSoonRow icon={HelpCircle} label="Aide & Support" collapsed={collapsed} />
        </div>
      </nav>

      {/* Account */}
      <div className={cx(!collapsed && "border-t border-white/8", collapsed ? "px-0 py-4" : "px-3 py-4")}>
        <div className={cx("flex items-center", collapsed ? "flex-col justify-center gap-3" : "gap-1 rounded-lg")}>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            title="Voir le profil"
            className={cx(
              "group flex min-w-0 items-center transition-colors",
              FOCUS_RING,
              collapsed ? "justify-center" : "flex-1 gap-3 rounded-lg px-3 py-2.5 hover:bg-white/6",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal to-electric text-sm font-semibold text-white">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium text-white">{userName}</div>
                <div className="truncate text-[11px] text-white/35">{userEmail}</div>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}