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
