import { api } from "@/lib/api";
import {
  mapActionToTrackerTask,
  mapAudit,
  mapAuditHistoryItem,
  mapCategoryDetailFromAudit,
  mapDocument,
  mapOpportunity,
  mapOpportunityDetail,
  mapOrganizationToProfile,
  mapValidationHistory,
  profileToOrganizationPayload,
  uiDocumentTypeToBackend,
} from "@/lib/mappers";
import { sessionStore } from "@/lib/session";
import {
  BackendActionItem,
  BackendAudit,
  BackendAuthResponse,
  BackendDocument,
  BackendMe,
  BackendOpportunity,
  BackendOrganization,
  BackendValidation,
  BackendWebsite,
  CreateOrganizationPayload,
  CreateValidationPayload,
  UpdateActionStatusPayload,
  UpdateOrganizationPayload,
} from "@/types/backend";
import {
  ActionPlanWeek,
  ActionTrackerTask,
  AdminPme,
  Audit,
  AuditHistoryItem,
  AuthResponse,
  CategoryDetail,
  GeneratedDocument,
  Opportunity,
  OpportunityDetail,
  PmeProfile,
  ValidationAction,
  ValidationHistoryItem,
} from "@/types";

async function resolveWebsiteId(): Promise<string> {
  const cached = sessionStore.getWebsiteId();
  if (cached) return cached;

  const websites = await apiService.listWebsitesRaw();
  if (!websites.length) {
    throw new Error("Aucun site web enregistré. Connectez votre site d'abord.");
  }
  sessionStore.setWebsiteId(websites[0].id);
  return websites[0].id;
}

