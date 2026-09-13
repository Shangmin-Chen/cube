import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRIGGER_PATTERNS, MIN_PALINDROME_MOVES } from '../src/utils/triggerPatterns.ts';
import { detectAlgBadges, parseTriggers } from '../src/utils/cubeLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const UI_HINT_SURFACES = [
  'src/components/trainer/TriggerChips.tsx',
  'src/components/AlgReferenceTab.tsx',
  'src/components/trainer/RoundSummary.tsx',
] as const;

type CaseRow = { id: string; primaryAlg: string };

type IndependentMatch = {
  start: number;
  end: number;
  label: string;
  tokenLen: number;
};

function loadPrimaries(): CaseRow[] {
  const files = [
    'src/data/generated/oll-2look.json',
    'src/data/generated/pll-2look.json',
    'src/data/generated/oll-full.json',
    'src/data/generated/pll-full.json',
  ];
  return files.flatMap(file => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, file), 'utf8')) as CaseRow[];
    return data.map(row => ({ id: row.id, primaryAlg: row.primaryAlg }));
  });
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/** Independent tokenizer — duplicated here so tests do not wrap production helpers. */
function independentTokenize(movesStr: string): string[] {
  const clean = movesStr.replace(/[(){}]/g, ' ').trim();
  if (!clean) return [];
  return clean.split(/\s+/).filter(Boolean);
}

function independentMatchesAt(
  moves: readonly string[],
  start: number,
  patternTokens: readonly string[],
): boolean {
  if (start + patternTokens.length > moves.length) return false;
  for (let j = 0; j < patternTokens.length; j++) {
    if (moves[start + j] !== patternTokens[j]) return false;
  }
  return true;
}

function independentFindMatches(moves: readonly string[]): IndependentMatch[] {
  const matches: IndependentMatch[] = [];
  for (let i = 0; i < moves.length; i++) {
    for (const pattern of TRIGGER_PATTERNS) {
      if (independentMatchesAt(moves, i, pattern.tokens)) {
        matches.push({
          start: i,
          end: i + pattern.tokens.length,
          label: pattern.badgeLabel,
          tokenLen: pattern.tokens.length,
        });
        break;
      }
    }
  }
  return matches;
}

function independentIsContained(inner: IndependentMatch, outer: IndependentMatch): boolean {
  return (
    outer.tokenLen > inner.tokenLen &&
    outer.start <= inner.start &&
    outer.end >= inner.end
  );
}

function independentVisibleMatches(matches: readonly IndependentMatch[]): IndependentMatch[] {
  return matches.filter(
    m => !matches.some(other => other !== m && independentIsContained(m, other)),
  );
}

function independentIsPalindrome(moves: readonly string[]): boolean {
  if (moves.length < MIN_PALINDROME_MOVES) return false;
  for (let k = 0; k < Math.floor(moves.length / 2); k++) {
    if (moves[k] !== moves[moves.length - 1 - k]) return false;
  }
  return true;
}

/** Property oracle: badges from an independent token scan, not production shadowing helpers. */
function independentExpectedBadges(movesStr: string): string[] {
  const moves = independentTokenize(movesStr);
  if (moves.length === 0) return [];

  const badges: string[] = [];
  if (independentIsPalindrome(moves)) {
    badges.push('Palindrome');
  }
  for (const match of independentVisibleMatches(independentFindMatches(moves))) {
    badges.push(match.label);
  }
  return Array.from(new Set(badges));
}

