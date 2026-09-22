import { describe, it, expect } from 'vitest';
import { invertMoveString, parseMoveString } from '../../src/utils/cubeLogic';

describe('cubeLogic move parsing and inversion', () => {
  it('inverts basic moves correctly', () => {
    expect(invertMoveString("R U R' U'")).toEqual(['U', 'R', "U'", "R'"]);
    expect(invertMoveString('R2 U2')).toEqual(['U2', 'R2']);
  });

  it('inverts R3 as R (270° inverted is 90° CW)', () => {
    // cubing/alg normalizes R3 to R', whose inverse is R
    expect(invertMoveString('R3')).toEqual(['R']);
  });

  it('parses moves into tokens', () => {
    expect(parseMoveString("R U R' U'")).toEqual(['R', 'U', "R'", "U'"]);
    expect(parseMoveString('R3 U2')).toEqual(['R3', 'U2']);
  });
});
