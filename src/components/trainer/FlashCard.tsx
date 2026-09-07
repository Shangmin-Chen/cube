import React from 'react';
import {
  Bookmark,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Copy,
  CheckCheck,
  Info,
} from 'lucide-react';
import type { AlgCase } from '../../types/cube';
import { AlgDiagram } from '../AlgDiagram';
import { TriggerChips } from './TriggerChips';
import { detectAlgBadges } from '../../utils/cubeLogic';
import { Badge } from '../ui/badge';

interface FlashCardProps {
  currentCase: AlgCase;
  setupScramble: string;
  isFlipped: boolean;
  showHint: boolean;
  isBookmarked: boolean;
  copiedType: 'setup' | 'solve' | null;
  onFlip: () => void;
  onToggleHint: () => void;
  onToggleBookmark: () => void;
  onCopy: (text: string, type: 'setup' | 'solve', e: React.MouseEvent) => void;
}

export const FlashCard: React.FC<FlashCardProps> = ({
  currentCase,
  setupScramble,
  isFlipped,
  showHint,
  isBookmarked,
  copiedType,
  onFlip,
  onToggleHint,
  onToggleBookmark,
  onCopy,
}) => {
  return (
    <div className="perspective-1000 w-full min-h-[460px] md:min-h-[480px] select-none">
      <div
        onClick={onFlip}
        className={`relative w-full h-full min-h-[460px] md:min-h-[480px] transform-style-3d transition-transform duration-500 cursor-pointer rounded-3xl ${
          isFlipped ? 'rotate-x-180' : ''
        }`}
      >
        {/* FRONT FACE (Pattern Recognition & 2D Vector Diagram) */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-[#202020] border border-[#333333] hover:border-[#444444] p-6 flex flex-col justify-between rounded-3xl shadow-2xl transition-colors">
          {/* Front Header */}
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#eab308]/15 border border-[#eab308]/30 text-[#eab308] text-xs font-bold">
                {currentCase.subcategory || 'Recognition'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#181818] border border-[#2d2d2d] text-[#888888] text-[11px] font-medium">
                {currentCase.group}
              </span>
            </div>

            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              {/* Name Hint Toggle */}
              <button
                type="button"
                onClick={onToggleHint}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showHint
                    ? 'bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/40'
                    : 'text-[#888888] hover:text-white bg-[#1a1a1a] border border-[#2d2d2d]'
                }`}
                title="Toggle Name Hint (H)"
              >
                {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
              </button>

              {/* Star Bookmark Button */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onToggleBookmark();
                }}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'text-[#eab308] bg-[#eab308]/15 border border-[#eab308]/30'
                    : 'text-[#888888] hover:text-white bg-[#1a1a1a] border border-[#2d2d2d]'
                }`}
                title={isBookmarked ? 'Remove Bookmark (S)' : 'Save Bookmark (S)'}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#eab308]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Front Center: 2D Pattern Recognition Diagram */}
          <div className="flex flex-col items-center justify-center my-auto py-6">
            <div className="bg-[#141414] p-4 rounded-3xl border border-[#2e2e2e] shadow-inner flex items-center justify-center transition-transform hover:scale-102">
              <AlgDiagram
                primaryAlg={currentCase.primaryAlg}
                category={currentCase.category}
                size={160}
              />
            </div>

            {/* Hint Banner */}
            {showHint && (
              <div className="mt-4 px-4 py-1.5 rounded-full bg-[#181818] border border-[#eab308]/40 text-xs text-[#eab308] font-bold shadow-md animate-in fade-in slide-in-from-bottom-2">
                💡 Case Name: {currentCase.name}
              </div>
            )}
          </div>

          {/* Front Footer */}
          <div className="border-t border-[#2d2d2d] pt-3 flex items-center justify-between text-xs text-[#737373]">
            <span>Identify the pattern and execute the algorithm</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] bg-[#141414] px-3 py-1 rounded-lg border border-[#2d2d2d] text-[#d4d4d4]">
              Press <strong className="text-[#eab308]">Space</strong> to flip
            </span>
          </div>
        </div>

        {/* BACK FACE (Setup Scramble + Solve Formula + Mechanics) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-x-180 bg-[#202020] border border-[#333333] p-6 flex flex-col justify-between rounded-3xl shadow-2xl overflow-y-auto">
          {/* Back Header */}
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-[#eab308]/15 border border-[#eab308]/30 text-[#eab308] text-xs font-bold">
                {currentCase.subcategory}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">{currentCase.name}</h3>
            </div>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onToggleBookmark();
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isBookmarked
                  ? 'text-[#eab308] bg-[#eab308]/15 border border-[#eab308]/30'
                  : 'text-[#888888] hover:text-white bg-[#1a1a1a] border border-[#2d2d2d]'
              }`}
              title={isBookmarked ? 'Remove Bookmark (S)' : 'Save Bookmark (S)'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#eab308]' : ''}`} />
            </button>
          </div>

          {/* Back Body: Setup & Solve Formula */}
          <div className="flex flex-col gap-3 my-auto py-2" onClick={e => e.stopPropagation()}>
            {/* 1. Setup / Scramble Section */}
            <div className="p-3.5 bg-[#171622] rounded-2xl border border-[#818cf8]/30 flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#a5b4fc] uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-[#818cf8]" />
                  <span>Setup Scramble (Inverse Algorithm)</span>
                </div>

                <button
                  type="button"
                  onClick={e => onCopy(setupScramble, 'setup', e)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono text-[#a5b4fc] hover:text-white bg-[#818cf8]/15 border border-[#818cf8]/30 hover:bg-[#818cf8]/25 transition-colors cursor-pointer"
                  title="Copy Setup Scramble"
                >
                  {copiedType === 'setup' ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-[#4ade80]" />
                      <span className="text-[#4ade80]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <code className="text-xs font-mono font-bold text-[#c7d2fe] bg-[#12111c] px-3 py-2 rounded-xl border border-[#2f2b4a] break-all select-all">
                {setupScramble || 'N/A'}
              </code>
              <p className="text-[10px] text-[#71717a]">
                Apply to a solved cube to set up this exact practice state.
              </p>
            </div>

            {/* 2. Solve Algorithm Section */}
            <div className="p-3.5 bg-[#1f1b13] rounded-2xl border border-[#eab308]/30 flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#eab308] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Solve Algorithm & Triggers</span>
                </div>

                <button
                  type="button"
                  onClick={e => onCopy(currentCase.primaryAlg, 'solve', e)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono text-[#eab308] hover:text-white bg-[#eab308]/15 border border-[#eab308]/30 hover:bg-[#eab308]/25 transition-colors cursor-pointer"
                  title="Copy Primary Algorithm"
                >
                  {copiedType === 'solve' ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-[#4ade80]" />
                      <span className="text-[#4ade80]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Color-Coded Building Blocks */}
              <TriggerChips algorithm={currentCase.primaryAlg} />

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {detectAlgBadges(currentCase.primaryAlg).map(badge => (
                  <Badge
                    key={badge}
                    variant={badge === 'Palindrome' ? 'amber' : 'emerald'}
                    className="text-[9px] py-0 px-1.5"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 3. Mechanics / Why it works */}
            {currentCase.why && (
              <div className="px-3.5 py-2.5 bg-[#141414] rounded-xl border border-[#2d2d2d] flex items-start gap-2 text-left">
                <Info className="w-4 h-4 text-[#888888] shrink-0 mt-0.5" />
                <p className="text-xs text-[#a3a3a3] leading-relaxed">{currentCase.why}</p>
              </div>
            )}
          </div>

          {/* Back Footer */}
          <div className="border-t border-[#2d2d2d] pt-3 flex items-center justify-between text-xs text-[#737373]">
            <span>Click card to return to diagram</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] bg-[#141414] px-3 py-1 rounded-lg border border-[#2d2d2d] text-[#d4d4d4]">
              Press <strong className="text-[#eab308]">Space</strong> to flip
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
