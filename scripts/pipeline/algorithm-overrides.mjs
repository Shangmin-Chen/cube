import { applyAlgRules } from './rules.mjs';

/** Recognized keys for each ALGORITHM_OVERRIDES entry. */
export const RECOGNIZED_OVERRIDE_KEYS = ['primaryAlg', 'removeAlternatives'];

/**
 * Per-case algorithm overrides applied during transform, before rule processing.
 *
 * Keys are canonical case ids (e.g. "oll-2look-line", "pll-t"). Values can:
 * - replace the upstream primary algorithm (`primaryAlg`)
 * - drop specific alternatives by raw upstream string or post-rule normalized form (`removeAlternatives`)
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
 * @param {string} caseId
 * @param {Record<string, unknown>} override
 */
export function validateOverrideEntry(caseId, override) {
  const keys = Object.keys(override);

  if (keys.length === 0) {
    throw new Error(
      `Override for ${caseId} is empty; must specify primaryAlg and/or removeAlternatives`,
    );
  }

  const unknownKeys = keys.filter(key => !RECOGNIZED_OVERRIDE_KEYS.includes(key));
  if (unknownKeys.length > 0) {
    throw new Error(
      `Override for ${caseId} contains unrecognized keys: ${unknownKeys.join(', ')}`,
    );
  }

  const hasPrimary = override.primaryAlg !== undefined;
  const hasRemove = override.removeAlternatives !== undefined;

  if (!hasPrimary && !hasRemove) {
    throw new Error(
      `Override for ${caseId} must specify primaryAlg and/or removeAlternatives`,
    );
  }

  if (hasPrimary) {
    if (typeof override.primaryAlg !== 'string' || override.primaryAlg.trim() === '') {
      throw new Error(`Override for ${caseId} has empty or invalid primaryAlg`);
    }
  }

  if (hasRemove) {
    if (!Array.isArray(override.removeAlternatives)) {
      throw new Error(`Override for ${caseId} removeAlternatives must be an array`);
    }
    if (override.removeAlternatives.length === 0) {
      throw new Error(`Override for ${caseId} has empty removeAlternatives`);
    }
    const invalidEntries = override.removeAlternatives.filter(
      item => typeof item !== 'string' || item.trim() === '',
    );
    if (invalidEntries.length > 0) {
      throw new Error(
        `Override for ${caseId} has invalid removeAlternatives entries; each must be a non-empty string`,
      );
    }
  }
}

/**
 * @param {typeof ALGORITHM_OVERRIDES} [overrides=ALGORITHM_OVERRIDES]
 */
export function createOverrideContext(overrides = ALGORITHM_OVERRIDES) {
  const appliedOverrideKeys = new Set();
  return {
    overrides,
    appliedOverrideKeys,
    assertAllUsed() {
      assertNoUnusedOverrides(overrides, appliedOverrideKeys);
    },
  };
}

/**
 * @param {typeof ALGORITHM_OVERRIDES} overrides
 * @param {Set<string>} appliedOverrideKeys
 */
export function assertNoUnusedOverrides(overrides, appliedOverrideKeys) {
  const unused = Object.keys(overrides).filter(id => !appliedOverrideKeys.has(id));
  if (unused.length > 0) {
    throw new Error(
      `ALGORITHM_OVERRIDES contains keys that no transformer applied: ${unused.join(', ')}`,
    );
  }
}

/**
 * @param {string} algStr
 * @param {any} kpuzzle
 * @param {{ isEdgesOnly?: boolean, isAdjacentCornerSwap?: boolean }} ruleOptions
 */
function normalizeForMatch(algStr, kpuzzle, ruleOptions) {
  return applyAlgRules(algStr, kpuzzle, ruleOptions);
}

/**
 * @param {string} algStr
 * @param {any} kpuzzle
 * @param {{ isEdgesOnly?: boolean, isAdjacentCornerSwap?: boolean }} ruleOptions
 * @returns {string | null}
 */
function safeNormalizeForMatch(algStr, kpuzzle, ruleOptions) {
  try {
    return normalizeForMatch(algStr, kpuzzle, ruleOptions);
  } catch {
    return null;
  }
}

/**
 * @param {string} algStr
 * @param {string} target
 * @param {any} kpuzzle
 * @param {{ isEdgesOnly?: boolean, isAdjacentCornerSwap?: boolean }} ruleOptions
 */
