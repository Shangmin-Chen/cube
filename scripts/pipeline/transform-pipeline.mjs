import { ALGORITHM_OVERRIDES, createOverrideContext } from './algorithm-overrides.mjs';
import {
  transform2LookOLL,
  transform2LookPLL,
  transformFullOLL,
  transformFullPLL,
} from './transformers.mjs';

/**
 * Run all four CFOP dataset transformers with shared override tracking,
 * then assert every override key was applied by at least one transformer.
 *
 * @param {{
 *   oll2Look: Array<any>,
 *   pll2Look: Array<any>,
 *   ollFull: Array<any>,
 *   pllFull: Array<any>,
 * }} rawDatasets
 * @param {any} kpuzzle
 * @param {typeof ALGORITHM_OVERRIDES} [overrides=ALGORITHM_OVERRIDES]
 */
export function transformAllCfopDatasets(rawDatasets, kpuzzle, overrides = ALGORITHM_OVERRIDES) {
  const overrideContext = createOverrideContext(overrides);
  const transformOptions = {
    overrides: overrideContext.overrides,
    appliedOverrideKeys: overrideContext.appliedOverrideKeys,
  };

  const oll2LookCases = transform2LookOLL(rawDatasets.oll2Look, kpuzzle, transformOptions);
  const pll2LookCases = transform2LookPLL(rawDatasets.pll2Look, kpuzzle, transformOptions);
  const ollFullCases = transformFullOLL(rawDatasets.ollFull, kpuzzle, transformOptions);
  const pllFullCases = transformFullPLL(rawDatasets.pllFull, kpuzzle, transformOptions);

  overrideContext.assertAllUsed();

  return { oll2LookCases, pll2LookCases, ollFullCases, pllFullCases };
}

/** @type {const} */
export const CFOP_DATASET_TRANSFORMERS = [
  ['2-Look OLL', transform2LookOLL],
  ['2-Look PLL', transform2LookPLL],
  ['Full OLL', transformFullOLL],
  ['Full PLL', transformFullPLL],
];
