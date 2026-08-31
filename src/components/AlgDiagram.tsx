import React, { useState } from 'react';
import type { AlgCategory } from '../types/cube';

interface AlgDiagramProps {
  primaryAlg?: string;
  category?: AlgCategory;
  topGrid?: string[];
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
  primaryAlg = "R U R' U R U2 R'",
  category = 'oll',
  size = 120,
  title,
}) => {
  const [imageError, setImageError] = useState(false);

  // Encode move string for VisualCube API endpoint
  const encodedAlg = encodeURIComponent(primaryAlg.replace(/[\(\)\{\}]/g, '').trim());
  const visualCubeStage = category === 'cross' ? 'fl' : category;

  // VisualCube API: Official WCA / SpeedCubeDB 2D vector diagram REST API
  const visualCubeUrl = `https://visualcube.api.cubing.net/visualcube.php?fmt=svg&size=${size * 2}&view=plan&stage=${visualCubeStage}&case=${encodedAlg}`;

  return (
    <div className="flex flex-col items-center">
      <div
        style={{ width: size, height: size }}
        className="relative bg-[#191919] border border-[#2d2d2d] rounded-lg overflow-hidden flex items-center justify-center p-1"
      >
        {!imageError ? (
          <img
            src={visualCubeUrl}
            alt={title || `2D Top-Down Diagram for ${primaryAlg}`}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="text-[10px] text-[#888888] font-mono text-center p-2">
            VisualCube API Diagram
          </div>
        )}
      </div>
      {title && <span className="text-xs text-[#888888] mt-2 font-medium">{title}</span>}
    </div>
  );
};
