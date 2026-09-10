import type { AlgMethod } from '../types/cube';
import {
  CFOP_4LOOK_METHOD,
  CFOP_3LOOK_METHOD,
  CFOP_2LOOK_METHOD,
} from './cfopData';

export { CFOP_4LOOK_METHOD, CFOP_3LOOK_METHOD, CFOP_2LOOK_METHOD };

export const BUILTIN_METHODS: AlgMethod[] = [
  CFOP_4LOOK_METHOD,
  CFOP_3LOOK_METHOD,
  CFOP_2LOOK_METHOD,
];
