export type WorkspaceRole = "owner" | "manager" | "member";

const ONBOARDING_KEY = "robia_workspace_onboarding";

export interface WorkspaceOnboarding {
  company: string;
  role: WorkspaceRole;
}

export function saveWorkspaceOnboarding(data: WorkspaceOnboarding) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
}

export function readWorkspaceOnboarding(): WorkspaceOnboarding | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(ONBOARDING_KEY) ?? "null") as Partial<WorkspaceOnboarding> | null;
    if (!value || typeof value.company !== "string") return null;
    if (value.role !== "owner" && value.role !== "manager" && value.role !== "member") return null;
    return { company: value.company, role: value.role };
  } catch {
    return null;
  }
}

export function clearWorkspaceOnboarding() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ONBOARDING_KEY);
}