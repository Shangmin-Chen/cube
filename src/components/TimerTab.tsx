import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateScramble, formatTime, calculateAO } from '../utils/cubeLogic';
import type { SolveRecord } from '../types/cube';
import { RubiksCube3D } from './RubiksCube3D';
import { Shuffle, Trash2, Award, History, RotateCcw } from 'lucide-react';

export const TimerTab: React.FC = () => {
  const [scramble, setScramble] = useState<string>('');
  const [solves, setSolves] = useState<SolveRecord[]>(() => {
    const saved = localStorage.getItem('cfop_solves');
    return saved ? JSON.parse(saved) : [];
  });

  // Timer states: 'idle' | 'holding' | 'ready' | 'inspection' | 'running'
  const [timerState, setTimerState] = useState<'idle' | 'holding' | 'ready' | 'inspection' | 'running'>('idle');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [useInspection, setUseInspection] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate initial scramble
  useEffect(() => {
    setScramble(generateScramble(21));
  }, []);

  const handleNewScramble = () => {
    setScramble(generateScramble(21));
  };

  // Start actual timer
  const startTimer = useCallback(() => {
    setTimerState('running');
    startTimeRef.current = performance.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(performance.now() - startTimeRef.current);
    }, 10);
  }, []);

  // Stop timer and record solve
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const finalTime = performance.now() - startTimeRef.current;
    setElapsedTime(finalTime);
    setTimerState('idle');

    const newRecord: SolveRecord = {
      id: Date.now().toString(),
      time: Math.round(finalTime),
      scramble,
      date: Date.now(),
      penalty: 'none',
    };

    setSolves(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('cfop_solves', JSON.stringify(updated));
      return updated;
    });

    handleNewScramble();
  }, [scramble]);

  // Keyboard events for spacebar timer control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      e.preventDefault();

      if (timerState === 'running') {
        stopTimer();
      } else if (timerState === 'idle') {
        setTimerState('holding');
        holdTimerRef.current = setTimeout(() => {
          setTimerState('ready');
        }, 300);
      } else if (timerState === 'inspection') {
        startTimer();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();

      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

      if (timerState === 'ready') {
        if (useInspection) {
          setTimerState('inspection');
        } else {
          startTimer();
        }
      } else if (timerState === 'holding') {
        setTimerState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [timerState, useInspection, startTimer, stopTimer]);

  // Handle Solve Penalties (+2 / DNF / Delete)
  const handlePenalty = (id: string, penalty: 'none' | '+2' | 'DNF') => {
    setSolves(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, penalty } : s));
      localStorage.setItem('cfop_solves', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteSolve = (id: string) => {
    setSolves(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('cfop_solves', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (confirm('Clear all solve records?')) {
      setSolves([]);
      localStorage.removeItem('cfop_solves');
    }
  };

  // Stats calculation
  const timesArray = solves.map(s => (s.penalty === 'DNF' ? -1 : s.time + (s.penalty === '+2' ? 2000 : 0)));
  const validTimes = timesArray.filter(t => t > 0);
  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const ao5 = calculateAO(timesArray, 5);
  const ao12 = calculateAO(timesArray, 12);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Top Scramble Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <Shuffle className="w-3.5 h-3.5" /> WCA Official 3x3 Scramble
        </span>
        <div className="text-lg md:text-2xl font-mono font-bold text-white tracking-wide leading-relaxed max-w-3xl">
          {scramble}
        </div>
        <button
          onClick={handleNewScramble}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Scramble
        </button>
      </div>

      {/* Timer Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 3D Scramble Visualizer */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Scramble Preview</h3>
          <RubiksCube3D initialAlgorithm={scramble} autoPlay={false} size="h-[320px]" />
        </div>

        {/* Center: Giant Digital Timer */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800 rounded-3xl p-10 min-h-[340px] relative select-none">
          {/* Inspection Mode Toggle */}
          <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              id="inspection"
              checked={useInspection}
              onChange={e => setUseInspection(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <label htmlFor="inspection" className="cursor-pointer">15s Inspection</label>
          </div>

          <div
            className={`font-mono text-6xl md:text-8xl font-extrabold tracking-tight transition-colors ${
              timerState === 'ready'
                ? 'text-emerald-400 scale-105'
                : timerState === 'holding'
                ? 'text-amber-400'
                : timerState === 'running'
                ? 'text-white'
                : 'text-slate-200'
            }`}
          >
            {formatTime(elapsedTime)}
          </div>

          {/* Status Instruction */}
          <p className="text-xs font-medium text-slate-400 mt-6 tracking-wider uppercase">
            {timerState === 'idle' && 'Press and Hold Spacebar (or Touch Screen) to Ready'}
            {timerState === 'holding' && 'Hold...'}
            {timerState === 'ready' && 'Release Spacebar to Start!'}
            {timerState === 'running' && 'Press Spacebar to Stop'}
          </p>
        </div>
      </div>

      {/* Bottom Section: Stats & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        {/* Statistics Dashboard */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Stats Overview
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-500 font-semibold block">Total Solves</span>
              <span className="text-xl font-bold font-mono text-white">{solves.length}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-500 font-semibold block">Best Time</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {bestTime ? formatTime(bestTime) : '-'}
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-500 font-semibold block">Ao5</span>
              <span className="text-xl font-bold font-mono text-indigo-400">
                {ao5 ? (ao5 === -1 ? 'DNF' : formatTime(ao5)) : '-'}
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-500 font-semibold block">Ao12</span>
              <span className="text-xl font-bold font-mono text-purple-400">
                {ao12 ? (ao12 === -1 ? 'DNF' : formatTime(ao12)) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Solve History Table */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" /> Solve History
            </h3>
            {solves.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1">
            {solves.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No solve records yet. Hold spacebar to solve!</div>
            ) : (
              solves.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono text-xs w-6">#{solves.length - idx}</span>
                    <span className="font-mono font-bold text-sm text-amber-300">
                      {s.penalty === 'DNF' ? 'DNF' : formatTime(s.time + (s.penalty === '+2' ? 2000 : 0))}
                    </span>
                    <span className="text-slate-500 font-mono truncate max-w-[240px] hidden md:inline">
                      {s.scramble}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePenalty(s.id, s.penalty === '+2' ? 'none' : '+2')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        s.penalty === '+2' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      +2
                    </button>
                    <button
                      onClick={() => handlePenalty(s.id, s.penalty === 'DNF' ? 'none' : 'DNF')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        s.penalty === 'DNF' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      DNF
                    </button>
                    <button
                      onClick={() => handleDeleteSolve(s.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
