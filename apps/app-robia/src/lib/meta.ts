import { request } from "./api";

export interface MetaStatus {
  connected: boolean;
  metaUserId: string | null;
  metaUserName: string | null;
  grantedScopes: string[];
  requiredScopes: string[];
  selectedPageId: string | null;
  selectedPageName: string | null;
  selectedInstagramAccountId: string | null;
  selectedInstagramUsername: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  readOnly: true;
  scoreInfluence: false;
}

export interface MetaInstagramAsset {
  id: string;
  username: string | null;
}

export interface MetaAsset {
  pageId: string;
  pageName: string;
  tasks: string[];
  instagramAccount: MetaInstagramAsset | null;
  selected: boolean;
}

export interface MetaRecentMedia {
  id: string | null;
  caption: string | null;
  mediaType: string | null;
  permalink: string | null;
  timestamp: string | null;
  likeCount: number | null;
  commentsCount: number | null;
}

export interface MetaPerformance {
  source: "meta";
  readOnly: true;
  scoreInfluence: false;
  lastSyncedAt: string;
  facebook: {
    pageId: string | null;
    pageName: string | null;
    fanCount: number | null;
    followersCount: number | null;
    talkingAboutCount: number | null;
  };
  instagram: {
    accountId: string | null;
    username: string | null;
    followersCount: number | null;
    followsCount: number | null;
    mediaCount: number | null;
    recentMedia: MetaRecentMedia[];
  } | null;
}

export function getMetaAuthorizationUrl() {
  return request<{ url: string }>("/integrations/meta/authorize", {
    credentials: "include",
  });
}

export function getMetaStatus() {
  return request<MetaStatus>("/integrations/meta/status");
}

export function listMetaAssets() {
  return request<MetaAsset[]>("/integrations/meta/assets");
}

export function selectMetaAsset(pageId: string) {
  return request<{
    pageId: string;
    pageName: string;
    instagramAccount: MetaInstagramAsset | null;
  }>("/integrations/meta/assets/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageId }),
  });
}

export function getMetaPerformance() {
  return request<MetaPerformance>("/integrations/meta/performance");
}

export function disconnectMeta() {
  return request<{ disconnected: boolean }>("/integrations/meta", {
    method: "DELETE",
  });
}
