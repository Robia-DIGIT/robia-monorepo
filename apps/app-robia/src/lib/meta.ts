import { getApiErrorMessage, getStoredAccessToken } from './auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'https://robia-back.vercel.app'

export interface MetaStatus {
  connected: boolean
  metaUserId: string | null
  metaUserName: string | null
  grantedScopes: string[]
  requiredScopes: string[]
  selectedPageId: string | null
  selectedPageName: string | null
  selectedInstagramAccountId: string | null
  selectedInstagramUsername: string | null
  connectedAt: string | null
  lastSyncedAt: string | null
  readOnly: true
  scoreInfluence: false
}

export interface MetaInstagramAsset {
  id: string
  username: string | null
}

export interface MetaAsset {
  pageId: string
  pageName: string
  tasks: string[]
  instagramAccount: MetaInstagramAsset | null
  selected: boolean
}

export interface MetaRecentMedia {
  id: string | null
  caption: string | null
  mediaType: string | null
  permalink: string | null
  timestamp: string | null
  likeCount: number | null
  commentsCount: number | null
}

export interface MetaPerformance {
  source: 'meta'
  readOnly: true
  scoreInfluence: false
  lastSyncedAt: string
  facebook: {
    pageId: string
    pageName: string | null
    fanCount: number | null
    followersCount: number | null
    talkingAboutCount: number | null
  }
  instagram: {
    accountId: string
    username: string | null
    followersCount: number | null
    followsCount: number | null
    mediaCount: number | null
    recentMedia: MetaRecentMedia[]
  } | null
}

async function metaRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new Error(await getApiErrorMessage(response, `Erreur Meta (${response.status}).`))
  }

  return (await response.json()) as T
}

export function getMetaStatus() {
  return metaRequest<MetaStatus>('/integrations/meta/status')
}

export function getMetaAuthorizationUrl() {
  return metaRequest<{ url: string }>('/integrations/meta/authorize', {
    credentials: 'include',
  })
}

export function listMetaAssets() {
  return metaRequest<MetaAsset[]>('/integrations/meta/assets')
}

export function selectMetaPage(pageId: string) {
  return metaRequest<{
    pageId: string
    pageName: string
    instagramAccount: MetaInstagramAsset | null
  }>('/integrations/meta/assets/select', {
    method: 'POST',
    body: JSON.stringify({ pageId }),
  })
}

export function getMetaPerformance() {
  return metaRequest<MetaPerformance>('/integrations/meta/performance')
}

export function disconnectMeta() {
  return metaRequest<{ disconnected: boolean }>('/integrations/meta', {
    method: 'DELETE',
  })
}
