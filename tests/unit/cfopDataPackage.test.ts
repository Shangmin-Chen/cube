import { describe, it, expect } from 'vitest';
import {
  CROSS_CASES,
  F2L_HIGHLIGHTS,
  OLL_2LOOK_CASES,
  PLL_2LOOK_CASES,
  OLL_FULL_CASES,
  FULL_PLL_CASES,
  CFOP_4LOOK_METHOD,
  CFOP_3LOOK_METHOD,
  CFOP_2LOOK_METHOD,
  BUILTIN_METHODS,
} from '@cube/cfop-data';

describe('@cube/cfop-data workspace package', () => {
  it('exports canonical Cross cases (4 cases)', () => {
    expect(CROSS_CASES).toHaveLength(4);
    for (const c of CROSS_CASES) {
      expect(c.category).toBe('cross');
      expect(c.primaryAlg).toBeDefined();
    }
  });

  it('exports fundamental F2L highlights (4 cases)', () => {
    expect(F2L_HIGHLIGHTS).toHaveLength(4);
    for (const c of F2L_HIGHLIGHTS) {
      expect(c.category).toBe('f2l');
      expect(c.primaryAlg).toBeDefined();
    }
  });

  it('exports 2-Look OLL (10 cases) and 2-Look PLL (6 cases)', () => {
    expect(OLL_2LOOK_CASES).toHaveLength(10);
    expect(PLL_2LOOK_CASES).toHaveLength(6);
    for (const c of OLL_2LOOK_CASES) {
      expect(c.category).toBe('oll');
      expect(c.is2Look).toBe(true);
    }
    for (const c of PLL_2LOOK_CASES) {
      expect(c.category).toBe('pll');
      expect(c.is2Look).toBe(true);
    }
  });

  it('exports Full OLL (57 cases) and Full PLL (21 cases)', () => {
    expect(OLL_FULL_CASES).toHaveLength(57);
    expect(FULL_PLL_CASES).toHaveLength(21);
  });

  it('exports valid CFOP method tiers with expected case counts', () => {
    expect(CFOP_4LOOK_METHOD.cases).toHaveLength(24); // 4 + 4 + 10 + 6
    expect(CFOP_3LOOK_METHOD.cases).toHaveLength(39); // 4 + 4 + 10 + 21
    expect(CFOP_2LOOK_METHOD.cases).toHaveLength(86); // 4 + 4 + 57 + 21
    expect(BUILTIN_METHODS).toHaveLength(3);
  });
});
