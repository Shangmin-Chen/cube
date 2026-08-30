import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Shuffle } from 'lucide-react';
import { parseMoveString, generateScramble } from '../utils/cubeLogic';

// Notion Dark Aligned 3D Palette
const COLOR_CODES = {
  U: 0xeab308, // Notion Warm Yellow (Top)
  D: 0xf3f0e8, // Warm Cream White (Bottom)
  F: 0x22c55e, // Emerald Green (Front)
  B: 0x6366f1, // Indigo Blue (Back)
  R: 0xef4444, // Crimson Red (Right)
  L: 0xf97316, // Warm Orange (Left)
  INNER: 0x191919, // Notion Dark Inner Plastic (#191919)
  DIM_SURFACE: 0x2d2d2d, // Muted Notion Border Gray (#2d2d2d)
};

interface RubiksCube3DProps {
  initialAlgorithm?: string;
  autoPlay?: boolean;
  highlightMode?: 'all' | 'cross' | 'f2l' | 'oll' | 'pll';
  showControls?: boolean;
  size?: string;
}

export const RubiksCube3D: React.FC<RubiksCube3DProps> = ({
  initialAlgorithm = '',
  autoPlay = false,
  highlightMode = 'all',
  showControls = true,
  size = 'h-[360px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const cubiesRef = useRef<THREE.Mesh[]>([]);
  const isAnimatingRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(400); // ms per move

  // Parse move string whenever initialAlgorithm changes
  useEffect(() => {
    resetCubiePositions();
    if (initialAlgorithm) {
      const parsed = parseMoveString(initialAlgorithm);
      setMoves(parsed);
      setCurrentMoveIndex(0);
      setIsPlaying(autoPlay);
    } else {
      setMoves([]);
      setCurrentMoveIndex(0);
      setIsPlaying(false);
    }
  }, [initialAlgorithm, autoPlay]);

  // Safely stop animations & detach pivot cubies back to cube group
  const stopActiveAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (pivotRef.current && cubeGroupRef.current) {
      const children = [...pivotRef.current.children];
      children.forEach(child => {
        cubeGroupRef.current?.attach(child);
      });
      sceneRef.current?.remove(pivotRef.current);
      pivotRef.current = null;
    }

    isAnimatingRef.current = false;
  };

  // Reset 3D cubies to initial solved layout
  const resetCubiePositions = () => {
    stopActiveAnimation();
    cubiesRef.current.forEach(cubie => {
      if (cubie.userData.origPos) {
        cubie.position.copy(cubie.userData.origPos);
        cubie.quaternion.identity();
        cubie.updateMatrix();
        cubie.updateMatrixWorld(true);
      }
    });
  };

  // Set up Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(4.5, 4.5, 6.5);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Notion Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfffbeb, 1.0);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd4d4d4, 0.4);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Main Cube Group
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    cubeGroupRef.current = cubeGroup;

    // Shared geometry instance to optimize GPU memory
    const cubieSize = 0.95;
    const sharedBoxGeometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const sharedEdgesGeometry = new THREE.EdgesGeometry(sharedBoxGeometry);

    // Create 27 Cubies
    const cubies: THREE.Mesh[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const isTargetLayer =
            highlightMode === 'all' ||
            (highlightMode === 'oll' && y === 1) ||
            (highlightMode === 'pll' && y === 1) ||
            (highlightMode === 'cross' && y === -1) ||
            (highlightMode === 'f2l' && y <= 0);

          const plasticColor = isTargetLayer ? COLOR_CODES.INNER : COLOR_CODES.DIM_SURFACE;

          // Face material mapping (Standard 3D Camera Front = +Z)
          const materials: THREE.MeshStandardMaterial[] = [
            new THREE.MeshStandardMaterial({
              color: x === 1 && isTargetLayer ? COLOR_CODES.R : plasticColor,
              roughness: 0.35,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: x === -1 && isTargetLayer ? COLOR_CODES.L : plasticColor,
              roughness: 0.35,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: y === 1 && isTargetLayer ? COLOR_CODES.U : plasticColor,
              roughness: 0.35,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: y === -1 && isTargetLayer ? COLOR_CODES.D : plasticColor,
              roughness: 0.35,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: z === 1 && isTargetLayer ? COLOR_CODES.F : plasticColor, // Front (+Z)
              roughness: 0.35,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: z === -1 && isTargetLayer ? COLOR_CODES.B : plasticColor, // Back (-Z)
              roughness: 0.35,
              metalness: 0.05,
            }),
          ];

          if (!isTargetLayer) {
            materials.forEach(mat => {
              mat.transparent = true;
              mat.opacity = 0.3;
            });
          }

          const cubie = new THREE.Mesh(sharedBoxGeometry, materials);
          cubie.position.set(x, y, z);
          cubie.userData = { origPos: new THREE.Vector3(x, y, z) };

          // Add crisp Notion border wireframes to each cubie
          const lineMaterial = new THREE.LineBasicMaterial({
            color: isTargetLayer ? 0x2d2d2d : 0x383838,
            linewidth: 1,
          });
          const wireframe = new THREE.LineSegments(sharedEdgesGeometry, lineMaterial);
          wireframe.userData = { isWireframe: true };
          cubie.add(wireframe);

          cubeGroup.add(cubie);
          cubies.push(cubie);
        }
      }
    }
    cubiesRef.current = cubies;
    isAnimatingRef.current = false;

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Unmount Cleanup: Dispose GPU Geometries & Materials
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      stopActiveAnimation();

      sharedBoxGeometry.dispose();
      sharedEdgesGeometry.dispose();

      cubies.forEach(cubie => {
        if (Array.isArray(cubie.material)) {
          cubie.material.forEach(m => m.dispose());
        }
        cubie.children.forEach(child => {
          if (child instanceof THREE.LineSegments) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [highlightMode]);

  // Snap position & quaternion to exact 90-degree grid to prevent drift
  const snapCubieTransform = (cubie: THREE.Mesh) => {
    cubie.position.x = Math.round(cubie.position.x);
    cubie.position.y = Math.round(cubie.position.y);
    cubie.position.z = Math.round(cubie.position.z);

    const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion, 'XYZ');
    const halfPi = Math.PI / 2;
    euler.x = Math.round(euler.x / halfPi) * halfPi;
    euler.y = Math.round(euler.y / halfPi) * halfPi;
    euler.z = Math.round(euler.z / halfPi) * halfPi;
    cubie.quaternion.setFromEuler(euler);

    cubie.updateMatrix();
    cubie.updateMatrixWorld(true);
  };

  // Execute a single move animation on 3D cube
  const animateMove = (move: string, reverse: boolean = false): Promise<void> => {
    return new Promise(resolve => {
      if (!cubeGroupRef.current || isAnimatingRef.current) {
        resolve();
        return;
      }

      isAnimatingRef.current = true;
      const face = move[0].toUpperCase();
      const isPrime = move.includes("'");
      const isDouble = move.includes('2');

      let angle = isDouble ? Math.PI : Math.PI / 2;
      if (isPrime) angle = -angle;
      if (reverse) angle = -angle;

      let axis = new THREE.Vector3(0, 1, 0);
      let condition = (p: THREE.Vector3) => Math.round(p.y) === 1;

      switch (face) {
        case 'U':
          axis = new THREE.Vector3(0, 1, 0);
          condition = p => Math.round(p.y) === 1;
          angle = -angle;
          break;
        case 'D':
          axis = new THREE.Vector3(0, 1, 0);
          condition = p => Math.round(p.y) === -1;
          break;
        case 'R':
          axis = new THREE.Vector3(1, 0, 0);
          condition = p => Math.round(p.x) === 1;
          angle = -angle;
          break;
        case 'L':
          axis = new THREE.Vector3(1, 0, 0);
          condition = p => Math.round(p.x) === -1;
          break;
        case 'F':
          axis = new THREE.Vector3(0, 0, 1);
          condition = p => Math.round(p.z) === 1;
          angle = -angle;
          break;
        case 'B':
          axis = new THREE.Vector3(0, 0, 1);
          condition = p => Math.round(p.z) === -1;
          break;
        default:
          isAnimatingRef.current = false;
          resolve();
          return;
      }

      const pivot = new THREE.Group();
      pivotRef.current = pivot;
      sceneRef.current?.add(pivot);

      const movingCubies: THREE.Mesh[] = [];
      cubiesRef.current.forEach(cubie => {
        const worldPos = new THREE.Vector3();
        cubie.getWorldPosition(worldPos);
        if (condition(worldPos)) {
          pivot.attach(cubie);
          movingCubies.push(cubie);
        }
      });

      const startTime = performance.now();
      const animDuration = Math.min(speed * 0.85, 300);

      const updateRotation = () => {
        const now = performance.now();
        const rawProgress = Math.min((now - startTime) / animDuration, 1);
        // Smooth Sine Easing
        const easedProgress = Math.sin((rawProgress * Math.PI) / 2);
        const currentAngle = angle * easedProgress;

        if (pivotRef.current) {
          pivotRef.current.setRotationFromAxisAngle(axis, currentAngle);
        }

        if (rawProgress < 1) {
          animFrameRef.current = requestAnimationFrame(updateRotation);
        } else {
          if (pivotRef.current) {
            pivotRef.current.setRotationFromAxisAngle(axis, angle);
            pivotRef.current.updateMatrixWorld();
          }

          movingCubies.forEach(cubie => {
            cubeGroupRef.current?.attach(cubie);
            snapCubieTransform(cubie);
          });

          if (pivotRef.current) {
            sceneRef.current?.remove(pivotRef.current);
            pivotRef.current = null;
          }

          animFrameRef.current = null;
          isAnimatingRef.current = false;
          resolve();
        }
      };

      animFrameRef.current = requestAnimationFrame(updateRotation);
    });
  };

  // Step Controls
  const handleNextMove = async () => {
    if (currentMoveIndex < moves.length && !isAnimatingRef.current) {
      const move = moves[currentMoveIndex];
      await animateMove(move, false);
      setCurrentMoveIndex(prev => prev + 1);
    }
  };

  const handlePrevMove = async () => {
    if (currentMoveIndex > 0 && !isAnimatingRef.current) {
      const move = moves[currentMoveIndex - 1];
      await animateMove(move, true);
      setCurrentMoveIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMoveIndex(0);
    resetCubiePositions();
  };

  const handleScrambleNew = () => {
    const newScramble = generateScramble(21);
    const parsed = parseMoveString(newScramble);
    setMoves(parsed);
    setCurrentMoveIndex(0);
    setIsPlaying(false);
    resetCubiePositions();
  };

  // Auto-play interval
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isPlaying && currentMoveIndex < moves.length && !isAnimatingRef.current) {
      timeoutId = setTimeout(async () => {
        await handleNextMove();
      }, speed);
    } else if (currentMoveIndex >= moves.length) {
      setIsPlaying(false);
    }

    return () => clearTimeout(timeoutId);
  }, [isPlaying, currentMoveIndex, moves, speed]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full bg-[#202020] rounded-xl border border-[#2d2d2d] p-4 shadow-none">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className={`w-full ${size} cursor-default select-none`} />

      {/* Current Scramble/Algorithm Display */}
      {moves.length > 0 && (
        <div className="w-full flex items-center justify-between bg-[#191919] border border-[#2d2d2d] rounded-lg px-4 py-2 mt-2 font-mono text-sm">
          <div className="flex flex-wrap gap-1.5 items-center max-w-[80%]">
            {moves.map((m, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  idx === currentMoveIndex
                    ? 'bg-[#eab308] text-black font-bold border border-[#eab308]'
                    : idx < currentMoveIndex
                    ? 'text-[#888888] line-through'
                    : 'text-[#d4d4d4]'
                }`}
              >
                {m}
              </span>
            ))}
          </div>
          <span className="text-xs text-[#888888] font-sans">
            {currentMoveIndex} / {moves.length}
          </span>
        </div>
      )}

      {/* Control Buttons */}
      {showControls && (
        <div className="flex items-center justify-between w-full mt-3 gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-[#d4d4d4] transition-colors"
              title="Reset Cube"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleScrambleNew}
              className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-[#d4d4d4] text-xs font-medium flex items-center gap-1 transition-colors"
              title="Generate New Scramble"
            >
              <Shuffle className="w-3.5 h-3.5" /> Scramble
            </button>
          </div>

          {moves.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMove}
                disabled={currentMoveIndex === 0}
                className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] disabled:opacity-40 border border-[#383838] text-[#d4d4d4] transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-lg bg-[#eab308] hover:bg-[#facc15] text-black font-semibold transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
              </button>

              <button
                type="button"
                onClick={handleNextMove}
                disabled={currentMoveIndex >= moves.length}
                className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] disabled:opacity-40 border border-[#383838] text-[#d4d4d4] transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Playback speed selector */}
          <div className="flex items-center gap-1 text-xs text-[#888888] font-mono">
            <span>Speed:</span>
            <select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="bg-[#2d2d2d] border border-[#383838] text-[#d4d4d4] rounded px-1.5 py-0.5 text-xs focus:outline-none"
            >
              <option value={700}>Slow</option>
              <option value={400}>Normal</option>
              <option value={200}>Fast</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
