import React from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import { DECK_DEFINITIONS, type DeckId } from '../../services/algService';

interface TrainerDeckSelectorProps {
  selectedDeck: DeckId;
  bookmarkedCount: number;
  isShuffled: boolean;
  onSelectDeck: (deckId: DeckId) => void;
  onToggleShuffle: () => void;
  onRestart: () => void;
}

export const TrainerDeckSelector: React.FC<TrainerDeckSelectorProps> = ({
  selectedDeck,
  bookmarkedCount,
  isShuffled,
  onSelectDeck,
  onToggleShuffle,
  onRestart,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1e1e1e] p-2 rounded-2xl border border-[#2d2d2d] shadow-sm">
      {/* Deck Category Pills */}
      <div className="flex flex-wrap items-center gap-1">
        {DECK_DEFINITIONS.map(deck => {
          const count = deck.getCount(bookmarkedCount);
          const isSelected = selectedDeck === deck.id;
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
              title={deck.description}
            >
              <span>{deck.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isSelected ? 'bg-[#eab308] text-black font-black' : 'bg-[#141414] text-[#737373]'
                }`}
              >
                {count}
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
