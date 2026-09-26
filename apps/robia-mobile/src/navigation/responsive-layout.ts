// Logical pixels and font scale keep layout independent of device brands.
export const CONTENT_MAX_WIDTH = 720;
export function responsiveLayout(width: number, height: number, fontScale = 1, insets = { left: 0, right: 0, top: 0, bottom: 0 }) {
  const safeWidth = Math.max(0, width - insets.left - insets.right);
  const safeHeight = Math.max(0, height - insets.top - insets.bottom);
  const gutter = safeWidth < 360 ? 12 : safeWidth < 600 ? 20 : 28;
  const contentWidth = Math.max(0, Math.min(CONTENT_MAX_WIDTH, safeWidth - gutter * 2));
  const scale = Math.max(1, fontScale);
  return {
    safeWidth, safeHeight, gutter, contentWidth,
    containerWidth: CONTENT_MAX_WIDTH + gutter * 2,
    compact: contentWidth / scale < 340,
    short: safeHeight < 500,
    toolColumns: contentWidth / scale >= 440 ? 2 : 1,
    metricColumns: contentWidth / scale >= 300 ? 3 : contentWidth / scale >= 220 ? 2 : 1,
    headerMaxHeight: Math.max(48, safeHeight * 0.4),
  };
}
export function tabLayout(availableWidth: number, fontScale: number, count: number) {
  const width = Math.max(0, Math.min(720, availableWidth));
  const minimum = 68 * Math.max(1, fontScale);
  const scroll = count * minimum > width;
  return { width, scroll, itemWidth: scroll ? Math.min(width, 104 * Math.max(1, fontScale)) : width / Math.max(1, count) };
}
