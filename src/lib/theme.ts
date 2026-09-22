/** Shared palette constants for canvas/WebGL code, which can't use CSS classes. */
export const PALETTE = {
  space: "#0B0E1A",
  slate: "#6B7280",
  amber: "#F2A93B",
  offWhite: "#E8E6E1",
  violet: "#7C6FF0",
  rust: "#C4544A",
} as const;

/**
 * Colour for a trend: amber = significant rise, rust = significant decline,
 * slate = statistically indistinguishable from noise.
 */
export function trendColor(slopePerDecade: number, significant: boolean): string {
  if (!significant) return PALETTE.slate;
  return slopePerDecade >= 0 ? PALETTE.amber : PALETTE.rust;
}
