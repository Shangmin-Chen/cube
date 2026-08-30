import React from 'react';

interface AlgDiagramProps {
  topGrid?: string[]; // 9 items: 'Y' (Yellow) or 'G' (Gray)
  borderColors?: {
    top: string[];
    right: string[];
    bottom: string[];
    left: string[];
  };
  size?: number;
  title?: string;
}

export const AlgDiagram: React.FC<AlgDiagramProps> = ({
  topGrid = ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
  borderColors = {
    top: ['G', 'G', 'G'],
    right: ['G', 'G', 'G'],
    bottom: ['G', 'G', 'G'],
    left: ['G', 'G', 'G'],
  },
  size = 120,
  title,
}) => {
  const COLOR_MAP: Record<string, string> = {
    Y: '#facc15', // Yellow
    G: '#334155', // Slate gray (unoriented/dim)
    W: '#f8fafc', // White
    R: '#ef4444', // Red
    O: '#f97316', // Orange
    B: '#3b82f6', // Blue
    G_GREEN: '#22c55e', // Green
  };

  const getColor = (code: string) => COLOR_MAP[code] || '#334155';

  const innerSize = size * 0.7;
  const offset = (size - innerSize) / 2;
  const cellSize = innerSize / 3;
  const borderThickness = offset * 0.7;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible drop-shadow-md">
        {/* Outer background frame */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={6}
          fill="#0f172a"
          stroke="#1e293b"
          strokeWidth={2}
        />

        {/* Top Border Stickers */}
        {borderColors.top.map((c, i) => (
          <rect
            key={`top-${i}`}
            x={offset + i * cellSize + 2}
            y={offset - borderThickness - 2}
            width={cellSize - 4}
            height={borderThickness}
            rx={2}
            fill={getColor(c)}
            stroke="#090d16"
            strokeWidth={1}
          />
        ))}

        {/* Bottom Border Stickers */}
        {borderColors.bottom.map((c, i) => (
          <rect
            key={`bottom-${i}`}
            x={offset + i * cellSize + 2}
            y={offset + innerSize + 2}
            width={cellSize - 4}
            height={borderThickness}
            rx={2}
            fill={getColor(c)}
            stroke="#090d16"
            strokeWidth={1}
          />
        ))}

        {/* Left Border Stickers */}
        {borderColors.left.map((c, i) => (
          <rect
            key={`left-${i}`}
            x={offset - borderThickness - 2}
            y={offset + i * cellSize + 2}
            width={borderThickness}
            height={cellSize - 4}
            rx={2}
            fill={getColor(c)}
            stroke="#090d16"
            strokeWidth={1}
          />
        ))}

        {/* Right Border Stickers */}
        {borderColors.right.map((c, i) => (
          <rect
            key={`right-${i}`}
            x={offset + innerSize + 2}
            y={offset + i * cellSize + 2}
            width={borderThickness}
            height={cellSize - 4}
            rx={2}
            fill={getColor(c)}
            stroke="#090d16"
            strokeWidth={1}
          />
        ))}

        {/* Top Face 3x3 Grid */}
        {topGrid.map((c, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          return (
            <rect
              key={`grid-${index}`}
              x={offset + col * cellSize + 2}
              y={offset + row * cellSize + 2}
              width={cellSize - 4}
              height={cellSize - 4}
              rx={3}
              fill={getColor(c)}
              stroke="#090d16"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      {title && <span className="text-xs text-slate-400 mt-2 font-medium">{title}</span>}
    </div>
  );
};
