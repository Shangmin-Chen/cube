/**
 * Per-case algorithm overrides applied during transform, before rule processing.
 *
 * Keys are canonical case ids (e.g. "oll-2look-line", "pll-t"). Values can:
 * - replace the upstream primary algorithm (`primaryAlg`)
 * - drop specific upstream alternatives by exact raw string match (`removeAlternatives`)
 *
 * Overrides are applied on every `npm run sync:algs`, so regenerated JSON reflects them
 * without hand-editing generated files.
 *
 * @type {Record<string, {
 *   primaryAlg?: string,
 *   removeAlternatives?: string[],
 * }>}
 */
export const ALGORITHM_OVERRIDES = {};

/**
 * Apply per-case algorithm overrides to an upstream raw algorithm list.
 *
 * @param {string} caseId
 * @param {string[]} upstreamAlgs - raw `item.alg` from the source site
 * @param {typeof ALGORITHM_OVERRIDES} [overrides=ALGORITHM_OVERRIDES]
 * @returns {string[]} adjusted list with primary first, then alternatives
 */
export function applyAlgorithmOverrides(caseId, upstreamAlgs, overrides = ALGORITHM_OVERRIDES) {
  const override = overrides[caseId];
  if (!override) {
    return [...upstreamAlgs];
  }

  let algs = [...upstreamAlgs];

  if (override.removeAlternatives?.length) {
    const toRemove = new Set(override.removeAlternatives);
    algs = algs.filter((alg, index) => index === 0 || !toRemove.has(alg));
  }

  if (override.primaryAlg !== undefined) {
    algs = [override.primaryAlg, ...algs.slice(1)];
  }

  return algs;
}
