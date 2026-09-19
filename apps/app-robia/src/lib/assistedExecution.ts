import { getApiErrorMessage, getStoredAccessToken } from './auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'https://robia-back.vercel.app'

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | string
export type ExecutionStatus = 'not_started' | 'ready' | 'succeeded' | 'failed' | string

export interface AssistedActionState {
  id: string
  approvalStatus?: ApprovalStatus
  approvalReason?: string | null
  executionStatus?: ExecutionStatus
  executionEvidence?: Record<string, unknown> | null
  verificationAuditId?: string | null
  attemptCount?: number
  status?: string
}

export interface ActionExecutionEvent {
  id: string
  actionItemId: string
  userId: string
  eventType: string
  idempotencyKey: string
  payload?: Record<string, unknown> | null
  createdAt: string
}

interface TransitionResponse {
  action: AssistedActionState
  event?: ActionExecutionEvent
  changed?: boolean
  idempotent?: boolean
}

interface ExecutionAttemptPayload {
  idempotencyKey: string
  outcome: 'succeeded' | 'failed'
  evidence: Record<string, unknown>
  note?: string
  verificationAuditId?: string
}

async function rc14Request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Votre session a expiré. Veuillez vous reconnecter.')

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Requested-With', 'XMLHttpRequest')
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(new URL(path, apiBaseUrl), { ...init, headers })
  } catch {
    throw new Error('Impossible de contacter le serveur ROBIA.')
  }

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, `Erreur RC14 (${response.status}).`))
  }

  return (await response.json()) as T
}

export function submitActionForApproval(actionId: string) {
  return rc14Request<TransitionResponse>(`/actions/${encodeURIComponent(actionId)}/submit`, { method: 'POST' })
}

export function approveAction(actionId: string) {
  return rc14Request<TransitionResponse>(`/actions/${encodeURIComponent(actionId)}/approve`, { method: 'POST' })
}

export function rejectAction(actionId: string, reason: string) {
  return rc14Request<TransitionResponse>(`/actions/${encodeURIComponent(actionId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function recordActionExecution(actionId: string, payload: ExecutionAttemptPayload) {
  return rc14Request<TransitionResponse>(`/actions/${encodeURIComponent(actionId)}/execution-attempts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getActionExecutionHistory(actionId: string) {
  return rc14Request<ActionExecutionEvent[]>(`/actions/${encodeURIComponent(actionId)}/history`)
}
