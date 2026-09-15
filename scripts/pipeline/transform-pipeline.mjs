import { ALGORITHM_OVERRIDES, createOverrideContext } from './algorithm-overrides.mjs';
import {
  transform2LookOLL,
  transform2LookPLL,
  transformFullOLL,
  transformFullPLL,
} from './transformers.mjs';

/** @type {const} */
const CFOP_DATASET_REGISTRY = [
  { datasetKey: 'oll2Look', resultKey: 'oll2LookCases', label: '2-Look OLL', transform: transform2LookOLL },
  { datasetKey: 'pll2Look', resultKey: 'pll2LookCases', label: '2-Look PLL', transform: transform2LookPLL },
  { datasetKey: 'ollFull', resultKey: 'ollFullCases', label: 'Full OLL', transform: transformFullOLL },
  { datasetKey: 'pllFull', resultKey: 'pllFullCases', label: 'Full PLL', transform: transformFullPLL },
];

/** @type {const} */
export const CFOP_DATASET_TRANSFORMERS = CFOP_DATASET_REGISTRY.map(({ label, transform }) => [label, transform]);

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

  /** @type {Record<string, Array<any>>} */
  const results = {};

  for (const { datasetKey, resultKey, transform } of CFOP_DATASET_REGISTRY) {
    results[resultKey] = transform(rawDatasets[datasetKey], kpuzzle, transformOptions);
  }

  overrideContext.assertAllUsed();

  return {
    oll2LookCases: results.oll2LookCases,
    pll2LookCases: results.pll2LookCases,
    ollFullCases: results.ollFullCases,
    pllFullCases: results.pllFullCases,
  };
}
