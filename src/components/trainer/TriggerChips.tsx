import React from 'react';
import { parseTriggers } from '../../utils/cubeLogic';
import {
  NO_RECOGNIZED_TRIGGERS_HINT,
  NO_RECOGNIZED_TRIGGERS_HINT_CLASS,
} from '../../utils/triggerHints';

interface TriggerChipsProps {
  algorithm: string;
}

export const TriggerChips: React.FC<TriggerChipsProps> = ({ algorithm }) => {
  const chunks = parseTriggers(algorithm);
  const recognized = chunks.some(chunk => chunk.type !== 'normal');

  return (
    <div className="flex flex-wrap items-center gap-1.5 my-1">
      {!recognized && chunks.length > 0 && (
        <span className={NO_RECOGNIZED_TRIGGERS_HINT_CLASS}>
          {NO_RECOGNIZED_TRIGGERS_HINT}
        </span>
      )}
      {chunks.map((chunk, idx) => {
        if (
          chunk.type === 'sexy' ||
          chunk.type === 'wide-sexy' ||
          chunk.type === 'inverse-sexy' ||
          chunk.type === 'left-sexy'
        ) {
          return (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/40 text-[#a5b4fc] font-mono font-bold text-xs shadow-sm"
              title={chunk.description}
            >
              {chunk.text}
              <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
            </span>
          );
        }
        if (chunk.type === 'sledge' || chunk.type === 'wide-sledge') {
          return (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#fca5a5] font-mono font-bold text-xs shadow-sm"
              title={chunk.description}
            >
              {chunk.text}
              <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
            </span>
          );
        }
        if (chunk.type === 'hedge') {
          return (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#86efac] font-mono font-bold text-xs shadow-sm"
              title={chunk.description}
            >
              {chunk.text}
              <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
            </span>
          );
        }
        if (chunk.type === 'sune') {
          return (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#eab308]/15 border border-[#eab308]/40 text-[#fde047] font-mono font-bold text-xs shadow-sm"
              title={chunk.description}
            >
              {chunk.text}
              <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
            </span>
          );
        }
        if (chunk.type === 'palindrome') {
          return (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[#ec4899]/15 border border-[#ec4899]/40 text-[#f9a8d4] font-mono font-bold text-xs shadow-sm"
              title={chunk.description}
            >
              {chunk.text}
              <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
            </span>
          );
        }
        return (
          <span key={idx} className="font-mono text-xs text-[#e5e5e5] font-semibold px-1 py-1">
            {chunk.text}
          </span>
        );
      })}
    </div>
  );
};
