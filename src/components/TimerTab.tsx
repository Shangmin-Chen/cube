import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { generateScramble, formatTime, calculateAO, invertMoveString } from '../utils/cubeLogic';
import type { SolveRecord } from '../types/cube';
import { RubiksCube3D } from './RubiksCube3D';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Shuffle, Trash2, Award, History, RotateCcw } from 'lucide-react';

const INSPECTION_LIMIT_MS = 15000;
const INSPECTION_DNF_MS = 17000;

function createSolveId(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function formatInspectionTime(elapsedMs: number): string {
  if (elapsedMs < INSPECTION_LIMIT_MS) {
    return formatTime(INSPECTION_LIMIT_MS - elapsedMs);
  }
  return `+${formatTime(elapsedMs - INSPECTION_LIMIT_MS)}`;
}

function inspectionPenaltyForElapsed(elapsedMs: number): 'none' | '+2' | 'DNF' {
  if (elapsedMs >= INSPECTION_DNF_MS) return 'DNF';
  if (elapsedMs >= INSPECTION_LIMIT_MS) return '+2';
  return 'none';
}

function shouldLetNativeSpaceThrough(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON';
}

export const TimerTab: React.FC = () => {
  const [scramble, setScramble] = useState<string>(() => generateScramble(21));
  const [solves, setSolves] = useState<SolveRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cfop_solves');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Timer states: 'idle' | 'holding' | 'ready' | 'inspection' | 'running'
  const [timerState, setTimerState] = useState<'idle' | 'holding' | 'ready' | 'inspection' | 'running'>('idle');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [inspectionElapsed, setInspectionElapsed] = useState<number>(0);
  const [useInspection, setUseInspection] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inspectionStartRef = useRef<number>(0);
  const inspectionPenaltyRef = useRef<'none' | '+2' | 'DNF'>('none');
  const inspectionActiveRef = useRef(false);
  const timerStateRef = useRef(timerState);
  const activePointerIdRef = useRef<number | null>(null);
  const spaceHoldActiveRef = useRef(false);
  const scrambleRef = useRef(scramble);
  const attemptScrambleRef = useRef('');

  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    scrambleRef.current = scramble;
  }, [scramble]);

  const scramblePreviewAlgorithm = useMemo(
    () => (scramble ? invertMoveString(scramble).join(' ') : ''),
    [scramble]
  );

  const persistSolves = useCallback((updated: SolveRecord[]) => {
    try {
      localStorage.setItem('cfop_solves', JSON.stringify(updated));
    } catch {
      // Fallback
    }
  }, []);

  const appendSolve = useCallback(
    (record: Omit<SolveRecord, 'id'> & { id?: string }) => {
      const newRecord: SolveRecord = {
        ...record,
        id: record.id ?? createSolveId(),
      };
      setSolves(prev => {
        const updated = [newRecord, ...prev];
        persistSolves(updated);
        return updated;
      });
    },
    [persistSolves]
  );

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    };
  }, []);


  const handleNewScramble = useCallback(() => {
    setScramble(generateScramble(21));
  }, []);

  const clearInspectionTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  const recordInspectionDnf = useCallback(() => {
    if (!inspectionActiveRef.current) return;
    inspectionActiveRef.current = false;
    timerStateRef.current = 'idle';

    clearInspectionTimer();
    inspectionPenaltyRef.current = 'none';
    setInspectionElapsed(0);
    setElapsedTime(0);
    setTimerState('idle');
    const recordedScramble = attemptScrambleRef.current || scrambleRef.current;
    attemptScrambleRef.current = '';
    appendSolve({
      time: 0,
      scramble: recordedScramble,
      date: Date.now(),
      penalty: 'DNF',
    });
    handleNewScramble();
  }, [appendSolve, clearInspectionTimer, handleNewScramble]);

  const beginInspection = useCallback(() => {
    clearInspectionTimer();
    inspectionActiveRef.current = true;
    attemptScrambleRef.current = scrambleRef.current;
    inspectionPenaltyRef.current = 'none';
    inspectionStartRef.current = performance.now();
    setInspectionElapsed(0);
    setElapsedTime(0);
    timerStateRef.current = 'inspection';
    setTimerState('inspection');

    inspectionIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - inspectionStartRef.current;
      setInspectionElapsed(elapsed);
      if (inspectionPenaltyForElapsed(elapsed) === 'DNF') {
        recordInspectionDnf();
      }
    }, 10);
  }, [clearInspectionTimer, recordInspectionDnf]);

  // Start actual timer
  const startTimer = useCallback(
    (inspectionPenalty: 'none' | '+2' | 'DNF' = 'none') => {
      inspectionActiveRef.current = false;
      timerStateRef.current = 'running';
      if (!attemptScrambleRef.current) {
        attemptScrambleRef.current = scrambleRef.current;
      }
      clearInspectionTimer();
      inspectionPenaltyRef.current = inspectionPenalty;
      setInspectionElapsed(0);
      setElapsedTime(0);
      setTimerState('running');
      startTimeRef.current = performance.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(performance.now() - startTimeRef.current);
      }, 10);
    },
    [clearInspectionTimer]
  );

  // Stop timer and record solve
  const stopTimer = useCallback(() => {
    if (timerStateRef.current !== 'running') return;
    timerStateRef.current = 'idle';

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const finalTime = performance.now() - startTimeRef.current;
    setElapsedTime(finalTime);
    setTimerState('idle');

    const inspectionPenalty = inspectionPenaltyRef.current;
    inspectionPenaltyRef.current = 'none';

    const recordedScramble = attemptScrambleRef.current || scrambleRef.current;
    attemptScrambleRef.current = '';

    appendSolve({
      time: Math.round(finalTime),
      scramble: recordedScramble,
      date: Date.now(),
      penalty: inspectionPenalty,
    });

    handleNewScramble();
  }, [appendSolve, handleNewScramble]);

  const handleTriggerPress = useCallback(() => {
    const state = timerStateRef.current;

    if (state === 'running') {
      stopTimer();
    } else if (state === 'idle') {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      timerStateRef.current = 'holding';
      setTimerState('holding');
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        timerStateRef.current = 'ready';
        setTimerState('ready');
      }, 300);
    } else if (state === 'inspection') {
      if (!inspectionActiveRef.current) return;

      const elapsed = performance.now() - inspectionStartRef.current;
      const penalty = inspectionPenaltyForElapsed(elapsed);
      if (penalty === 'DNF') {
        recordInspectionDnf();
        return;
      }
      startTimer(penalty);
    }
  }, [recordInspectionDnf, startTimer, stopTimer]);

  const handleTriggerRelease = useCallback(() => {
    const state = timerStateRef.current;

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    if (state === 'ready') {
      if (useInspection) {
        beginInspection();
      } else {
        startTimer();
      }
    } else if (state === 'holding') {
      timerStateRef.current = 'idle';
      setTimerState('idle');
    }
  }, [beginInspection, startTimer, useInspection]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (spaceHoldActiveRef.current) return;
      if (activePointerIdRef.current !== null) return;
      activePointerIdRef.current = e.pointerId;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      handleTriggerPress();
    },
    [handleTriggerPress]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (spaceHoldActiveRef.current) return;
      if (activePointerIdRef.current !== e.pointerId) return;
      activePointerIdRef.current = null;
      e.preventDefault();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      handleTriggerRelease();
    },
    [handleTriggerRelease]
  );

  // Keyboard events for spacebar timer control (window-level only to avoid double-firing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (activePointerIdRef.current !== null) return;
      if (shouldLetNativeSpaceThrough(e.target) || shouldLetNativeSpaceThrough(document.activeElement)) {
        return;
      }
      e.preventDefault();
      spaceHoldActiveRef.current = true;
      handleTriggerPress();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (!spaceHoldActiveRef.current) return;
      spaceHoldActiveRef.current = false;
      e.preventDefault();
      handleTriggerRelease();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleTriggerPress, handleTriggerRelease]);

  // Handle Solve Penalties (+2 / DNF / Delete)
  const handlePenalty = (id: string, penalty: 'none' | '+2' | 'DNF') => {
    setSolves(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, penalty } : s));
      persistSolves(updated);
      return updated;
    });
  };

  const handleDeleteSolve = (id: string) => {
    setSolves(prev => {
      const updated = prev.filter(s => s.id !== id);
      persistSolves(updated);
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (confirm('Clear all solve records?')) {
      setSolves([]);
      try {
        localStorage.removeItem('cfop_solves');
      } catch {
        // Fallback
      }
    }
  };

  const displayTime =
    timerState === 'inspection' ? formatInspectionTime(inspectionElapsed) : formatTime(elapsedTime);

  const inspectionPenalty = inspectionPenaltyForElapsed(inspectionElapsed);
  const inspectionStatus =
    inspectionPenalty === 'DNF'
      ? 'Inspection over 17s — DNF'
      : inspectionPenalty === '+2'
      ? '+2 penalty if you start now'
      : 'Inspecting... Press Spacebar or Touch to Start Solve!';

  // Stats calculation
  const timesArray = solves.map(s => (s.penalty === 'DNF' ? -1 : s.time + (s.penalty === '+2' ? 2000 : 0)));
  const validTimes = timesArray.filter(t => t > 0);
  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const ao5 = calculateAO(timesArray, 5);
  const ao12 = calculateAO(timesArray, 12);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Top Scramble Banner */}
      <Card className="p-6 flex flex-col items-center gap-4 text-center">
        <Badge variant="amber" className="flex items-center gap-1.5">
          <Shuffle className="w-3.5 h-3.5" /> WCA Official 3x3 Scramble
        </Badge>
        <div className="text-lg md:text-2xl font-mono font-bold text-white tracking-wide leading-relaxed max-w-3xl">
          {scramble}
        </div>
        <button
          type="button"
          aria-label="Generate new WCA scramble"
          onClick={handleNewScramble}
          className="px-4 py-2 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-[#d4d4d4] text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Scramble
        </button>
      </Card>

      {/* Timer Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 3D Scramble Visualizer */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider px-1">Scramble Preview</h3>
          <RubiksCube3D
            initialAlgorithm={scramblePreviewAlgorithm}
            mode="scramble"
            autoPlay={false}
            showControls={false}
            size="h-[320px]"
          />
        </div>

        {/* Center: Digital Timer with Touch & Mouse support */}
        <Card
          role="button"
          tabIndex={0}
          aria-label="Timer press area"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="lg:col-span-7 flex flex-col items-center justify-center p-10 min-h-[340px] relative select-none cursor-pointer outline-none touch-none"
        >
          {/* Inspection Mode Toggle */}
          <div
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            className="absolute top-4 right-4 flex items-center gap-2 text-xs text-[#888888] z-10"
          >
            <input
              type="checkbox"
              id="inspection"
              checked={useInspection}
              onChange={e => setUseInspection(e.target.checked)}
              className="rounded bg-[#191919] border-[#2d2d2d] text-[#eab308] focus:ring-0"
            />
            <label htmlFor="inspection" className="cursor-pointer">15s Inspection</label>
          </div>

          <div
            className={`font-mono text-6xl md:text-8xl font-extrabold tracking-tight transition-colors ${
              timerState === 'ready'
                ? 'text-[#4ade80]'
                : timerState === 'holding'
                ? 'text-[#eab308]'
                : timerState === 'running'
                ? 'text-white'
                : timerState === 'inspection'
                ? 'text-[#eab308]'
                : 'text-[#d4d4d4]'
            }`}
          >
            {displayTime}
          </div>

          {/* Status Instruction */}
          <p className="text-xs font-medium text-[#888888] mt-6 tracking-wider uppercase">
            {timerState === 'idle' && 'Press and Hold Spacebar (or Touch Screen) to Ready'}
            {timerState === 'holding' && 'Hold...'}
            {timerState === 'ready' && 'Release Spacebar to Start!'}
            {timerState === 'inspection' && inspectionStatus}
            {timerState === 'running' && 'Press Spacebar / Touch to Stop'}
          </p>
        </Card>
      </div>

      {/* Bottom Section: Stats & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        {/* Statistics Dashboard */}
        <Card className="lg:col-span-4 flex flex-col gap-4 p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-[#eab308]" /> Stats Overview
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#191919] p-3.5 rounded-lg border border-[#2d2d2d]">
              <span className="text-[11px] text-[#888888] font-semibold block">Total Solves</span>
              <span className="text-xl font-bold font-mono text-white">{solves.length}</span>
            </div>
            <div className="bg-[#191919] p-3.5 rounded-lg border border-[#2d2d2d]">
              <span className="text-[11px] text-[#888888] font-semibold block">Best Time</span>
              <span className="text-xl font-bold font-mono text-[#eab308]">
                {bestTime ? formatTime(bestTime) : '-'}
              </span>
            </div>
            <div className="bg-[#191919] p-3.5 rounded-lg border border-[#2d2d2d]">
              <span className="text-[11px] text-[#888888] font-semibold block">Ao5</span>
              <span className="text-xl font-bold font-mono text-[#818cf8]">
                {ao5 !== null ? (ao5 === -1 ? 'DNF' : formatTime(ao5)) : '-'}
              </span>
            </div>
            <div className="bg-[#191919] p-3.5 rounded-lg border border-[#2d2d2d]">
              <span className="text-[11px] text-[#888888] font-semibold block">Ao12</span>
              <span className="text-xl font-bold font-mono text-[#c084fc]">
                {ao12 !== null ? (ao12 === -1 ? 'DNF' : formatTime(ao12)) : '-'}
              </span>
            </div>
          </div>
        </Card>

        {/* Solve History Table */}
        <Card className="lg:col-span-8 flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-[#818cf8]" /> Solve History
            </h3>
            {solves.length > 0 && (
              <button
                type="button"
                aria-label="Clear all solve records"
                onClick={handleClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1">
            {solves.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#888888]">No solve records yet. Hold spacebar to solve!</div>
            ) : (
              solves.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-[#191919] border border-[#2d2d2d] rounded-lg px-4 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#888888] font-mono text-xs w-6">#{solves.length - idx}</span>
                    <span className="font-mono font-bold text-sm text-[#eab308]">
                      {s.penalty === 'DNF' ? 'DNF' : formatTime(s.time + (s.penalty === '+2' ? 2000 : 0))}
                    </span>
                    <span className="text-[#888888] font-mono truncate max-w-[240px] hidden md:inline">
                      {s.scramble}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={s.penalty === '+2'}
                      aria-label="Toggle +2 penalty"
                      onClick={() => handlePenalty(s.id, s.penalty === '+2' ? 'none' : '+2')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        s.penalty === '+2' ? 'bg-[#eab308] text-black' : 'bg-[#2d2d2d] text-[#888888]'
                      }`}
                    >
                      +2
                    </button>
                    <button
                      type="button"
                      aria-pressed={s.penalty === 'DNF'}
                      aria-label="Toggle DNF penalty"
                      onClick={() => handlePenalty(s.id, s.penalty === 'DNF' ? 'none' : 'DNF')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        s.penalty === 'DNF' ? 'bg-rose-500 text-white' : 'bg-[#2d2d2d] text-[#888888]'
                      }`}
                    >
                      DNF
                    </button>
                    <button
                      type="button"
                      aria-label="Delete solve record"
                      title="Delete solve record"
                      onClick={() => handleDeleteSolve(s.id)}
                      className="p-1 text-[#888888] hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