export const apiService = {
  // —— Auth ——
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<BackendAuthResponse>("/auth/login", {
      email,
      password,
    });
    sessionStore.setToken(data.accessToken);
    return { accessToken: data.accessToken, user: data.user };
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<BackendAuthResponse>("/auth/register", {
      email,
      password,
    });
    sessionStore.setToken(data.accessToken);
    return { accessToken: data.accessToken, user: data.user };
  },

  async getMe(): Promise<BackendMe> {
    const { data } = await api.get<BackendMe>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      sessionStore.clearSession();
    }
  },

  // —— Organizations ——
  async createOrganization(
    payload: CreateOrganizationPayload,
  ): Promise<BackendOrganization> {
    const { data } = await api.post<BackendOrganization>(
      "/organizations",
      payload,
    );
    return data;
  },

  async getCurrentOrganization(): Promise<BackendOrganization | null> {
    try {
      const { data } = await api.get<BackendOrganization>(
        "/organizations/current",
      );
      return data;
    } catch {
      return null;
    }
  },

  async updateCurrentOrganization(
    payload: UpdateOrganizationPayload,
  ): Promise<BackendOrganization> {
    const { data } = await api.patch<BackendOrganization>(
      "/organizations/current",
      payload,
    );
    return data;
  },

  // —— Websites ——
  async listWebsitesRaw(): Promise<BackendWebsite[]> {
    const { data } = await api.get<BackendWebsite[]>("/websites");
    return data;
  },

  async createWebsite(url: string): Promise<BackendWebsite> {
    const { data } = await api.post<BackendWebsite>("/websites", { url });
    sessionStore.setWebsiteId(data.id);
    return data;
  },

  async getWebsite(id: string): Promise<BackendWebsite> {
    const { data } = await api.get<BackendWebsite>(`/websites/${id}`);
    return data;
  },

  // —— Audits ——
  async runAudit(websiteId?: string): Promise<Audit> {
    const wid = websiteId ?? (await resolveWebsiteId());
    const { data } = await api.post<BackendAudit>("/audits/run", {
      websiteId: wid,
    });
    sessionStore.setAuditId(data.id);
    sessionStore.setWebsiteId(wid);

    try {
      await api.post<BackendOpportunity[]>("/opportunities/generate", {
        auditId: data.id,
      });
    } catch {
      // Les opportunités peuvent déjà exister pour cet audit
    }

    return mapAudit(data, wid);
  },

  async getLatestAuditRaw(websiteId?: string): Promise<BackendAudit> {
    const wid = websiteId ?? (await resolveWebsiteId());
    const { data } = await api.get<BackendAudit>("/audits/latest", {
      params: { website_id: wid },
    });
    sessionStore.setAuditId(data.id);
    return data;
  },

  async listAuditsRaw(websiteId?: string): Promise<BackendAudit[]> {
    const wid = websiteId ?? (await resolveWebsiteId());
    const { data } = await api.get<BackendAudit[]>("/audits", {
      params: { website_id: wid },
    });
    return data;
  },

  async getAuditById(id: string): Promise<BackendAudit> {
    const { data } = await api.get<BackendAudit>(`/audits/${id}`);
    return data;
  },

  // —— Opportunities ——
  async generateOpportunities(auditId: string): Promise<Opportunity[]> {
    const { data } = await api.post<BackendOpportunity[]>(
      "/opportunities/generate",
      { auditId },
    );
    return data.map(mapOpportunity);
  },

  async listOpportunitiesRaw(auditId?: string): Promise<BackendOpportunity[]> {
    const params = auditId ? { audit_id: auditId } : undefined;
    const { data } = await api.get<BackendOpportunity[]>("/opportunities", {
      params,
    });
    return data;
  },

  async getOpportunityRaw(id: string): Promise<BackendOpportunity> {
    const { data } = await api.get<BackendOpportunity>(
      `/opportunities/${id}`,
    );
    return data;
  },

  // —— Documents ——
  async generateDocumentRaw(
    payload: { opportunityId: string; type: string },
  ): Promise<BackendDocument> {
    const { data } = await api.post<BackendDocument>(
      "/documents/generate",
      payload,
    );
    return data;
  },

  async listDocumentsRaw(opportunityId: string): Promise<BackendDocument[]> {
    const { data } = await api.get<BackendDocument[]>("/documents", {
      params: { opportunity_id: opportunityId },
    });
    return data;
  },

  async getDocumentRaw(id: string): Promise<BackendDocument> {
    const { data } = await api.get<BackendDocument>(`/documents/${id}`);
    return data;
  },

  async updateDocumentRaw(
    id: string,
    payload: { content?: string; title?: string },
  ): Promise<BackendDocument> {
    const { data } = await api.patch<BackendDocument>(
      `/documents/${id}`,
      payload,
    );
    return data;
  },

  // —— Validations ——
  async createValidation(
    payload: CreateValidationPayload,
  ): Promise<BackendValidation> {
    const { data } = await api.post<BackendValidation>(
      "/validations",
      payload,
    );
    return data;
  },

  async listValidationsRaw(): Promise<BackendValidation[]> {
    const { data } = await api.get<BackendValidation[]>("/validations");
    return data;
  },

  // —— Action items ——
  async generateActions(opportunityId: string): Promise<BackendActionItem[]> {
    const { data } = await api.post<BackendActionItem[]>(
      "/actions/generate",
      {},
      { params: { opportunity_id: opportunityId } },
    );
    return data;
  },

  async listActionsRaw(): Promise<BackendActionItem[]> {
    const { data } = await api.get<BackendActionItem[]>("/actions");
    return data;
  },

  async updateActionStatus(
    id: string,
    payload: UpdateActionStatusPayload,
  ): Promise<BackendActionItem> {
    const { data } = await api.patch<BackendActionItem>(
      `/actions/${id}/status`,
      payload,
    );
    return data;
  },

  async generateActionPlanRaw(): Promise<unknown> {
    const { data } = await api.post("/actions/plan");
    return data;
  },

  async exportActionPlanPdf(): Promise<Blob> {
    const { data } = await api.get<Blob>("/actions/export", {
      responseType: "blob",
    });
    return data;
  },

  // —— Facade UI (hooks / pages existants) ——

  async getProfile(): Promise<PmeProfile> {
    const [me, org, websites] = await Promise.all([
      this.getMe(),
      this.getCurrentOrganization(),
      this.listWebsitesRaw(),
    ]);
    if (websites[0]?.id) {
      sessionStore.setWebsiteId(websites[0].id);
    }
    return mapOrganizationToProfile(
      me,
      org,
      websites,
      sessionStore.isGbpConnected(),
    );
  },

  async updateProfile(data: Partial<PmeProfile>): Promise<PmeProfile> {
    const orgPayload = profileToOrganizationPayload(data);
    let org = await this.getCurrentOrganization();

    if (!org) {
      org = await this.createOrganization({
        name: data.companyName ?? "Mon entreprise",
        sector: data.industry ?? "Autre",
        city: "Antananarivo",
        country: "Madagascar",
      });
    } else if (Object.values(orgPayload).some(Boolean)) {
      org = await this.updateCurrentOrganization(orgPayload);
    }

    if (data.website) {
      await this.createWebsite(data.website);
    }

    const me = await this.getMe();
    const websites = await this.listWebsitesRaw();
    return mapOrganizationToProfile(
      me,
      org,
      websites,
      sessionStore.isGbpConnected(),
    );
  },

  async connectGbp(): Promise<PmeProfile> {
    sessionStore.setGbpConnected(true);
    return this.getProfile();
  },

  async disconnectGbp(): Promise<PmeProfile> {
    sessionStore.setGbpConnected(false);
    return this.getProfile();
  },

  async connectSite(url: string): Promise<void> {
    await this.createWebsite(url);
  },

  async startAudit(): Promise<Audit> {
    return this.runAudit();
  },

  async getAudit(): Promise<Audit> {
    const raw = await this.getLatestAuditRaw();
    const websiteId = sessionStore.getWebsiteId() ?? undefined;
    return mapAudit(raw, websiteId);
  },

  async getAuditHistory(): Promise<AuditHistoryItem[]> {
    try {
      const items = await this.listAuditsRaw();
      return items.map(mapAuditHistoryItem);
    } catch {
      return [];
    }
  },

  async getCategoryDetail(categoryId: string): Promise<CategoryDetail> {
    const audit = await this.getAudit();
    return mapCategoryDetailFromAudit(audit, categoryId);
  },

  async getOpportunities(): Promise<Opportunity[]> {
    const auditId = sessionStore.getAuditId();
    const items = await this.listOpportunitiesRaw(auditId ?? undefined);
    return items.map(mapOpportunity);
  },

  async getOpportunityById(id: string): Promise<OpportunityDetail> {
    const raw = await this.getOpportunityRaw(id);
    return mapOpportunityDetail(raw);
  },

  async updateOpportunityStatus(
    id: string,
    status: "todo" | "in_progress" | "done",
  ): Promise<Opportunity> {
    const raw = await this.getOpportunityRaw(id);
    return mapOpportunity({ ...raw, status });
  },

  async generateDocument(
    opportunityId: string,
    type: "email" | "script" | "report",
  ): Promise<GeneratedDocument> {
    const raw = await this.generateDocumentRaw({
      opportunityId,
      type: uiDocumentTypeToBackend(type),
    });
    return mapDocument(raw);
  },

  async getDocument(id: string): Promise<GeneratedDocument> {
    return mapDocument(await this.getDocumentRaw(id));
  },

  async updateDocument(
    id: string,
    title: string,
    content: string,
  ): Promise<GeneratedDocument> {
    const raw = await this.updateDocumentRaw(id, { title, content });
    return mapDocument(raw);
  },

  async validateDocument(
    id: string,
    action: "approved" | "rejected" | "modified",
  ): Promise<ValidationAction> {
    const status =
      action === "approved"
        ? "approved"
        : action === "rejected"
          ? "rejected"
          : "pending";
    const raw = await this.createValidation({
      documentId: id,
      actionType: "publish",
      platform: "website",
      status,
    });
    return {
      id: raw.id,
      documentId: raw.documentId,
      validatorName: "Vous",
      action,
      timestamp: raw.createdAt ?? new Date().toISOString(),
    };
  },

  async getValidationHistory(): Promise<ValidationHistoryItem[]> {
    const items = await this.listValidationsRaw();
    return items.map(mapValidationHistory);
  },

  async getActionTrackerTasks(): Promise<ActionTrackerTask[]> {
    const items = await this.listActionsRaw();
    return items.map(mapActionToTrackerTask);
  },

  async toggleActionTrackerStatus(id: string): Promise<ActionTrackerTask[]> {
    const items = await this.listActionsRaw();
    const current = items.find((a) => a.id === id);
    if (!current) return items.map(mapActionToTrackerTask);

    const nextStatus: UpdateActionStatusPayload["status"] =
      current.status === "todo"
        ? "in_progress"
        : current.status === "in_progress"
          ? "done"
          : "todo";

    await this.updateActionStatus(id, { status: nextStatus });
    const updated = await this.listActionsRaw();
    return updated.map(mapActionToTrackerTask);
  },

  async getActionPlan(): Promise<ActionPlanWeek[]> {
    try {
      const raw = await this.generateActionPlanRaw();
      if (Array.isArray(raw)) {
        return raw as ActionPlanWeek[];
      }
    } catch {
      // fallback below
    }

    const actions = await this.listActionsRaw();
    return [
      {
        week: 1,
        title: "Plan d'actions ROBIA",
        tasks: actions.map((a) => ({
          name: a.title,
          completed: a.status === "done" || a.status === "completed",
        })),
      },
    ];
  },

  async toggleActionPlanTask(
    week: number,
    taskName: string,
  ): Promise<ActionPlanWeek[]> {
    const actions = await this.listActionsRaw();
    const match = actions.find((a) => a.title === taskName);
    if (match) {
      const nextStatus: UpdateActionStatusPayload["status"] =
        match.status === "done" || match.status === "completed"
          ? "todo"
          : "done";
      await this.updateActionStatus(match.id, { status: nextStatus });
    }
    return this.getActionPlan();
  },

  async getAdminPmes(): Promise<AdminPme[]> {
    return [];
  },
};
