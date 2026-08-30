export type FaceColor = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange' | 'gray';

export type AlgCategory = 'cross' | 'f2l' | 'oll' | 'pll';

export interface AlgCase {
  id: string;
  name: string;
  category: AlgCategory;
  subcategory: string; // e.g., '2-Look OLL', 'Full OLL - Cross', '2-Look PLL', 'Full PLL'
  group: string;
  primaryAlg: string;
  alternativeAlgs?: string[];
  setupMoves?: string;
  probability?: string;
  description?: string;
  tips?: string;
  why?: string;
  is2Look?: boolean;
  // Visual representation for 2D diagram (top layer 3x3 + borders)
  // topGrid: 9 colors ('Y' or 'G')
  // borders: top (3), right (3), bottom (3), left (3) colors ('Y', 'B', 'R', 'G', 'O', 'G')
  topGrid?: string[]; // array of 9 strings (e.g. ['Y', 'Y', 'G', ...])
  borderColors?: {
    top: string[];    // 3 colors
    right: string[];  // 3 colors
    bottom: string[]; // 3 colors
    left: string[];   // 3 colors
  };
}

export interface SolveRecord {
  id: string;
  time: number; // in milliseconds
  scramble: string;
  date: number; // timestamp
  penalty?: 'none' | '+2' | 'DNF';
  notes?: string;
  session?: string;
}

export interface TrainerSessionStats {
  caseId: string;
  times: number[];
  mastered: boolean;
}
