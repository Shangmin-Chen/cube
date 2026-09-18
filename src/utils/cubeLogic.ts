import { Alg } from 'cubing/alg';
import {
  detectTokenAlignedBadges,
  findLongestPalindromeFrom,
  findLongestPatternAt,
  tokenizeAlgMoves,
  type TriggerType,
} from './triggerPatterns.ts';

const FACES = ['U', 'D', 'F', 'B', 'R', 'L'];
const MODIFIERS = ['', "'", '2'];

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
  type: TriggerType;
}

export function generateScramble(length = 20): string {
  const scramble: string[] = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < length; i++) {
    let availableFaces = FACES.filter(f => f !== lastFace);
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
    cleanStr = cleanStr.replace(/[(){}]/g, ' ').trim();
    return cleanStr.split(/\s+/).filter(m => Boolean(m) && !/^\d+$/.test(m));
  }
}

export function invertMoveString(movesStr: string): string[] {
  try {
    const alg = new Alg(movesStr);
    const invertedStr = alg.expand().invert().toString().replace(/2'/g, '2');
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

export function parseTriggers(movesStr: string): TriggerChunk[] {
  const moves = tokenizeAlgMoves(movesStr);
  if (moves.length === 0) return [];

  const chunks: TriggerChunk[] = [];
  let i = 0;

  while (i < moves.length) {
    const pattern = findLongestPatternAt(moves, i);
    if (pattern) {
      chunks.push({
        text: pattern.pattern,
        name: pattern.chunkName,
        description: pattern.description,
        type: pattern.type,
      });
      i += pattern.tokens.length;
      continue;
    }

    const palindromeLen = findLongestPalindromeFrom(moves, i);
    if (palindromeLen > 0) {
      chunks.push({
        text: moves.slice(i, i + palindromeLen).join(' '),
        name: 'Palindrome Substring',
        description: 'Symmetrical move sequence reading identical forwards and backwards.',
        type: 'palindrome',
      });
      i += palindromeLen;
      continue;
    }

    chunks.push({ text: moves[i], type: 'normal' });
    i += 1;
  }

  return chunks;
}

export function detectAlgBadges(movesStr: string): string[] {
  return detectTokenAlignedBadges(movesStr);
}

export function formatTime(ms: number): string {
  if (ms < 0) return '0.000';
  const seconds = Math.floor(ms / 1000);
  const remainderMs = Math.floor(ms % 1000);
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;

  const msStr = remainderMs.toString().padStart(3, '0').slice(0, 2);
  if (minutes > 0) {
    return `${minutes}:${remSec.toString().padStart(2, '0')}.${msStr}`;
  }
  return `${remSec}.${msStr}`;
}

export function calculateAO(times: number[], count: number): number | null {
  if (times.length < count) return null;
  const recent = times.slice(0, count);
  const dnfCount = recent.filter(t => t < 0).length;
  if (dnfCount >= 2) return -1;

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
