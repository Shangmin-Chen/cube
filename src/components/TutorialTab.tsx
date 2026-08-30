import React, { useState } from 'react';
import { RubiksCube3D } from './RubiksCube3D';
import { ChevronRight, Sparkles, Target, Award, Lightbulb, Compass } from 'lucide-react';

export const TutorialTab: React.FC = () => {
  const [activeStep, setActiveStep] = useState<'cross' | 'f2l' | 'oll' | 'pll'>('oll');
  const [showIntuition, setShowIntuition] = useState<boolean>(true);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Intuitive Mechanics & Understanding
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Mastering 2-Look OLL & 2-Look PLL
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
              Understand <i>why</i> the formulas work by tracking F2L pairs and core triggers instead of blindly memorizing letters.
            </p>
          </div>

          <div className="flex gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
            {(['cross', 'f2l', 'oll', 'pll'] as const).map(step => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeStep === step
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Step Explanation & Intuitive Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {activeStep === 'cross' && (
            <div className="flex flex-col gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                  1
                </span>
                <h2 className="text-2xl font-bold text-white">Step 1: The Cross</h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                The Cross forms four edge pieces matching the bottom center (usually White) and aligning them with the adjacent side centers.
              </p>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" /> Pro Tips for a Fast Cross
                </h3>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Solve Cross on Bottom:</strong> Build the cross on the bottom face so you can look ahead to F2L pieces on top.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Use 15s Inspection:</strong> Plan all 4 cross edge moves completely during inspection.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeStep === 'f2l' && (
            <div className="flex flex-col gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                  2
                </span>
                <h2 className="text-2xl font-bold text-white">Step 2: F2L (First 2 Layers)</h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                F2L pairs a bottom corner with its matching middle edge and inserts both into their slot simultaneously.
              </p>
            </div>
          )}

          {activeStep === 'oll' && (
            <div className="flex flex-col gap-6">
              {/* OLL Overview */}
              <div className="flex flex-col gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                      3
                    </span>
                    <h2 className="text-2xl font-bold text-white">Step 3: 2-Look OLL (Orientation)</h2>
                  </div>
                  <button
                    onClick={() => setShowIntuition(!showIntuition)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    {showIntuition ? 'Hide Mechanics' : 'Show Intuition'}
                  </button>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong>OLL goal:</strong> Turn all top stickers Yellow. 2-Look OLL splits 57 cases into 2 simple stages: <strong>Edges (Cross)</strong> and <strong>Corners</strong>.
                </p>
              </div>

              {/* Intuitive Mechanics Breakdown */}
              {showIntuition && (
                <div className="flex flex-col gap-4 bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4" /> Why & How 2-Look OLL Formulas Work
                  </h3>

                  {/* Trigger 1: Edge Orientation */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      1. Edge Flipping Trigger: <code className="text-amber-400 font-mono">F (R U R' U') F'</code>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      • <strong><code className="text-amber-300">F</code> (Lift Slot):</strong> Turns front face 90°, lifting the front F2L edge up so its sticker faces top.<br />
                      • <strong><code className="text-amber-300">R U R' U'</code> (Sexy Move):</strong> Pops out the right F2L pair, shifts top layer, and puts right slot back down.<br />
                      • <strong><code className="text-amber-300">F'</code> (Restore Slot):</strong> Closes the front face.<br />
                      <strong className="text-emerald-400">Result:</strong> Keeps all F2L intact while flipping 2 top edges to yellow!
                    </p>
                  </div>

                  {/* Trigger 2: Corner Orientation (Sune Orbit) */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      2. Corner Twisting Trigger: <code className="text-amber-400 font-mono">R U R' U R U2 R'</code> (Sune)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      • Watch the <strong>Front-Right F2L pair</strong> during Sune:<br />
                      1. <code className="text-amber-300">R U</code>: Lifts pair out and pushes it 90° counter-clockwise.<br />
                      2. <code className="text-amber-300">R' U</code>: Drops empty slot down, pushes pair another 90°.<br />
                      3. <code className="text-amber-300">R U2 R'</code>: Lifts slot back up, spins pair 180° back home, and drops it in!<br />
                      <strong className="text-emerald-400">Result:</strong> The pair completes a 360° orbit around the top layer. Edges stay fixed while 3 corners twist by 120°!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeStep === 'pll' && (
            <div className="flex flex-col gap-6">
              {/* PLL Overview */}
              <div className="flex flex-col gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                      4
                    </span>
                    <h2 className="text-2xl font-bold text-white">Step 4: 2-Look PLL (Permutation)</h2>
                  </div>
                  <button
                    onClick={() => setShowIntuition(!showIntuition)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    {showIntuition ? 'Hide Mechanics' : 'Show Intuition'}
                  </button>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong>PLL goal:</strong> Rearrange pieces so side colors match centers and solve the cube! 2-Look PLL splits 21 cases into <strong>Corner Permutation</strong> (2 algs) and <strong>Edge Permutation</strong> (4 algs).
                </p>
              </div>

              {/* Intuitive Mechanics Breakdown */}
              {showIntuition && (
                <div className="flex flex-col gap-4 bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4" /> Why & How 2-Look PLL Formulas Work
                  </h3>

                  {/* Corner Recognition: Headlights */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      1. Headlights & T-Perm Corner Swap
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      • <strong>Headlights:</strong> Two matching corner stickers on one side (e.g. Red-Red). Hold headlights on the <strong>LEFT</strong>.<br />
                      • <strong>T-Perm Mechanics:</strong> Temporarily breaks 2 F2L slots (`R U R' U'` setup), swaps the right 2 corners, and restores F2L.<br />
                      • <strong>No Headlights?</strong> Run <strong>Y-Perm</strong> to swap diagonal corners!
                    </p>
                  </div>

                  {/* Edge Permutation: U-Perm & H-Perm */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      2. Edge Cycling: U-Perms & M-Slice H-Perm
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      • <strong>U-Perm (<code className="text-amber-300">R U' R U R U R U' R' U' R2</code>):</strong> Cycles 3 top edges through the right slot while keeping the 4 solved corners in place.<br />
                      • <strong>H-Perm (<code className="text-amber-300">M2 U M2 U2 M2 U M2</code>):</strong> Uses slice turns (`M2`) to swap opposite edge pairs simultaneously!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: 3D Interactive Rubik's Cube Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Interactive 3D Step Visualizer
          </h3>
          <RubiksCube3D
            highlightMode={activeStep}
            initialAlgorithm={
              activeStep === 'cross'
                ? "D2 R F L B"
                : activeStep === 'f2l'
                ? "U R U' R'"
                : activeStep === 'oll'
                ? "R U R' U R U2 R'"
                : "R U R' U' R' F R2 U' R' U' R U R' F'"
            }
            autoPlay={false}
            size="h-[380px]"
          />
        </div>
      </div>
    </div>
  );
};
