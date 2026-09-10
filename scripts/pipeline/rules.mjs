import { Alg } from 'cubing/alg';

/**
 * Normalizes an algorithm with WCA spacing and canonical move notation.
 *
 * @param {string} algStr
 * @returns {string}
 */
export function formatWCARule(algStr) {
  try {
    return new Alg(algStr).toString();
  } catch (err) {
    console.warn(`Warning: Could not format algorithm "${algStr}": ${err.message}`);
    return algStr.trim();
  }
}

/**
 * Validates algorithm string via cubing/puzzles KPuzzle simulation.
 *
 * @param {any} kpuzzle
 * @param {string} algStr
 * @param {string} caseId
 */
export function validateAlg(kpuzzle, algStr, caseId) {
  try {
    const parsed = new Alg(algStr);
    kpuzzle.algToTransformation(parsed);
  } catch (err) {
    throw new Error(`Simulation failed for case ${caseId} with alg "${algStr}": ${err.message}`);
  }
}

/**
 * Restores centers to identity [0, 1, 2, 3, 4, 5] if an algorithm leaves the cube rotated.
 * Automatically balances V-perm (y'), Aa/Ab/E/Ja perms (x'/x).
 *
 * @param {string} algStr
 * @param {any} kpuzzle
 * @returns {string}
 */
export function balanceRotationsRule(algStr, kpuzzle) {
  const formatted = formatWCARule(algStr);
  const parsed = new Alg(formatted);
  const transf = kpuzzle.algToTransformation(parsed);
  const centers = transf.transformationData.CENTERS.permutation;
  const isIdentity = centers.every((val, idx) => val === idx);
  if (isIdentity) {
    return formatted;
  }

  const rotationCandidates = ["y'", "x'", "x", "y", "z'", "z"];
  for (const rot of rotationCandidates) {
    const candidate = formatWCARule(`${formatted} ${rot}`);
    const candidateTransf = kpuzzle.algToTransformation(new Alg(candidate));
    const cCenters = candidateTransf.transformationData.CENTERS.permutation;
    if (cCenters.every((val, idx) => val === idx)) {
      return candidate;
    }
  }

  return formatted;
}

/**
 * Ensures Edges-Only PLL algorithms (Z, H, Ua, Ub, and 2-look equivalents) leave corners
 * strictly in identity permutation [0..7] and 0 orientation delta.
 * Automatically appends U' to Z-Perm.
 *
 * @param {string} algStr
 * @param {any} kpuzzle
 * @returns {string}
 */
export function alignEdgesOnlyAUFRule(algStr, kpuzzle) {
  const formatted = formatWCARule(algStr);
  const parsed = new Alg(formatted);
  const transf = kpuzzle.algToTransformation(parsed);
  const cornersPerm = transf.transformationData.CORNERS.permutation;
  const cornersOri = transf.transformationData.CORNERS.orientationDelta;

  const isCornersIdentity = cornersPerm.every((val, idx) => val === idx);
  const isCornersOriZero = cornersOri.every(val => val === 0);
  if (isCornersIdentity && isCornersOriZero) {
    return formatted;
  }

  const aufCandidates = ["U'", "U", "U2"];
  for (const auf of aufCandidates) {
    const candidate = formatWCARule(`${formatted} ${auf}`);
    const candidateTransf = kpuzzle.algToTransformation(new Alg(candidate));
    const cPerm = candidateTransf.transformationData.CORNERS.permutation;
    const cOri = candidateTransf.transformationData.CORNERS.orientationDelta;
    if (cPerm.every((val, idx) => val === idx) && cOri.every(val => val === 0)) {
      return candidate;
    }
  }

  return formatted;
}

/**
 * Ensures Adjacent Corner Swap algorithms (J-perms, R-perms) result in a pure adjacent
 * 2-swap where exactly 2 top corners stay in place and 2 swap. If corners are left in a
 * 3-cycle (fixed corners !== 2), appends the AUF move that yields a pure adjacent 2-swap.
 * Automatically appends AUF to Jb, Ra, Rb.
 *
 * @param {string} algStr
 * @param {any} kpuzzle
 * @returns {string}
 */
export function alignAdjacentCornerAUFRule(algStr, kpuzzle) {
  const formatted = formatWCARule(algStr);
  const parsed = new Alg(formatted);
  const transf = kpuzzle.algToTransformation(parsed);
  const cornersPerm = transf.transformationData.CORNERS.permutation;
  const cornersOri = transf.transformationData.CORNERS.orientationDelta;

  // Top corners are indices 0, 1, 2, 3
  const fixedCorners = [0, 1, 2, 3].filter(i => cornersPerm[i] === i && cornersOri[i] === 0).length;
  if (fixedCorners === 2) {
    return formatted;
  }

  const aufCandidates = ["U'", "U", "U2"];
  for (const auf of aufCandidates) {
    const candidate = formatWCARule(`${formatted} ${auf}`);
    const candidateTransf = kpuzzle.algToTransformation(new Alg(candidate));
    const cPerm = candidateTransf.transformationData.CORNERS.permutation;
    const cOri = candidateTransf.transformationData.CORNERS.orientationDelta;
    const cFixed = [0, 1, 2, 3].filter(i => cPerm[i] === i && cOri[i] === 0).length;
    if (cFixed === 2) {
      return candidate;
    }
  }

  return formatted;
}

/**
 * Declarative rule-based processor that chains:
 * formatWCARule -> balanceRotationsRule -> AUF rules -> formatWCARule.
 *
 * @param {string} algStr
 * @param {any} kpuzzle
 * @param {{ isEdgesOnly?: boolean, isAdjacentCornerSwap?: boolean }} options
 * @returns {string}
 */
export function applyAlgRules(algStr, kpuzzle, { isEdgesOnly = false, isAdjacentCornerSwap = false } = {}) {
  let alg = formatWCARule(algStr);
  alg = balanceRotationsRule(alg, kpuzzle);
  if (isEdgesOnly) {
    alg = alignEdgesOnlyAUFRule(alg, kpuzzle);
  }
  if (isAdjacentCornerSwap) {
    alg = alignAdjacentCornerAUFRule(alg, kpuzzle);
  }
  return formatWCARule(alg);
}
