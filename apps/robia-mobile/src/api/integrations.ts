export type Connection = {
  connected: boolean; selectedSiteUrl?: string | null; selectedPageId?: string | null;
  selectedPageName?: string | null; selectedAnalyticsPropertyId?: string | null;
  selectedAnalyticsPropertyName?: string | null; analyticsAuthorized?: boolean;
  googleAccountEmail?: string | null; metaUserName?: string | null;
};
export type Asset = {
  siteUrl?: string; pageId?: string; pageName?: string; propertyId?: string;
  displayName?: string; selected: boolean;
};
export function assetValue(asset: Asset, field: 'siteUrl' | 'pageId' | 'propertyId') {
  return asset[field] ?? '';
}
export function assetLabel(asset: Asset) {
  return asset.pageName ?? asset.displayName ?? asset.siteUrl ?? asset.propertyId ?? asset.pageId ?? 'Élément sans nom';
}
export type MetaPerformance = {
  lastSyncedAt?: string;
  facebook: { talkingAboutCount?: number | null; pageName: string; followersCount: number | null; fanCount: number | null };
  instagram: { followsCount?: number | null; recentMedia?: { id: string | null; caption: string | null; permalink: string | null; timestamp: string | null; likeCount: number | null; commentsCount: number | null }[]; username: string; followersCount: number | null; mediaCount: number | null } | null;
};
export type Performance = {
  startDate: string; endDate: string; siteUrl?: string; propertyName?: string | null;
  summary: Record<string, number>;
  topQueries?: { key: string; clicks: number }[];
  topPages?: { key?: string; path?: string; clicks?: number; views?: number }[];
};
