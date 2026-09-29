import {
  CROSS_CASES,
  F2L_HIGHLIGHTS,
  OLL_2LOOK_CASES as RAW_OLL_2LOOK_CASES,
  PLL_2LOOK_CASES as RAW_PLL_2LOOK_CASES,
  OLL_FULL_CASES as RAW_OLL_FULL_CASES,
  FULL_PLL_CASES as RAW_FULL_PLL_CASES,
  CFOP_STEPS,
  CFOP_4LOOK_METHOD,
  CFOP_3LOOK_METHOD,
  CFOP_2LOOK_METHOD,
} from '@cube/cfop-data';
import { validateAlgCases } from './validateAlgCase';

export const OLL_2LOOK_CASES = validateAlgCases(RAW_OLL_2LOOK_CASES, 'oll-2look.json');
export const PLL_2LOOK_CASES = validateAlgCases(RAW_PLL_2LOOK_CASES, 'pll-2look.json');
export const OLL_FULL_CASES = validateAlgCases(RAW_OLL_FULL_CASES, 'oll-full.json');
export const FULL_PLL_CASES = validateAlgCases(RAW_FULL_PLL_CASES, 'pll-full.json');

export {
  CROSS_CASES,
  F2L_HIGHLIGHTS,
  CFOP_STEPS,
  CFOP_4LOOK_METHOD,
  CFOP_3LOOK_METHOD,
  CFOP_2LOOK_METHOD,
};
