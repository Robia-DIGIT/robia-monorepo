export const queryKeys = {
  profile: ["profile"] as const,
  audit: ["audit"] as const,
  auditHistory: ["audit", "history"] as const,
  categoryDetail: (id: string) => ["audit", "category", id] as const,
  opportunities: ["opportunities"] as const,
  opportunity: (id: string) => ["opportunities", id] as const,
  document: (id: string) => ["documents", id] as const,
  validationHistory: ["validations", "history"] as const,
  actionTracker: ["action-tracker"] as const,
  actionPlan: ["action-plan"] as const,
  adminPmes: ["admin", "pmes"] as const,
};
