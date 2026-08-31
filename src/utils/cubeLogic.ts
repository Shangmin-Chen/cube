import { Alg } from 'cubing/alg';

// Helper functions for Rubik's Cube scrambles, move parsing, and state calculations

const FACES = ['U', 'D', 'F', 'B', 'R', 'L'];
const MODIFIERS = ['', "'", '2'];

// Opposite faces so scrambles don't repeat redundant faces (e.g. U D U)
const OPPOSITES: Record<string, string> = {
  U: 'D',
  D: 'U',
  F: 'B',
  B: 'F',
  R: 'L',
  L: 'R',
};

export interface TriggerChunk {
  text: string;
  name?: string;
  description?: string;
  type: 'sexy' | 'sledge' | 'hedge' | 'sune' | 'insert' | 'normal';
}

export function generateScramble(length = 20): string {
  const scramble: string[] = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < length; i++) {
    let availableFaces = FACES.filter(f => f !== lastFace);
    
    // If the last two moves were on opposite faces (e.g., U then D), don't allow U again
    if (lastFace && OPPOSITES[lastFace] === secondLastFace) {
      availableFaces = availableFaces.filter(f => f !== secondLastFace);
    }

    const face = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    scramble.push(face + modifier);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return scramble.join(' ');
}

export function parseMoveString(movesStr: string): string[] {
  if (!movesStr || !movesStr.trim()) return [];
  try {
    const expanded = new Alg(movesStr).expand().toString();
    return expanded.split(/\s+/).filter(Boolean);
  } catch {
    let cleanStr = movesStr;
    cleanStr = cleanStr.replace(/\(([^)]+)\)(\d+)/g, (_, group, count) => {
      return (group.trim() + ' ').repeat(parseInt(count, 10)).trim();
    });
    cleanStr = cleanStr.replace(/[\(\)\{\}]/g, ' ').trim();
    return cleanStr.split(/\s+/).filter(m => Boolean(m) && !/^\d+$/.test(m));
  }
}

// Invert an algorithm move sequence using WCA cubing/alg standard library
export function invertMoveString(movesStr: string): string[] {
  try {
    const alg = new Alg(movesStr);
    const invertedStr = alg.expand().invert().toString();
    return invertedStr.split(/\s+/).filter(Boolean);
  } catch {
    const parsed = parseMoveString(movesStr);
    const reversed = [...parsed].reverse();
    return reversed.map(move => {
      if (!move) return move;
      const isPrime = move.includes("'");
      const isDouble = move.includes('2');
      const baseMove = move.replace(/['2]/g, '');

      if (isDouble) return `${baseMove}2`;
      if (isPrime) return baseMove;
      return `${baseMove}'`;
    });
  }
}

// Identify intuitive building-block triggers in algorithm strings for human learners
export function parseTriggers(movesStr: string): TriggerChunk[] {
  const clean = movesStr.replace(/[\(\)\{\}]/g, ' ').trim();
  if (!clean) return [];

  const chunks: TriggerChunk[] = [];
  const moves = clean.split(/\s+/);
  let i = 0;

  const startsWithPattern = (rem: string, pattern: string) => {
    return rem === pattern || rem.startsWith(pattern + ' ');
  };

  while (i < moves.length) {
    const remaining = moves.slice(i).join(' ');

    // 11-move trigger: Double Sune (R U R' U R U' R' U R U2 R')
    if (startsWithPattern(remaining, "R U R' U R U' R' U R U2 R'")) {
      chunks.push({
        text: "R U R' U R U' R' U R U2 R'",
        name: 'Double Sune',
        description: "Chained Sune trigger where U2 R' + R U cancels R' R and combines U2 U into U'.",
        type: 'sune',
      });
      i += 11;
      continue;
    }

    // 7-move trigger: Sune (R U R' U R U2 R')
    if (startsWithPattern(remaining, "R U R' U R U2 R'")) {
      chunks.push({
        text: "R U R' U R U2 R'",
        name: 'Sune Trigger',
        description: 'Lifts F2L pair, spins top layer 360°, and re-slots pair. Cycles 3 corners.',
        type: 'sune',
      });
      i += 7;
      continue;
    }

    // 7-move trigger: Anti-Sune (R U2 R' U' R U' R')
    if (startsWithPattern(remaining, "R U2 R' U' R U' R'")) {
      chunks.push({
        text: "R U2 R' U' R U' R'",
        name: 'Anti-Sune Trigger',
        description: 'Inverse Sune trigger. Pushes pair 2 steps left then returns home.',
        type: 'sune',
      });
      i += 7;
      continue;
    }

    // 4-move trigger: Sexy Move (R U R' U')
    if (startsWithPattern(remaining, "R U R' U'")) {
      chunks.push({
        text: "R U R' U'",
        name: 'Sexy Move',
        description: 'Pops Front-Right F2L pair out to top layer and shifts U face left.',
        type: 'sexy',
      });
      i += 4;
      continue;
    }

    // 4-move trigger: Wide/Fat Sexy (r U R' U')
    if (startsWithPattern(remaining, "r U R' U'")) {
      chunks.push({
        text: "r U R' U'",
        name: 'Wide Sexy Move',
        description: 'Double-layer Sexy move used in OLL to orient slice edges.',
        type: 'sexy',
      });
      i += 4;
      continue;
    }

    // 4-move trigger: Sledgehammer (R' F R F')
    if (startsWithPattern(remaining, "R' F R F'")) {
      chunks.push({
        text: "R' F R F'",
        name: 'Sledgehammer',
        description: 'Rotates FR slot and flips top-front edge sticker orientation.',
        type: 'sledge',
      });
      i += 4;
      continue;
    }

    // 4-move trigger: Hedgeslammer (F R' F' R)
    if (startsWithPattern(remaining, "F R' F' R")) {
      chunks.push({
        text: "F R' F' R",
        name: 'Hedgeslammer',
        description: 'Front-face inverse sledgehammer trigger.',
        type: 'hedge',
      });
      i += 4;
      continue;
    }

    // Single move fallback
    chunks.push({
      text: moves[i],
      type: 'normal',
    });
    i += 1;
  }

  return chunks;
}

export function formatTime(ms: number): string {
  if (ms < 0) return '0.000';
  const seconds = Math.floor(ms / 1000);
  const remainderMs = Math.floor(ms % 1000);
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;

  const msStr = remainderMs.toString().padStart(3, '0').slice(0, 2); // show 2 decimals
  if (minutes > 0) {
    return `${minutes}:${remSec.toString().padStart(2, '0')}.${msStr}`;
  }
  return `${remSec}.${msStr}`;
}

export function calculateAO(times: number[], count: number): number | null {
  if (times.length < count) return null;
  const recent = times.slice(-count);
  const dnfCount = recent.filter(t => t < 0).length;
  if (dnfCount >= 2) return -1;

  // Map DNF (-1) to Infinity for WCA sorting so DNF is treated as worst (maximum) time
  const sorted = [...recent].sort((a, b) => {
    const valA = a < 0 ? Infinity : a;
    const valB = b < 0 ? Infinity : b;
    if (valA === valB) return 0;
    return valA - valB;
  });

  const trimmed = sorted.slice(1, sorted.length - 1);
  if (trimmed.some(t => t < 0)) return -1;

  const sum = trimmed.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / trimmed.length);
}
