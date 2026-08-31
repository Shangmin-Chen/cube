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
  // Clean up brackets, parentheses like (R U R' U')
  const clean = movesStr.replace(/[\(\)\{\}]/g, ' ').trim();
  if (!clean) return [];
  return clean.split(/\s+/).filter(m => m.length > 0);
}

// Invert an algorithm move sequence for case setup (supports lowercase and 'w'-suffix wide moves)
export function invertMoveString(movesStr: string): string[] {
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

    // 3-move trigger: Insert / Extract Pair (R U R')
    if (startsWithPattern(remaining, "R U R'")) {
      chunks.push({
        text: "R U R'",
        name: 'F2L Pair Extract',
        description: 'Lifts Front-Right pair to top layer.',
        type: 'insert',
      });
      i += 3;
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
  const validTimes = recent.filter(t => t > 0); // exclude DNF (-1)
  if (validTimes.length < count - 1) return -1; // DNF for AO

  // Remove min and max
  const sorted = [...recent].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  const sum = trimmed.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / trimmed.length);
}
