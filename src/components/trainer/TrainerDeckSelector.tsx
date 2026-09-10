import React from 'react';
import { Shuffle, RotateCcw, FolderGit2 } from 'lucide-react';
import type { DeckOption, AlgMethod } from '../../types/cube';

interface TrainerDeckSelectorProps {
  decks: DeckOption[];
  selectedDeckId: string;
  isShuffled: boolean;
  selectedMethodId?: string;
  availableMethods?: AlgMethod[];
  onSelectDeck: (deckId: string) => void;
  onSelectMethod?: (methodId: string) => void;
  onToggleShuffle: () => void;
  onRestart: () => void;
}

export const TrainerDeckSelector: React.FC<TrainerDeckSelectorProps> = ({
  decks,
  selectedDeckId,
  isShuffled,
  selectedMethodId,
  availableMethods,
  onSelectDeck,
  onSelectMethod,
  onToggleShuffle,
  onRestart,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1e1e1e] p-2 rounded-2xl border border-[#2d2d2d] shadow-sm">
      {/* Left: Method Selector & Dynamic Deck Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {availableMethods && onSelectMethod && (
          <div className="flex items-center gap-1 bg-[#141414] px-2 py-1 rounded-xl border border-[#2d2d2d] text-xs font-mono mr-1">
            <FolderGit2 className="w-3.5 h-3.5 text-[#eab308]" />
            <span className="text-[#888888]">Method:</span>
            <select
              aria-label="Select CFOP Method"
              value={selectedMethodId}
              onChange={e => onSelectMethod(e.target.value)}
              className="bg-transparent text-[#eab308] font-bold focus:outline-none cursor-pointer text-xs"
            >
              {availableMethods.map(m => (
                <option key={m.id} value={m.id} className="bg-[#202020] text-white">
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {decks.map(deck => {
          const isSelected = selectedDeckId === deck.id;
          return (
            <button
              key={deck.id}
              type="button"
              onClick={() => onSelectDeck(deck.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#2a2a2a] text-[#eab308] border border-[#eab308]/40 shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#252525] border border-transparent'
              }`}
            >
              <span>{deck.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isSelected ? 'bg-[#eab308] text-black font-black' : 'bg-[#141414] text-[#737373]'
                }`}
              >
                {deck.cases.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Controls: Shuffle & Restart */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[#2a2a2a]">
        <button
          type="button"
          onClick={onToggleShuffle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isShuffled
              ? 'bg-[#eab308]/15 border border-[#eab308]/40 text-[#eab308]'
              : 'text-[#888888] hover:text-white hover:bg-[#252525] border border-[#2d2d2d]'
          }`}
          title={isShuffled ? 'Shuffle is ON (Click to toggle)' : 'Shuffle is OFF'}
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle</span>
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#252525] border border-[#2d2d2d] transition-all cursor-pointer"
          title="Restart Deck (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
