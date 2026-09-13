import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TRIGGER_PATTERNS,
  MIN_PALINDROME_MOVES,
  filterShadowedMatches,
  findTokenAlignedMatches,
  tokenizeAlgMoves,
} from '../src/utils/triggerPatterns.ts';
import { detectAlgBadges, parseTriggers } from '../src/utils/cubeLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

type CaseRow = { id: string; primaryAlg: string };

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

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

function runVerification(): void {
  console.log('--- Trigger Pattern Verification ---');

  const primaries = loadPrimaries();
  console.log(`Loaded ${primaries.length} generated primaries`);

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

  const oll2lookH = primaries.find(row => row.id === 'oll-2look-h');
  assert(Boolean(oll2lookH), 'oll-2look-h not found');
  const oll2lookHBages = detectAlgBadges(oll2lookH!.primaryAlg);
  assert(
    arraysEqual(oll2lookHBages, ['Double Sune']),
    `AC2: oll-2look-h badges = ${JSON.stringify(oll2lookHBages)}, expected ["Double Sune"]`,
  );
  console.log('AC2: oll-2look-h → ["Double Sune"]');

  let shadowedBadgeCount = 0;
  for (const row of primaries) {
    const moves = tokenizeAlgMoves(row.primaryAlg);
    const allMatches = findTokenAlignedMatches(moves);
    const visible = filterShadowedMatches(allMatches);
    const badges = detectAlgBadges(row.primaryAlg).filter(b => b !== 'Palindrome');

    for (const match of allMatches) {
      if (!visible.includes(match) && badges.includes(match.pattern.badgeLabel)) {
        shadowedBadgeCount++;
        console.error(`AC3 fail: ${row.id} shadowed badge "${match.pattern.badgeLabel}"`);
      }
    }

    for (const badge of badges) {
      if (!visible.some(m => m.pattern.badgeLabel === badge)) {
        shadowedBadgeCount++;
        console.error(`AC4 fail: ${row.id} badge "${badge}" without visible match`);
      }
    }
  }
  assert(shadowedBadgeCount === 0, `AC3/AC4: ${shadowedBadgeCount} shadowing violations`);
  console.log(`AC3/AC4: 0 shadowed badges across ${primaries.length} primaries`);

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

  const zeroChipCases = primaries.filter(row => {
    const chunks = parseTriggers(row.primaryAlg);
    return chunks.length > 0 && chunks.every(c => c.type === 'normal');
  });
  console.log(`AC7: ${zeroChipCases.length} primaries with no recognized trigger chips`);

  let substringFalsePositives = 0;
  for (const row of primaries) {
    const moves = tokenizeAlgMoves(row.primaryAlg);
    const joined = moves.join(' ');
    const tokenMatches = new Set(
      filterShadowedMatches(findTokenAlignedMatches(moves)).map(m => m.pattern.pattern),
    );
    for (const pattern of TRIGGER_PATTERNS) {
      if (joined.includes(pattern.pattern) && !tokenMatches.has(pattern.pattern)) {
        const hasTokenHit = findTokenAlignedMatches(moves).some(m => m.pattern.pattern === pattern.pattern);
        if (!hasTokenHit) substringFalsePositives++;
      }
    }
  }
  console.log(`False-positive sweep: ${substringFalsePositives} substring-only hits (not surfaced as badges)`);

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
