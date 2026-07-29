export type CtaPlacement = "after-table" | "before-conclusion";

/** Default variant: CTA blocks grouped below the first comparison table. */
export const defaultCtaPlacement: CtaPlacement = "after-table";

/**
 * Per-slug overrides for A/B comparison.
 * `before-conclusion` = variant B (CTA before まとめ/FAQ section).
 */
export const ctaPlacementBySlug: Record<string, CtaPlacement> = {
  "sim-20gb-osusume": "before-conclusion",
  "hikari-switch-osusume": "before-conclusion",
};

export function resolveCtaPlacement(
  slug: string | undefined,
  commentPlacement?: CtaPlacement | null,
): CtaPlacement {
  if (commentPlacement) {
    return commentPlacement;
  }
  if (slug && slug in ctaPlacementBySlug) {
    return ctaPlacementBySlug[slug];
  }
  return defaultCtaPlacement;
}