function algMatchesTarget(algStr, target, kpuzzle, ruleOptions) {
  if (algStr === target) {
    return true;
  }

  const altNorm = safeNormalizeForMatch(algStr, kpuzzle, ruleOptions);
  const targetNorm = safeNormalizeForMatch(target, kpuzzle, ruleOptions);
  return altNorm !== null && targetNorm !== null && altNorm === targetNorm;
}

/**
 * @param {string[]} algs
 * @param {any} kpuzzle
 * @param {{ isEdgesOnly?: boolean, isAdjacentCornerSwap?: boolean }} ruleOptions
 */
function dedupeAlternativesAgainstPrimary(algs, kpuzzle, ruleOptions) {
  if (algs.length <= 1) {
    return algs;
  }

  const primary = algs[0];
  const primaryNorm = normalizeForMatch(primary, kpuzzle, ruleOptions);
  const alternatives = algs.slice(1).filter(alt => {
    if (alt === primary) {
      return false;
    }
    return normalizeForMatch(alt, kpuzzle, ruleOptions) !== primaryNorm;
  });

  return [primary, ...alternatives];
}

/**
 * @param {string[]} algs
 * @param {any} kpuzzle
 * @param {{ isEdgesOnly?: boolean, isAdjacentCornerSwap?: boolean }} ruleOptions
 */
function normalizeAlgList(algs, kpuzzle, ruleOptions) {
  return algs.map(alg => applyAlgRules(alg, kpuzzle, ruleOptions));
}

/**
 * Apply per-case algorithm overrides to an upstream raw algorithm list.
 *
 * @param {string} caseId
 * @param {string[]} upstreamAlgs - raw `item.alg` from the source site
 * @param {typeof ALGORITHM_OVERRIDES} [overrides=ALGORITHM_OVERRIDES]
 * @param {{
 *   kpuzzle: any,
 *   ruleOptions?: { isEdgesOnly?: boolean, isAdjacentCornerSwap?: boolean },
 *   appliedOverrideKeys?: Set<string>,
 * }} context
 * @returns {string[]} adjusted list with primary first, then alternatives
 */
export function applyAlgorithmOverrides(
  caseId,
  upstreamAlgs,
  overrides = ALGORITHM_OVERRIDES,
  { kpuzzle, ruleOptions = {}, appliedOverrideKeys } = {},
) {
  const override = overrides[caseId];
  if (!override) {
    return [...upstreamAlgs];
  }

  if (!kpuzzle) {
    throw new Error(`kpuzzle is required to apply algorithm overrides for case ${caseId}`);
  }

  validateOverrideEntry(caseId, override);

  const originalAlgs = [...upstreamAlgs];
  let algs = [...upstreamAlgs];

  if (override.removeAlternatives?.length) {
    const unmatched = new Set(override.removeAlternatives);
    const kept = [algs[0]];

    for (let i = 1; i < algs.length; i++) {
      const alt = algs[i];
      let removed = false;

      for (const target of override.removeAlternatives) {
        if (algMatchesTarget(alt, target, kpuzzle, ruleOptions)) {
          unmatched.delete(target);
          removed = true;
          break;
        }
      }

      if (!removed) {
        kept.push(alt);
      }
    }

    if (unmatched.size > 0) {
      throw new Error(
        `removeAlternatives for ${caseId} did not match any upstream alternative: ${[...unmatched].join(', ')}`,
      );
    }

    algs = kept;
  }

  if (override.primaryAlg !== undefined) {
    algs = [override.primaryAlg, ...algs.slice(1)];
    algs = dedupeAlternativesAgainstPrimary(algs, kpuzzle, ruleOptions);
  }

  const originalNormalized = normalizeAlgList(originalAlgs, kpuzzle, ruleOptions);
  const resolvedNormalized = normalizeAlgList(algs, kpuzzle, ruleOptions);
  if (
    resolvedNormalized.length === originalNormalized.length
    && resolvedNormalized.every((alg, index) => alg === originalNormalized[index])
  ) {
    throw new Error(`Override for ${caseId} made no change to upstream algorithms`);
  }

  appliedOverrideKeys?.add(caseId);
  return algs;
}
