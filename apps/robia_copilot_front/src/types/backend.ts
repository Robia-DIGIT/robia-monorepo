/** DTOs alignés sur Robia Backend API (Postman) */

export interface BackendAuthUser {
  id: string;
  email: string;
}

export interface BackendAuthResponse {
  accessToken: string;
  user: BackendAuthUser;
}

export interface BackendMe {
  id: string;
  email: string;
  provider?: string;
  createdAt?: string;
}

export interface BackendOrganization {
  id: string;
  name: string;
  sector: string;
  city: string;
  country: string;
  ownerId?: string;
  createdAt?: string;
}

export interface CreateOrganizationPayload {
  name: string;
  sector: string;
  city: string;
  country: string;
}

export type UpdateOrganizationPayload = Partial<CreateOrganizationPayload>;

export interface BackendWebsite {
  id: string;
  organizationId: string;
  url: string;
  domain: string;
  status: string;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface BackendAuditCategory {
  id?: string;
  name?: string;
  key?: string;
  score?: number;
  weight?: number;
  description?: string;
  status?: "good" | "warning" | "critical";
}

export interface BackendAudit {
  id: string;
  websiteId?: string;
  organizationId?: string;
  status?: string;
  globalScore?: number;
  score?: number;
  createdAt?: string;
  categories?: BackendAuditCategory[];
  missingDataFields?: string[];
  results?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BackendOpportunity {
  id: string;
  organizationId: string;
  auditId: string;
  title: string;
  description: string;
  category: string;
  impactScore: number;
  effortScore?: number;
  confidenceScore?: number;
  sourceData?: string;
  status: string;
  createdAt?: string;
}

export interface BackendDocument {
  id: string;
  opportunityId?: string;
  type?: string;
  title?: string;
  content?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface GenerateDocumentPayload {
  opportunityId: string;
  type: string;
}

export interface CreateValidationPayload {
  documentId: string;
  actionType: string;
  platform: string;
  status: "approved" | "rejected" | "pending";
}

export interface BackendValidation {
  id: string;
  documentId: string;
  actionType?: string;
  platform?: string;
  status: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface BackendActionItem {
  id: string;
  organizationId: string;
  opportunityId: string;
  documentId: string | null;
  title: string;
  status: string;
  dueDate?: string;
  createdAt?: string;
}

export interface UpdateActionStatusPayload {
  status: "todo" | "in_progress" | "done";
}