function legacyDetectAlgBadges(movesStr: string): string[] {
  const badges: string[] = [];
  const clean = movesStr.replace(/[(){}]/g, ' ').trim();
  if (!clean) return badges;

  const moves = clean.split(/\s+/).filter(Boolean);
  if (moves.length === 0) return badges;

  const normalizedStr = moves.join(' ');
  if (moves.join(' ') === [...moves].reverse().join(' ')) badges.push('Palindrome');

  const isDoubleSune = normalizedStr.includes("R U R' U R U' R' U R U2 R'");
  if (isDoubleSune) badges.push('Double Sune');
  if (normalizedStr.includes("R U R' U R U2 R'") && !isDoubleSune) badges.push('Sune');
  if (normalizedStr.includes("R U2 R' U' R U' R'")) badges.push('Anti-Sune');
  if (normalizedStr.includes("R U R' U'")) badges.push('Sexy Move');
  if (normalizedStr.includes("r U R' U'")) badges.push('Wide Sexy');
  if (normalizedStr.includes("U R U' R'")) badges.push('Inverse Sexy');
  if (normalizedStr.includes("L' U' L U")) badges.push('Left Sexy');
  if (normalizedStr.includes("R' F R F'")) badges.push('Sledgehammer');
  if (normalizedStr.includes("r' F R F'")) badges.push('Wide Sledge');
  if (normalizedStr.includes("F R' F' R")) badges.push('Hedgeslammer');

  return Array.from(new Set(badges));
}

