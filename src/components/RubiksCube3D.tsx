import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Shuffle } from 'lucide-react';
import { parseMoveString, generateScramble } from '../utils/cubeLogic';

// Cube Colors
const COLOR_CODES = {
  U: 0xffd500, // Yellow (Top)
  D: 0xffffff, // White (Bottom)
  F: 0x009b48, // Green (Front)
  B: 0x0045ad, // Blue (Back)
  R: 0xb71234, // Red (Right)
  L: 0xff5800, // Orange (Left)
  INNER: 0x111827, // Dark slate inner plastic
};

interface RubiksCube3DProps {
  initialAlgorithm?: string;
  autoPlay?: boolean;
  highlightMode?: 'all' | 'cross' | 'f2l' | 'oll' | 'pll';
  interactive?: boolean;
  showControls?: boolean;
  size?: string;
}

export const RubiksCube3D: React.FC<RubiksCube3DProps> = ({
  initialAlgorithm = '',
  autoPlay = false,
  highlightMode = 'all',
  interactive = true,
  showControls = true,
  size = 'h-[360px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const cubiesRef = useRef<THREE.Mesh[]>([]);
  const isAnimatingRef = useRef<boolean>(false);

  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(400); // ms per move

  // Parse move string whenever initialAlgorithm changes
  useEffect(() => {
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Main Cube Group
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    cubeGroupRef.current = cubeGroup;

    // Create 27 Cubies
    const cubies: THREE.Mesh[] = [];
    const geometry = new THREE.BoxGeometry(0.94, 0.94, 0.94);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = [
            new THREE.MeshStandardMaterial({ color: x === 1 ? COLOR_CODES.R : COLOR_CODES.INNER, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: x === -1 ? COLOR_CODES.L : COLOR_CODES.INNER, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: y === 1 ? COLOR_CODES.U : COLOR_CODES.INNER, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: y === -1 ? COLOR_CODES.D : COLOR_CODES.INNER, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: z === 1 ? COLOR_CODES.F : COLOR_CODES.INNER, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: z === -1 ? COLOR_CODES.B : COLOR_CODES.INNER, roughness: 0.2 }),
          ];

          const mesh = new THREE.Mesh(geometry, materials);
          mesh.position.set(x * 1.0, y * 1.0, z * 1.0);
          mesh.userData = { initialPos: new THREE.Vector3(x, y, z) };

          const shouldDim =
            (highlightMode === 'cross' && y !== -1) ||
            (highlightMode === 'f2l' && y === 1) ||
            ((highlightMode === 'oll' || highlightMode === 'pll') && y !== 1);

          if (shouldDim) {
            materials.forEach(mat => {
              mat.transparent = true;
              mat.opacity = 0.35;
            });
          }

          cubeGroup.add(mesh);
          cubies.push(mesh);
        }
      }
    }
    cubiesRef.current = cubies;

    // Orbit Drag Rotation Variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cubeGroupRef.current) return;

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler((deltaMove.y * Math.PI) / 180 * 0.5, (deltaMove.x * Math.PI) / 180 * 0.5, 0, 'XYZ')
      );

      cubeGroupRef.current.quaternion.multiplyQuaternions(deltaRotationQuaternion, cubeGroupRef.current.quaternion);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch support for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !cubeGroupRef.current || e.touches.length === 0) return;
      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.x,
        y: e.touches[0].clientY - previousMousePosition.y,
      };
      const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler((deltaMove.y * Math.PI) / 180 * 0.5, (deltaMove.x * Math.PI) / 180 * 0.5, 0, 'XYZ')
      );
      cubeGroupRef.current.quaternion.multiplyQuaternions(deltaRotationQuaternion, cubeGroupRef.current.quaternion);
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [highlightMode, interactive]);

  // Execute a single move animation on 3D Cubies
  const animateMove = useCallback((moveStr: string, reverse = false): Promise<void> => {
    return new Promise((resolve) => {
      if (!cubeGroupRef.current || isAnimatingRef.current) {
        resolve();
        return;
      }

      isAnimatingRef.current = true;

      const baseMove = moveStr.replace(/['2]/g, '');
      const isDouble = moveStr.includes('2');
      let isPrime = moveStr.includes("'");
      if (reverse) isPrime = !isPrime;

      let axis = new THREE.Vector3(0, 1, 0);
      let angle = (isPrime ? 1 : -1) * (Math.PI / 2) * (isDouble ? 2 : 1);
      let filterFn = (_pos: THREE.Vector3) => true;

      // Map move notation to axis & cubies selection
      switch (baseMove) {
        case 'U':
          axis = new THREE.Vector3(0, 1, 0);
          filterFn = pos => pos.y > 0.5;
          break;
        case 'D':
          axis = new THREE.Vector3(0, -1, 0);
          filterFn = pos => pos.y < -0.5;
          break;
        case 'R':
          axis = new THREE.Vector3(1, 0, 0);
          filterFn = pos => pos.x > 0.5;
          break;
        case 'L':
          axis = new THREE.Vector3(-1, 0, 0);
          filterFn = pos => pos.x < -0.5;
          break;
        case 'F':
          axis = new THREE.Vector3(0, 0, 1);
          filterFn = pos => pos.z > 0.5;
          break;
        case 'B':
          axis = new THREE.Vector3(0, 0, -1);
          filterFn = pos => pos.z < -0.5;
          break;
        case 'M':
          axis = new THREE.Vector3(-1, 0, 0);
          filterFn = pos => Math.abs(pos.x) < 0.5;
          break;
        case 'r':
          axis = new THREE.Vector3(1, 0, 0);
          filterFn = pos => pos.x > -0.5;
          break;
        case 'x':
          axis = new THREE.Vector3(1, 0, 0);
          filterFn = () => true;
          break;
        case 'y':
          axis = new THREE.Vector3(0, 1, 0);
          filterFn = () => true;
          break;
        case 'z':
          axis = new THREE.Vector3(0, 0, 1);
          filterFn = () => true;
          break;
        default:
          isAnimatingRef.current = false;
          resolve();
          return;
      }

      // Group matching cubies under pivot group
      const pivotGroup = new THREE.Group();
      sceneRef.current?.add(pivotGroup);

      const targetCubies: THREE.Mesh[] = [];
      cubiesRef.current.forEach(mesh => {
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        if (filterFn(worldPos)) {
          targetCubies.push(mesh);
        }
      });

      targetCubies.forEach(mesh => pivotGroup.attach(mesh));

      const startTime = performance.now();
      const duration = speed * 0.7;

      const animateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = angle * progress;

        pivotGroup.setRotationFromAxisAngle(axis, currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          // Finalize rotation matrix
          pivotGroup.setRotationFromAxisAngle(axis, angle);
          pivotGroup.updateMatrixWorld();

          targetCubies.forEach(mesh => {
            cubeGroupRef.current?.attach(mesh);
            mesh.position.x = Math.round(mesh.position.x);
            mesh.position.y = Math.round(mesh.position.y);
            mesh.position.z = Math.round(mesh.position.z);
          });

          sceneRef.current?.remove(pivotGroup);
          isAnimatingRef.current = false;
          resolve();
        }
      };

      requestAnimationFrame(animateStep);
    });
  }, [speed]);

  // Handle playing moves automatically
  useEffect(() => {
    if (isPlaying && currentMoveIndex < moves.length) {
      animateMove(moves[currentMoveIndex]).then(() => {
        setCurrentMoveIndex(prev => {
          const next = prev + 1;
          if (next >= moves.length) {
            setIsPlaying(false);
          }
          return next;
        });
      });
    }
  }, [isPlaying, currentMoveIndex, moves, animateMove]);

  const handleNextMove = async () => {
    if (currentMoveIndex < moves.length) {
      setIsPlaying(false);
      await animateMove(moves[currentMoveIndex]);
      setCurrentMoveIndex(prev => prev + 1);
    }
  };

  const handlePrevMove = async () => {
    if (currentMoveIndex > 0) {
      setIsPlaying(false);
      const prevIdx = currentMoveIndex - 1;
      await animateMove(moves[prevIdx], true);
      setCurrentMoveIndex(prevIdx);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMoveIndex(0);
    // Reset cubies rotation
    if (cubeGroupRef.current) {
      cubeGroupRef.current.rotation.set(0, 0, 0);
      cubeGroupRef.current.quaternion.set(0, 0, 0, 1);
    }
  };

  const handleScrambleNew = async () => {
    const newScramble = generateScramble(15);
    const parsed = parseMoveString(newScramble);
    setMoves(parsed);
    setCurrentMoveIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-md p-4 shadow-xl">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className={`w-full ${size} cursor-grab active:cursor-grabbing select-none`} />

      {/* Current Scramble/Algorithm Display */}
      {moves.length > 0 && (
        <div className="w-full flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2 mt-2 font-mono text-sm">
          <div className="flex flex-wrap gap-1.5 items-center max-w-[80%]">
            {moves.map((m, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  idx === currentMoveIndex
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : idx < currentMoveIndex
                    ? 'text-slate-500 line-through'
                    : 'text-slate-200'
                }`}
              >
                {m}
              </span>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-sans">
            {currentMoveIndex} / {moves.length}
          </span>
        </div>
      )}

      {/* Control Buttons */}
      {showControls && (
        <div className="flex items-center justify-between w-full mt-3 gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Cube"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrambleNew}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Generate New Scramble"
            >
              <Shuffle className="w-3.5 h-3.5" /> Scramble
            </button>
          </div>

          {moves.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMove}
                disabled={currentMoveIndex === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-all shadow-md shadow-amber-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
              </button>

              <button
                onClick={handleNextMove}
                disabled={currentMoveIndex >= moves.length}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Playback speed selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
            <span>Speed:</span>
            <select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
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
