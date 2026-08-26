import {
  BackendAudit,
  BackendAuditCategory,
  BackendDocument,
  BackendMe,
  BackendOpportunity,
  BackendOrganization,
  BackendValidation,
  BackendWebsite,
  BackendActionItem,
} from "@/types/backend";
import {
  ActionTrackerTask,
  Audit,
  AuditHistoryItem,
  AuditScoreCategory,
  CategoryDetail,
  GeneratedDocument,
  Opportunity,
  OpportunityDetail,
  PmeProfile,
  ValidationHistoryItem,
} from "@/types";

function scoreStatus(score: number): "good" | "warning" | "critical" {
  if (score >= 75) return "good";
  if (score >= 50) return "warning";
  return "critical";
}

function mapPriority(impactScore: number): Opportunity["priority"] {
  if (impactScore >= 8) return "high";
  if (impactScore >= 5) return "medium";
  return "low";
}

function mapOpportunityStatus(status: string): Opportunity["status"] {
  if (status === "done" || status === "completed") return "done";
  if (status === "in_progress") return "in_progress";
  return "todo";
}

function normalizeCategories(raw: BackendAudit): AuditScoreCategory[] {
  if (raw.categories?.length) {
    return raw.categories.map((cat, index) => {
      const score = cat.score ?? 0;
      return {
        id: cat.id ?? cat.key ?? `cat-${index}`,
        name: cat.name ?? cat.key ?? "Catégorie",
        score,
        weight: cat.weight ?? 25,
        description: cat.description ?? "",
        status: cat.status ?? scoreStatus(score),
      };
    });
  }

  const results = raw.results;
  if (results && typeof results === "object") {
    const scores = (results.scores ?? results.categories) as
      | Record<string, number>
      | undefined;
    if (scores && typeof scores === "object") {
      return Object.entries(scores).map(([key, score], index) => ({
        id: key,
        name: key.replace(/_/g, " "),
        score: typeof score === "number" ? score : 0,
        weight: 25,
        description: "",
        status: scoreStatus(typeof score === "number" ? score : 0),
      }));
    }
  }

  const global = raw.globalScore ?? raw.score ?? 0;
  return [
    {
      id: "overview",
      name: "Visibilité globale",
      score: global,
      weight: 100,
      description: "Synthèse de l'audit ROBIA",
      status: scoreStatus(global),
    },
  ];
}

export function mapAudit(raw: BackendAudit, websiteId?: string): Audit {
  const globalScore = raw.globalScore ?? raw.score ?? 0;
  const status =
    raw.status === "failed"
      ? "failed"
      : raw.status === "pending" || raw.status === "running"
        ? "loading"
        : "completed";

  return {
    id: raw.id,
    pmeId: raw.organizationId ?? websiteId ?? "",
    createdAt: raw.createdAt ?? new Date().toISOString(),
    globalScore,
    status,
    categories: normalizeCategories(raw),
    missingDataFields:
      raw.missingDataFields ??
      (Array.isArray(raw.results?.missingDataFields)
        ? (raw.results!.missingDataFields as string[])
        : []),
  };
}

export function mapAuditHistoryItem(raw: BackendAudit): AuditHistoryItem {
  const score = raw.globalScore ?? raw.score ?? 0;
  const state =
    raw.status === "failed"
      ? "failed"
      : raw.status === "pending" || raw.status === "running"
        ? "loading"
        : "completed";

  return {
    id: raw.id,
    date: raw.createdAt ?? "",
    score,
    state,
    pagesScanned: 0,
    issuesFound: raw.missingDataFields?.length ?? 0,
  };
}

export function mapOpportunity(raw: BackendOpportunity): Opportunity {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    priority: mapPriority(raw.impactScore),
    impactScore: raw.impactScore,
    category: raw.category,
    status: mapOpportunityStatus(raw.status),
    recommendedAction: raw.sourceData ?? raw.description,
  };
}

export function mapOpportunityDetail(raw: BackendOpportunity): OpportunityDetail {
  const effort = raw.effortScore ?? 3;
  return {
    ...mapOpportunity(raw),
    difficulty: effort <= 2 ? "Facile" : effort <= 5 ? "Modérée" : "Élevée",
    estimatedTime: effort <= 2 ? "1-2 h" : effort <= 5 ? "Half-day" : "1-2 jours",
    whyImportant: raw.description,
    currentValue: raw.sourceData ?? "—",
    recommendedValue: raw.title,
  };
}

export function mapDocument(raw: BackendDocument): GeneratedDocument {
  const rawType = raw.type ?? "local_page";
  const uiType: GeneratedDocument["type"] =
    rawType === "local_page"
      ? "report"
      : (rawType as GeneratedDocument["type"]);
  return {
    id: raw.id,
    title: raw.title ?? "Document généré",
    content: raw.content ?? "",
    type: uiType,
    opportunityId: raw.opportunityId ?? "",
    status: raw.status === "published" ? "published" : "draft",
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function mapValidationHistory(raw: BackendValidation): ValidationHistoryItem {
  return {
    id: raw.id,
    documentId: raw.documentId,
    validatorName: "Vous",
    action:
      raw.status === "approved"
        ? "approved"
        : raw.status === "rejected"
          ? "rejected"
          : "modified",
    timestamp: raw.createdAt ?? new Date().toISOString(),
  };
}

export function mapActionToTrackerTask(raw: BackendActionItem): ActionTrackerTask {
  const status =
    raw.status === "done" || raw.status === "completed"
      ? "done"
      : raw.status === "in_progress"
        ? "in_progress"
        : "todo";

  return {
    id: raw.id,
    title: raw.title,
    category: "Actions SEO",
    status,
    date: raw.dueDate ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function mapOrganizationToProfile(
  me: BackendMe,
  org: BackendOrganization | null,
  websites: BackendWebsite[],
  gbpConnected: boolean,
): PmeProfile {
  const primarySite = websites[0];
  return {
    id: org?.id ?? me.id,
    companyName: org?.name ?? "",
    website: primarySite?.url ?? "",
    industry: org?.sector ?? "",
    size: 5,
    description: org ? `${org.city}, ${org.country}` : undefined,
    googleBusinessProfileId: gbpConnected ? "connected" : undefined,
    isConnectedGbp: gbpConnected,
  };
}

export function profileToOrganizationPayload(
  data: Partial<PmeProfile> & { city?: string; country?: string },
): {
  name?: string;
  sector?: string;
  city?: string;
  country?: string;
} {
  return {
    name: data.companyName,
    sector: data.industry,
    city: data.city,
    country: data.country,
  };
}

export function mapCategoryDetailFromAudit(
  audit: Audit,
  categoryId: string,
): CategoryDetail {
  const cat =
    audit.categories.find((c) => c.id === categoryId) ?? audit.categories[0];
  if (!cat) {
    return {
      name: "Catégorie",
      score: 0,
      desc: "",
      criteria: [],
    };
  }

  return {
    name: cat.name,
    score: cat.score,
    desc: cat.description,
    criteria: [
      {
        name: cat.name,
        score: cat.score,
        status:
          cat.status === "critical"
            ? "error"
            : cat.status === "warning"
              ? "warning"
              : "good",
      },
    ],
  };
}

export function uiDocumentTypeToBackend(
  type: "email" | "script" | "report",
): string {
  const map: Record<string, string> = {
    email: "local_page",
    script: "local_page",
    report: "local_page",
  };
  return map[type] ?? "local_page";
}