function runVerification(): void {
  console.log('--- Trigger Pattern Verification ---');

  const primaries = loadPrimaries();
  console.log(`Loaded ${primaries.length} generated primaries`);

  // AC1: No palindrome chips shorter than 5 moves
  let shortPalindromeCount = 0;
  for (const row of primaries) {
    for (const chunk of parseTriggers(row.primaryAlg)) {
      if (chunk.type === 'palindrome') {
        const moveCount = chunk.text.split(/\s+/).filter(Boolean).length;
        if (moveCount < MIN_PALINDROME_MOVES) {
          shortPalindromeCount++;
          console.error(`AC1 fail: ${row.id} palindrome chip "${chunk.text}" (${moveCount} moves)`);
        }
      }
    }
  }
  assert(shortPalindromeCount === 0, `AC1: ${shortPalindromeCount} palindrome chips < ${MIN_PALINDROME_MOVES} moves`);
  console.log(`AC1: 0 palindrome chips shorter than ${MIN_PALINDROME_MOVES} moves (swept ${primaries.length} primaries)`);

  // Palindrome badge threshold (AC8): same ≥5 rule as chips
  assert(
    !detectAlgBadges('R2 U R2').includes('Palindrome'),
    'Palindrome badge: R2 U R2 must not badge (3 moves)',
  );
  assert(
    detectAlgBadges('R U2 R U2 R').includes('Palindrome'),
    'Palindrome badge: R U2 R U2 R must badge (5-move palindrome)',
  );
  console.log('Palindrome badge threshold: R2 U R2 rejected, R U2 R U2 R accepted');

  // Property-based AC3/AC4: production badges must match independent oracle across all primaries
  let propertyFailures = 0;
  for (const row of primaries) {
    const expected = independentExpectedBadges(row.primaryAlg);
    const actual = detectAlgBadges(row.primaryAlg);
    if (!arraysEqual(actual, expected)) {
      propertyFailures++;
      console.error(
        `Property fail: ${row.id} actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`,
      );
    }
  }
  assert(propertyFailures === 0, `AC3/AC4: ${propertyFailures} badge property violations`);
  console.log(`AC3/AC4: production badges match independent oracle for ${primaries.length} primaries`);

  // Named regression locks (supplement property checks, not replace them)
  const expectedById: Record<string, string[]> = {
    'oll-17': ['Inverse Sexy'],
    'oll-36': [],
    'oll-38': ['Inverse Sexy', 'Sledgehammer'],
    'oll-2look-h': ['Double Sune'],
    'pll-2look-ua': ['Inverse Sexy'],
  };
  for (const [id, expected] of Object.entries(expectedById)) {
    const row = primaries.find(r => r.id === id);
    assert(Boolean(row), `${id} not found`);
    const badges = detectAlgBadges(row!.primaryAlg).filter(b => b !== 'Palindrome');
    assert(arraysEqual(badges, expected), `${id}: got ${JSON.stringify(badges)}, expected ${JSON.stringify(expected)}`);
    console.log(`${id}: ${JSON.stringify(badges)} ✓`);
  }

  const pllNb = primaries.find(row => row.id === 'pll-nb');
  assert(Boolean(pllNb), 'pll-nb not found');
  const hedgeChunk = parseTriggers(pllNb!.primaryAlg).find(c => c.type === 'hedge' && c.text === "F R' F' R");
  assert(Boolean(hedgeChunk), "AC6: pll-nb missing Hedgeslammer chunk F R' F' R");
  console.log("AC6: pll-nb yields Hedgeslammer = F R' F' R");

  const allowedRemovals: Record<string, Set<string>> = {
    'oll-17': new Set(['Hedgeslammer']),
    'oll-36': new Set(['Left Sexy']),
    'oll-2look-h': new Set(['Inverse Sexy']),
  };
  let regressionFailures = 0;
  let totalRemovals = 0;
  for (const row of primaries) {
    const legacy = legacyDetectAlgBadges(row.primaryAlg).filter(b => b !== 'Palindrome');
    const current = detectAlgBadges(row.primaryAlg).filter(b => b !== 'Palindrome');
    const removed = legacy.filter(b => !current.includes(b));
    const added = current.filter(b => !legacy.includes(b));

    if (added.length > 0) {
      regressionFailures++;
      console.error(`AC5 fail: ${row.id} gained badges ${JSON.stringify(added)}`);
    }
    for (const badge of removed) {
      totalRemovals++;
      if (!allowedRemovals[row.id]?.has(badge)) {
        regressionFailures++;
        console.error(`AC5 fail: ${row.id} lost unexpected badge "${badge}"`);
      }
    }
  }
  assert(regressionFailures === 0, `AC5: ${regressionFailures} regression failures (${totalRemovals} removals)`);
  console.log(`AC5: ${totalRemovals} intentional badge removals, 0 unexpected changes`);

  // AC7: UI surfaces must import and render the shared hint string
  for (const relativePath of UI_HINT_SURFACES) {
    const source = fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
    assert(
      source.includes('triggerHints') && source.includes('NO_RECOGNIZED_TRIGGERS_HINT'),
      `AC7 fail: ${relativePath} missing shared zero-chip hint import/usage`,
    );
  }
  const zeroChipCases = primaries.filter(row => {
    const chunks = parseTriggers(row.primaryAlg);
    return chunks.length > 0 && chunks.every(c => c.type === 'normal');
  });
  console.log(`AC7: hint wired in ${UI_HINT_SURFACES.length} UI surfaces; ${zeroChipCases.length} zero-chip primaries`);

  // False-positive sweep: fail if a badge is emitted for a substring-only (non-token-aligned) hit
  let substringBadgeViolations = 0;
  for (const row of primaries) {
    const moves = independentTokenize(row.primaryAlg);
    const joined = moves.join(' ');
    const badges = detectAlgBadges(row.primaryAlg).filter(b => b !== 'Palindrome');

    for (const pattern of TRIGGER_PATTERNS) {
      const hasSubstringHit = joined.includes(pattern.pattern);
      const hasTokenHit = independentFindMatches(moves).some(
        m => m.label === pattern.badgeLabel && m.tokenLen === pattern.tokens.length,
      );
      if (hasSubstringHit && !hasTokenHit && badges.includes(pattern.badgeLabel)) {
        substringBadgeViolations++;
        console.error(
          `False-positive fail: ${row.id} badges "${pattern.badgeLabel}" from substring "${pattern.pattern}" without token alignment`,
        );
      }
    }
  }
  assert(substringBadgeViolations === 0, `False-positive sweep: ${substringBadgeViolations} substring badge violations`);
  console.log('False-positive sweep: 0 substring-only badges across 94 primaries');

  for (let i = 0; i < TRIGGER_PATTERNS.length; i++) {
    for (let j = i + 1; j < TRIGGER_PATTERNS.length; j++) {
      if (TRIGGER_PATTERNS[i].pattern.startsWith(TRIGGER_PATTERNS[j].pattern)) {
        throw new Error(`Pattern order violation: "${TRIGGER_PATTERNS[j].pattern}" before "${TRIGGER_PATTERNS[i].pattern}"`);
      }
    }
  }
  console.log('Pattern table shadowing order: OK');
  console.log('\nAll trigger verification checks passed.');
}

runVerification();
