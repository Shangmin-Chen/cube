import { Alg } from 'cubing/alg';
import { randomScrambleForEvent } from 'cubing/scramble';
import {
  detectTokenAlignedBadges,
  findLongestPalindromeFrom,
  findLongestPatternAt,
  tokenizeAlgMoves,
} from './triggerPatterns.ts';

import type { TriggerChunk } from '../types/cube';

export type { TriggerChunk };

/** WCA random-state 3x3 scramble via cubing/scramble. */
export async function generateScramble(): Promise<string> {
  const scramble = await randomScrambleForEvent('333');
  return scramble.toString();
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
    const invertedStr = alg
      .expand()
      .invert()
      .toString()
      .replace(/2'/g, '2')
      .replace(/3'/g, '')
      .replace(/([A-Za-z])3\b/g, "$1'");
    return invertedStr.split(/\s+/).filter(Boolean);
  } catch {
    const parsed = parseMoveString(movesStr);
    const reversed = [...parsed].reverse();
    return reversed.map(move => {
      if (!move) return move;
      const isPrime = move.includes("'");
      const isDouble = move.includes('2');
      const isTriple = move.includes('3');
      const baseMove = move.replace(/['23]/g, '');

      if (isDouble) return `${baseMove}2`;
      // invert of 270° CW (triple) = 90° CW = plain move
      if (isTriple) return baseMove;
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
