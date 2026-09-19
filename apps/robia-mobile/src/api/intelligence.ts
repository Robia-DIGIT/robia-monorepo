export type IntelligenceSignal = {
  provider: string;
  status: 'ok' | 'partial' | 'unavailable' | 'not_connected' | 'not_configured';
  observedAt: string | null;
  readOnly: boolean;
  scoreInfluence: boolean;
  data: unknown;
  unavailableReason: string | null;
};
export type IntelligenceFinding = {
  provider: string; ruleCode: string; title: string; description: string;
  category: string; evidence: unknown[]; recommendation: string | string[];
  impactScore: number; effortScore: number; confidenceScore: number;
  confidence?: 'observed' | 'heuristic'; scoreInfluence: boolean;
};
