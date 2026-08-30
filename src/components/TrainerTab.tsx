import React, { useState, useMemo } from 'react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import confetti from 'canvas-confetti';
import { Eye, EyeOff, ArrowRight, Brain, Trophy, Star } from 'lucide-react';

export const TrainerTab: React.FC = () => {
  const [selectedSet, setSelectedSet] = useState<'2oll' | '2pll' | 'fullpll'>('2pll');
  const [currentCaseIndex, setCurrentCaseIndex] = useState<number>(0);
  const [showAlg, setShowAlg] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('cfop_trainer_mastered');
    return saved ? JSON.parse(saved) : [];
  });

  const activeCases: AlgCase[] = useMemo(() => {
    if (selectedSet === '2oll') return OLL_2LOOK_CASES;
    if (selectedSet === '2pll') return PLL_2LOOK_CASES;
    return FULL_PLL_CASES;
  }, [selectedSet]);

  const currentCase = activeCases[currentCaseIndex] || activeCases[0];
  const isMastered = masteredIds.includes(currentCase.id);

  const handleNextCase = () => {
    setShowAlg(false);
    setCurrentCaseIndex(prev => (prev + 1) % activeCases.length);
  };

  const handleToggleMastered = () => {
    setMasteredIds(prev => {
      const next = prev.includes(currentCase.id)
        ? prev.filter(id => id !== currentCase.id)
        : [...prev, currentCase.id];
      localStorage.setItem('cfop_trainer_mastered', JSON.stringify(next));

      if (!prev.includes(currentCase.id)) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      return next;
    });
  };

  const masteredCount = activeCases.filter(c => masteredIds.includes(c.id)).length;
  const progressPercent = Math.round((masteredCount / activeCases.length) * 100);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-4">
      {/* Top Trainer Header & Progress */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" /> Algorithm Flashcard Trainer
          </div>
          <h2 className="text-2xl font-bold text-white">Master Your CFOP Algorithms</h2>
        </div>

        {/* Set selector buttons */}
        <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {(['2oll', '2pll', 'fullpll'] as const).map(setKey => (
            <button
              key={setKey}
              onClick={() => {
                setSelectedSet(setKey);
                setCurrentCaseIndex(0);
                setShowAlg(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSet === setKey
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {setKey === '2oll' ? '2-Look OLL' : setKey === '2pll' ? '2-Look PLL' : 'Full PLL'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Mastery Progress: {masteredCount} / {activeCases.length} Cases
          </span>
          <span className="text-amber-400 font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Flashcard Training Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 3D Interactive Rubik's Cube Representation */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <RubiksCube3D
            initialAlgorithm={currentCase.primaryAlg}
            autoPlay={false}
            highlightMode={currentCase.category}
            size="h-[360px]"
          />
        </div>

        {/* Right: Flashcard Details & Controls */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Case {currentCaseIndex + 1} of {activeCases.length}
            </span>

            <button
              onClick={handleToggleMastered}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isMastered
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Star className={`w-4 h-4 ${isMastered ? 'fill-emerald-400' : ''}`} />
              {isMastered ? 'Mastered' : 'Mark as Mastered'}
            </button>
          </div>

          <div>
            <h3 className="text-3xl font-extrabold text-white">{currentCase.name}</h3>
            <p className="text-slate-400 text-xs mt-1">{currentCase.group} • {currentCase.subcategory}</p>
          </div>

          {/* 2D Diagram */}
          {currentCase.topGrid && (
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 w-fit">
              <AlgDiagram topGrid={currentCase.topGrid} borderColors={currentCase.borderColors} size={90} />
              <span className="text-xs text-slate-400 max-w-[200px]">
                Recognize top sticker pattern before executing the algorithm.
              </span>
            </div>
          )}

          {/* Reveal Algorithm Flashcard Button */}
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Solution Algorithm:</span>
              <button
                onClick={() => setShowAlg(!showAlg)}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {showAlg ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAlg ? 'Hide Algorithm' : 'Reveal Algorithm'}
              </button>
            </div>

            {showAlg ? (
              <code className="text-lg font-mono font-bold text-amber-300 bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 block text-center tracking-wide">
                {currentCase.primaryAlg}
              </code>
            ) : (
              <div
                onClick={() => setShowAlg(true)}
                className="w-full py-4 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900 text-slate-500 hover:text-indigo-300 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
              >
                <Eye className="w-4 h-4" /> Click to Reveal Algorithm
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleNextCase}
              className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              Next Case <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
