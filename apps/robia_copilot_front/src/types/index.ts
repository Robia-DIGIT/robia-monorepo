export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

export interface PmeProfile {
  id: string;
  companyName: string;
  website: string;
  siret?: string;
  industry: string;
  size: number;
  description?: string;
  googleBusinessProfileId?: string;
  isConnectedGbp: boolean;
}

export interface AuditScoreCategory {
  id: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  status: "good" | "warning" | "critical";
}

export interface Audit {
  id: string;
  pmeId: string;
  createdAt: string;
  globalScore: number;
  status: "loading" | "completed" | "failed";
  categories: AuditScoreCategory[];
  missingDataFields: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impactScore: number;
  category: string;
  status: "todo" | "in_progress" | "done";
  recommendedAction: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  type: "email" | "report" | "script" | "social_post" | "reply";
  opportunityId: string;
  status: "draft" | "published";
  updatedAt: string;
}

export interface ValidationAction {
  id: string;
  documentId: string;
  validatorName: string;
  action: "approved" | "rejected" | "modified";
  timestamp: string;
  comment?: string;
}

export interface ActionPlanItem {
  id: string;
  title: string;
  dueDate: string;
  assignedTo?: string;
  status: "pending" | "completed";
  dayIndex: number; // Day 1 to 30
  category: string;
}

export interface AuditHistoryItem {
  id: string;
  date: string;
  score: number;
  state: "completed" | "failed" | "loading";
  pagesScanned: number;
  issuesFound: number;
}

export interface CategoryDetail {
  name: string;
  score: number;
  desc: string;
  criteria: {
    name: string;
    score: number;
    status: "good" | "warning" | "error";
  }[];
}

export interface OpportunityDetail extends Opportunity {
  difficulty: string;
  estimatedTime: string;
  whyImportant: string;
  currentValue: string;
  recommendedValue: string;
}

export interface ActionTrackerTask {
  id: string;
  title: string;
  category: string;
  status: "todo" | "in_progress" | "done";
  date: string;
}

export interface ActionPlanWeek {
  week: number;
  title: string;
  tasks: { name: string; completed: boolean }[];
}

export interface AdminPme {
  id: string;
  name: string;
  website: string;
  score: number;
  status: "active" | "pending";
  lastAudit: string;
}

export interface ValidationHistoryItem extends ValidationAction {
  title?: string;
  date?: string;
  details?: string;
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  user?: { id: string; email: string };
}
