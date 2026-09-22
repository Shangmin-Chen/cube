import { describe, it, expect, beforeAll } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { formatWCARule } from '../../scripts/pipeline/rules.mjs';
import {
  transform2LookOLL,
  transform2LookPLL,
  transformFullOLL,
  transformFullPLL,
} from '../../scripts/pipeline/transformers.mjs';

describe('pipeline fail-closed rules and transformers', () => {
  let kpuzzle: any;

  beforeAll(async () => {
    kpuzzle = await puzzles['3x3x3'].kpuzzle();
  });

  it('formatWCARule throws on unparseable algorithm', () => {
    expect(() => formatWCARule('???!!!')).toThrow(/formatWCARule: Failed to format/);
  });

  it('transform2LookOLL throws on unknown upstream case name', () => {
    const unknownData = [{ name: 'UnknownCaseName', alg: ["R U R' U'"] }];
    expect(() => transform2LookOLL(unknownData, kpuzzle)).toThrow(
      /transform2LookOLL: unknown upstream case name "UnknownCaseName"/
    );
  });

  it('transform2LookPLL throws on unknown upstream case name', () => {
    const unknownData = [{ name: 'UnknownPLLCase', alg: ["R U R' U'"] }];
    expect(() => transform2LookPLL(unknownData, kpuzzle)).toThrow(
      /transform2LookPLL: unknown upstream case name "UnknownPLLCase"/
    );
  });

  it('transformFullOLL throws on non-finite integer case number', () => {
    const badData = [{ name: 'not-a-number', alg: ["R U R' U'"] }];
    expect(() => transformFullOLL(badData, kpuzzle)).toThrow(
      /transformFullOLL: upstream case name "not-a-number" is not a valid positive integer/
    );
  });

  it('transformFullPLL throws on unknown case key', () => {
    const badData = [{ name: 'XYZ', alg: ["R U R' U'"] }];
    expect(() => transformFullPLL(badData, kpuzzle)).toThrow(
      /transformFullPLL: unknown upstream case name "XYZ"/
    );
  });
});
