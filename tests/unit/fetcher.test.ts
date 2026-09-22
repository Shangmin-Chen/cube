import { describe, it, expect } from 'vitest';
import { parseAlgset, validateAlgsetSchema, extractBalancedArray } from '../../scripts/ingest/fetcher.mjs';

describe('fetcher parseAlgset & schema validation', () => {
  it('safely extracts and parses algsetAlgs without eval', () => {
    const mockCode = `
      var pageDetails = { arrows: { scale: 1, color: "red" } };
      var algsetAlgs = [
        { name: "Sune", alg: ["R U R' U R U2 R'"], group: "Corners", prob: 4, arrows: [{ scale: pageDetails.arrows.scale }] },
        { name: 1, alg: ["F R U R' U' F'"], prob: 2 }
      ];
    `;
    const result = parseAlgset(mockCode, 'https://example.com/mock.js');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Sune');
    expect(result[0].alg).toEqual(["R U R' U R U2 R'"]);
    expect(result[0].group).toBe('Corners');
    expect(result[0].prob).toBe(4);
    expect(result[1].name).toBe(1);
    expect(result[1].alg).toEqual(["F R U R' U' F'"]);
  });

  it('fails if no algsetAlgs array exists', () => {
    const invalidCode = `var otherData = [{ name: "test" }];`;
    expect(() => parseAlgset(invalidCode, 'https://example.com/invalid.js')).toThrow(
      /No algsetAlgs array found/
    );
  });

  it('fails schema validation if item is missing required name or alg', () => {
    expect(() => validateAlgsetSchema([{ alg: ['R U R'] }], 'test-url')).toThrow(
      /item.name must be string or number/
    );
    expect(() => validateAlgsetSchema([{ name: 'Test', alg: 'not-an-array' }], 'test-url')).toThrow(
      /item.alg must be an array of strings/
    );
  });

  it('extracts balanced array brackets correctly with nested brackets and strings', () => {
    const code = `algsetAlgs = [["nested", "bracket [with] quotes"], "simple"]; trailing;`;
    const extracted = extractBalancedArray(code, 'algsetAlgs');
    expect(extracted).toBe(`[["nested", "bracket [with] quotes"], "simple"]`);
  });
});
