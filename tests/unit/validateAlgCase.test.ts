import { describe, it, expect } from 'vitest';
import { validateAlgCases } from '../../src/data/validateAlgCase';

const VALID_CASE = {
  id: 'test-1',
  name: 'Test Case',
  category: 'oll',
  subcategory: '2-Look OLL',
  group: 'Edges',
  primaryAlg: "R U R' U'",
  alternativeAlgs: ["R U2 R'"],
  probability: '1/4',
  description: 'A test case.',
  tips: 'Do the move.',
  why: 'Because it works.',
  is2Look: true,
};

describe('validateAlgCases', () => {
  it('accepts a valid AlgCase array', () => {
    const result = validateAlgCases([VALID_CASE], 'test');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test-1');
  });

  it('accepts a minimal AlgCase (only required fields)', () => {
    const minimal = {
      id: 'min-1',
      name: 'Minimal',
      category: 'pll',
      subcategory: 'Full PLL',
      group: 'Adjacent',
      primaryAlg: "R U R'",
    };
    const result = validateAlgCases([minimal], 'test');
    expect(result).toHaveLength(1);
  });

  it('throws if input is not an array', () => {
    expect(() => validateAlgCases('not-array', 'test')).toThrow('expected an array');
    expect(() => validateAlgCases(null, 'test')).toThrow('expected an array');
    expect(() => validateAlgCases(42, 'test')).toThrow('expected an array');
  });

  it('throws if an entry is null or not an object', () => {
    expect(() => validateAlgCases([null], 'test')).toThrow('expected an object');
    expect(() => validateAlgCases(['string'], 'test')).toThrow('expected an object');
  });

  it('throws if a required string field is missing', () => {
    // Remove the field entirely
    const { id: _, ...noId } = VALID_CASE;
    void _;
    expect(() => validateAlgCases([noId], 'test')).toThrow('required field "id"');
  });

  it('throws if a required string field is empty', () => {
    const empty = { ...VALID_CASE, name: '' };
    expect(() => validateAlgCases([empty], 'test')).toThrow('required field "name"');
  });

  it('throws if a required string field is a non-string type', () => {
    const bad = { ...VALID_CASE, primaryAlg: 123 };
    expect(() => validateAlgCases([bad], 'test')).toThrow('required field "primaryAlg"');
  });

  it('throws if an optional string field has wrong type', () => {
    const bad = { ...VALID_CASE, probability: 42 };
    expect(() => validateAlgCases([bad], 'test')).toThrow('"probability" must be a string');
  });

  it('throws if alternativeAlgs is not an array', () => {
    const bad = { ...VALID_CASE, alternativeAlgs: 'not-array' };
    expect(() => validateAlgCases([bad], 'test')).toThrow('"alternativeAlgs" must be an array');
  });

  it('throws if alternativeAlgs contains a non-string', () => {
    const bad = { ...VALID_CASE, alternativeAlgs: ['valid', 42] };
    expect(() => validateAlgCases([bad], 'test')).toThrow('"alternativeAlgs[1]" must be a string');
  });

  it('throws if is2Look is not a boolean', () => {
    const bad = { ...VALID_CASE, is2Look: 'yes' };
    expect(() => validateAlgCases([bad], 'test')).toThrow('"is2Look" must be a boolean');
  });

  it('validates all 4 generated JSON datasets without error', async () => {
    // This test imports the real generated JSON through cfopData and ensures
    // all datasets pass validation at module load time (they use validateAlgCases)
    const { OLL_2LOOK_CASES, PLL_2LOOK_CASES, OLL_FULL_CASES, FULL_PLL_CASES } =
      await import('../../src/data/cfopData');

    expect(OLL_2LOOK_CASES.length).toBeGreaterThan(0);
    expect(PLL_2LOOK_CASES.length).toBeGreaterThan(0);
    expect(OLL_FULL_CASES.length).toBeGreaterThan(0);
    expect(FULL_PLL_CASES.length).toBeGreaterThan(0);
  });
});
