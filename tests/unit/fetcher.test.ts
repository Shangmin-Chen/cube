import { describe, it, expect } from 'vitest';
import { parseAlgset, validateAlgsetSchema, extractAlgsetAst, astToValue } from '../../scripts/ingest/fetcher.mjs';

describe('fetcher AST parsing & schema validation', () => {
  it('safely extracts and parses algsetAlgs without eval', () => {
    const mockCode = `
      // Some comment here
      var pageDetails = { arrows: { scale: 1, color: "red" } };
      var algsetAlgs = [
        {
          name: "Sune",
          alg: ["R U R' U R U2 R'"],
          group: "Corners",
          prob: 4,
          arrows: [{ scale: pageDetails.arrows.scale }], // Non-literal reference ignored safely
        },
        {
          name: 1,
          alg: ["F R U R' U' F'"],
          prob: 2,
          flag: !0,
        },
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
    expect(result[1].flag).toBe(true);
  });

  it('supports direct assignment syntax (algsetAlgs = [...])', () => {
    const mockCode = `
      pageDetails = { view: 'plan' };
      algsetAlgs = [
        { name: "H", alg: ["M2 U M2 U2 M2 U M2", "M2 U' M2 U2 M2 U' M2"], group: "EPLL" }
      ];
    `;
    const result = parseAlgset(mockCode, 'https://example.com/mock.js');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('H');
    expect(result[0].alg).toHaveLength(2);
    expect(result[0].group).toBe('EPLL');
  });

  it('ignores function calls and arbitrary executable code', () => {
    const mockCode = `
      var algsetAlgs = [
        {
          name: "Test",
          alg: ["R U R'"],
          evil: console.log("exploit"),
          fn: () => alert(1)
        }
      ];
    `;
    const result = parseAlgset(mockCode, 'https://example.com/mock.js');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
    expect(result[0].alg).toEqual(["R U R'"]);
    expect(result[0].evil).toBeUndefined();
    expect(result[0].fn).toBeUndefined();
  });

  it('guards against prototype pollution keys', () => {
    const mockCode = `
      var algsetAlgs = [
        {
          name: "Test",
          alg: ["R U R'"],
          __proto__: { polluted: true }
        }
      ];
    `;
    const result = parseAlgset(mockCode, 'https://example.com/mock.js');
    expect(result).toHaveLength(1);
    expect(Object.prototype.polluted).toBeUndefined();
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
});
