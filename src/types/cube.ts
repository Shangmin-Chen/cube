export type FaceColor = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange' | 'gray';

export type AlgCategory = string;

export interface MethodStep {
  id: string;
  label: string;
  description?: string;
}

export interface AlgMethod {
  id: string;
  name: string;
  description?: string;
  steps: MethodStep[];
  cases: AlgCase[];
  isAvailable?: boolean;
}

export interface DeckOption {
  id: string;
  label: string;
  cases: AlgCase[];
}

export interface StepOption {
  id: string;
  label: string;
  description?: string;
  cases: AlgCase[];
}

export interface AlgCase {
  id: string;
  name: string;
  category: AlgCategory;
  subcategory: string; // e.g., '2-Look OLL', 'Full OLL - Cross', '2-Look PLL', 'Full PLL'
  group: string;
  primaryAlg: string;
  alternativeAlgs?: string[];
  setupMoves?: string;
  /**
   * Case probability as a fraction string. Semantics depend on deck type:
   * - **2-look** (e.g. "2/3", "1/6"): unconditional probability within one sub-step; displayed case values plus an implicit skip for that sub-step sum to 1. Multi-sub-step decks (e.g. 2-look PLL) do not sum to 1 across the whole deck.
   * - **Full OLL / Full PLL** (e.g. "1/54", "1/18"): absolute deck-wide probability over all cases in that deck; no sub-step skip term.
   */
  probability?: string;
  description?: string;
  tips?: string;
  why?: string;
  is2Look?: boolean;
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

export interface TriggerChunk {
  text: string;
  name?: string;
  description?: string;
  type: 'sexy' | 'wide-sexy' | 'inverse-sexy' | 'left-sexy' | 'sledge' | 'wide-sledge' | 'hedge' | 'sune' | 'palindrome' | 'normal';
}
