import React from 'react';
import { Award, Zap, Flame, RotateCcw } from 'lucide-react';
import type { AlgCase } from '../../types/cube';
import { AlgDiagram } from '../AlgDiagram';
import { Badge } from '../ui/badge';

interface RoundSummaryProps {
  roundNumber: number;
  totalCards: number;
  masteredCount: number;
  learningCount: number;
  activeQueue: AlgCase[];
  masteredIds: Set<string>;
  totalBaseCount: number;
  onReviewMissed: () => void;
  onRestart: () => void;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  roundNumber,
  totalCards,
  masteredCount,
  learningCount,
  activeQueue,
  masteredIds,
  totalBaseCount,
  onReviewMissed,
  onRestart,
}) => {
  const accuracyPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  return (
    <div className="p-8 flex flex-col items-center gap-6 bg-[#202020] border border-[#2d2d2d] rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-3xl bg-[#eab308]/15 border border-[#eab308]/40 flex items-center justify-center text-[#eab308] shadow-lg">
        <Award className="w-8 h-8 stroke-[2.5]" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eab308]/15 border border-[#eab308]/30 text-[#eab308] text-xs font-bold mx-auto">
          <Zap className="w-3.5 h-3.5" /> Round {roundNumber} Complete
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
          {masteredCount === totalCards
            ? '🎉 Flawless Mastery!'
            : `${masteredCount} of ${totalCards} Mastered`}
        </h2>
        <p className="text-xs text-[#888888] max-w-md">
          {learningCount > 0
            ? `You have ${learningCount} case${learningCount > 1 ? 's' : ''} to reinforce in the next round.`
            : 'You answered every algorithm accurately in this round!'}
        </p>
      </div>

      {/* Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
        <div className="p-3.5 bg-[#141414] rounded-2xl border border-[#2a2a2a] flex flex-col items-center">
          <span className="text-2xl font-mono font-extrabold text-[#4ade80]">{masteredCount}</span>
          <span className="text-[11px] text-[#888888] font-semibold mt-0.5">Mastered</span>
        </div>
        <div className="p-3.5 bg-[#141414] rounded-2xl border border-[#2a2a2a] flex flex-col items-center">
          <span className="text-2xl font-mono font-extrabold text-[#ef4444]">{learningCount}</span>
          <span className="text-[11px] text-[#888888] font-semibold mt-0.5">Still Learning</span>
        </div>
        <div className="p-3.5 bg-[#141414] rounded-2xl border border-[#2a2a2a] flex flex-col items-center col-span-2 sm:col-span-1">
          <span className="text-2xl font-mono font-extrabold text-[#eab308]">{accuracyPercent}%</span>
          <span className="text-[11px] text-[#888888] font-semibold mt-0.5">Accuracy</span>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {learningCount > 0 && (
          <button
            type="button"
            onClick={onReviewMissed}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#eab308] hover:bg-[#facc15] text-black font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>Drill {learningCount} Missed Cases (Round {roundNumber + 1})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] text-white font-semibold text-xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart All {totalBaseCount} Cases</span>
        </button>
      </div>

      {/* Breakdown Review of Cases */}
      <div className="w-full mt-2 flex flex-col gap-2 text-left border-t border-[#2a2a2a] pt-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Round Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
          {activeQueue.map(c => {
            const isMastered = masteredIds.has(c.id);
            return (
              <div
                key={c.id}
                className="p-3 bg-[#141414] rounded-xl border border-[#272727] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 bg-[#1c1c1c] p-1 rounded-lg border border-[#2d2d2d]">
                    <AlgDiagram primaryAlg={c.primaryAlg} category={c.category} size={40} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{c.name}</span>
                    <code className="text-[11px] font-mono text-[#888888]">{c.primaryAlg}</code>
                  </div>
                </div>

                <Badge variant={isMastered ? 'emerald' : 'default'} className="shrink-0 text-[10px]">
                  {isMastered ? 'Mastered' : 'Learning'}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
