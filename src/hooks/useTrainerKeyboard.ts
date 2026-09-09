import { useEffect } from 'react';

interface TrainerKeyboardActions {
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onMastered: () => void;
  onLearning: () => void;
  onToggleBookmark: () => void;
  onRestart: () => void;
  onToggleHint: () => void;
  enabled?: boolean;
}

export function useTrainerKeyboard({
  onFlip,
  onNext,
  onPrev,
  onMastered,
  onLearning,
  onToggleBookmark,
  onRestart,
  onToggleHint,
  enabled = true,
}: TrainerKeyboardActions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes if the user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'Enter':
          e.preventDefault();
          onFlip();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        default:
          break;
      }

      switch (e.key.toLowerCase()) {
        case '1':
        case 'x':
          e.preventDefault();
          onLearning();
          break;
        case '2':
        case 'c':
          e.preventDefault();
          onMastered();
          break;
        case 's':
          e.preventDefault();
          onToggleBookmark();
          break;
        case 'r':
          e.preventDefault();
          onRestart();
          break;
        case 'h':
          e.preventDefault();
          onToggleHint();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onFlip,
    onNext,
    onPrev,
    onMastered,
    onLearning,
    onToggleBookmark,
    onRestart,
    onToggleHint,
  ]);
}
