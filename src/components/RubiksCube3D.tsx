import { useEffect, useRef, useState, useCallback, type FC } from 'react';
import * as THREE from 'three';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Target, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { parseMoveString, generateScramble, invertMoveString } from '../utils/cubeLogic';

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

interface CubieState {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
}

interface RubiksCube3DProps {
  initialAlgorithm?: string;
  autoPlay?: boolean;
  highlightMode?: 'all' | 'cross' | 'f2l' | 'oll' | 'pll';
  showControls?: boolean;
  size?: string;
  mode?: 'algorithm' | 'scramble';
}

export const RubiksCube3D: FC<RubiksCube3DProps> = ({
  initialAlgorithm = '',
  autoPlay = false,
  highlightMode = 'all',
  showControls = true,
  size = 'h-[360px]',
  mode = 'algorithm',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const cubiesRef = useRef<THREE.Mesh[]>([]);
  const isAnimatingRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const wholeCubeAnimFrameRef = useRef<number | null>(null);

  const [practicePhase, setPracticePhase] = useState<'setup' | 'solve'>('solve');
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(400); // ms per move

  // Precomputed State Array
  const statesRef = useRef<CubieState[][]>([]);

  // Helper to determine axis and layer selection condition for normal and wide moves
  const getMoveParameters = (move: string) => {
    if (!move) {
      return { axis: new THREE.Vector3(0, 1, 0), condition: (p: THREE.Vector3) => Math.round(p.y) === 1, angle: Math.PI / 2 };
    }

    const face = move[0];
    const isWide = move.includes('w') || move[0] === move[0].toLowerCase();
    const isPrime = move.includes("'");
    const isDouble = move.includes('2');

    let angle = isDouble ? Math.PI : Math.PI / 2;
    if (isPrime) angle = -angle;

    let axis = new THREE.Vector3(0, 1, 0);
    let condition = (p: THREE.Vector3) => Math.round(p.y) === 1;

    const upperFace = face.toUpperCase();

    switch (upperFace) {
      case 'U':
        axis = new THREE.Vector3(0, 1, 0);
        condition = p => (isWide ? Math.round(p.y) >= 0 : Math.round(p.y) === 1);
        angle = -angle;
        break;
      case 'D':
        axis = new THREE.Vector3(0, 1, 0);
        condition = p => (isWide ? Math.round(p.y) <= 0 : Math.round(p.y) === -1);
        break;
      case 'R':
        axis = new THREE.Vector3(1, 0, 0);
        condition = p => (isWide ? Math.round(p.x) >= 0 : Math.round(p.x) === 1);
        angle = -angle;
        break;
      case 'L':
        axis = new THREE.Vector3(1, 0, 0);
        condition = p => (isWide ? Math.round(p.x) <= 0 : Math.round(p.x) === -1);
        break;
      case 'F':
        axis = new THREE.Vector3(0, 0, 1);
        condition = p => (isWide ? Math.round(p.z) >= 0 : Math.round(p.z) === 1);
        angle = -angle;
        break;
      case 'B':
        axis = new THREE.Vector3(0, 0, 1);
        condition = p => (isWide ? Math.round(p.z) <= 0 : Math.round(p.z) === -1);
        break;
      case 'M':
        // M slice rotates middle vertical layer (x = 0) around X-axis in L direction
        axis = new THREE.Vector3(1, 0, 0);
        condition = p => Math.round(p.x) === 0;
        break;
      case 'E':
        // E slice rotates middle horizontal layer (y = 0) around Y-axis in D direction
        axis = new THREE.Vector3(0, 1, 0);
        condition = p => Math.round(p.y) === 0;
        break;
      case 'S':
        // S slice rotates middle standing layer (z = 0) around Z-axis in F direction
        axis = new THREE.Vector3(0, 0, 1);
        condition = p => Math.round(p.z) === 0;
        angle = -angle;
        break;
      case 'X':
        // Whole cube rotation around X-axis in R direction
        axis = new THREE.Vector3(1, 0, 0);
        condition = () => true;
        angle = -angle;
        break;
      case 'Y':
        // Whole cube rotation around Y-axis in U direction
        axis = new THREE.Vector3(0, 1, 0);
        condition = () => true;
        angle = -angle;
        break;
      case 'Z':
        // Whole cube rotation around Z-axis in F direction
        axis = new THREE.Vector3(0, 0, 1);
        condition = () => true;
        angle = -angle;
        break;
    }

    return { axis, condition, angle };
  };

  // Apply single matrix rotation on 27 cubie state objects
  const applyMoveToStates = (inputStates: CubieState[], move: string): CubieState[] => {
    const { axis, condition, angle } = getMoveParameters(move);
    const rotMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);

    return inputStates.map(state => {
      const pos = state.pos.clone();
      const quat = state.quat.clone();

      if (condition(pos)) {
        pos.applyMatrix4(rotMatrix);
        pos.x = Math.round(pos.x);
        pos.y = Math.round(pos.y);
        pos.z = Math.round(pos.z);

        const deltaQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        quat.premultiply(deltaQuat);
      }

      return { pos, quat };
    });
  };

  // Precompute states Array based on active phase ('setup' vs 'solve')
  const computeAllStatesForPhase = useCallback(
    (forwardMoves: string[], phase: 'setup' | 'solve') => {
      // Solved State
      const solvedState: CubieState[] = [];
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            solvedState.push({
              pos: new THREE.Vector3(x, y, z),
              quat: new THREE.Quaternion(),
            });
          }
        }
      }

      if (forwardMoves.length === 0) {
        return [solvedState];
      }

      const inverseMoves = invertMoveString(forwardMoves.join(' '));

      if (phase === 'setup') {
        // Phase 1: Solved Cube (State 0) -> Apply Inverse Moves -> Unsolved Case Pattern (State N)
        const allStates: CubieState[][] = [solvedState];
        let currentState = solvedState;

        inverseMoves.forEach(move => {
          currentState = applyMoveToStates(currentState, move);
          allStates.push(currentState);
        });
        return allStates;
      } else {
        // Phase 2: Unsolved Case Pattern (State 0) -> Apply Forward Moves -> Solved Cube (State N)
        let state0 = solvedState;
        inverseMoves.forEach(move => {
          state0 = applyMoveToStates(state0, move);
        });

        const allStates: CubieState[][] = [state0];
        let currentState = state0;

        forwardMoves.forEach(move => {
          currentState = applyMoveToStates(currentState, move);
          allStates.push(currentState);
        });

        return allStates;
      }
    },
    []
  );

  // Jump 3D cubies instantly to state index in 0ms
  const jumpToStateIndex = useCallback((targetIndex: number) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (pivotRef.current && cubeGroupRef.current) {
      const children = [...pivotRef.current.children];
      children.forEach(child => {
        cubeGroupRef.current?.attach(child);
      });
      cubeGroupRef.current?.remove(pivotRef.current);
      pivotRef.current = null;
    }

    isAnimatingRef.current = false;

    const targetState = statesRef.current[targetIndex];
    if (!targetState || cubiesRef.current.length === 0) return;

    cubiesRef.current.forEach((cubie, idx) => {
      const state = targetState[idx];
      if (state) {
        cubie.position.copy(state.pos);
        cubie.quaternion.copy(state.quat);
        cubie.updateMatrix();
        cubie.updateMatrixWorld(true);
      }
    });

    setCurrentMoveIndex(targetIndex);
  }, []);

  // Smooth Animated Whole-Cube 90° Snap Rotation Handler (y, y', x, x')
  const animateWholeCube90 = (axis: 'x' | 'y', direction: 1 | -1) => {
    if (!cubeGroupRef.current || isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    if (wholeCubeAnimFrameRef.current) {
      cancelAnimationFrame(wholeCubeAnimFrameRef.current);
      wholeCubeAnimFrameRef.current = null;
    }

    const startX = cubeGroupRef.current.rotation.x;
    const startY = cubeGroupRef.current.rotation.y;

    const deltaAngle = (Math.PI / 2) * direction;
    const rawTargetX = axis === 'x' ? startX + deltaAngle : startX;
    const rawTargetY = axis === 'y' ? startY + deltaAngle : startY;

    // Snap targets to exact clean 90° multiples
    const targetX = Math.round(rawTargetX / (Math.PI / 2)) * (Math.PI / 2);
    const targetY = Math.round(rawTargetY / (Math.PI / 2)) * (Math.PI / 2);

    const startTime = performance.now();
    const animDuration = 220; // smooth 220ms rotation

    const updateWholeRotation = () => {
      const now = performance.now();
      const rawProgress = Math.min((now - startTime) / animDuration, 1);
      const easedProgress = Math.sin((rawProgress * Math.PI) / 2);

      if (cubeGroupRef.current) {
        if (axis === 'y') {
          cubeGroupRef.current.rotation.y = THREE.MathUtils.lerp(startY, targetY, easedProgress);
        } else {
          cubeGroupRef.current.rotation.x = THREE.MathUtils.lerp(startX, targetX, easedProgress);
        }
      }

      if (rawProgress < 1) {
        wholeCubeAnimFrameRef.current = requestAnimationFrame(updateWholeRotation);
      } else {
        if (cubeGroupRef.current) {
          cubeGroupRef.current.rotation.x = targetX;
          cubeGroupRef.current.rotation.y = targetY;
        }
        wholeCubeAnimFrameRef.current = null;
        isAnimatingRef.current = false;
      }
    };

    wholeCubeAnimFrameRef.current = requestAnimationFrame(updateWholeRotation);
  };

  const resetCubeOrientation = () => {
    if (wholeCubeAnimFrameRef.current) {
      cancelAnimationFrame(wholeCubeAnimFrameRef.current);
      wholeCubeAnimFrameRef.current = null;
    }
    isAnimatingRef.current = false;
    if (!cubeGroupRef.current) return;
    cubeGroupRef.current.rotation.set(0, 0, 0);
  };

  // Parse move string and compute state sequence whenever initialAlgorithm or practicePhase changes
  useEffect(() => {
    if (initialAlgorithm) {
      const parsed = parseMoveString(initialAlgorithm);
      const activeMoves = practicePhase === 'setup' ? invertMoveString(initialAlgorithm) : parsed;
      setMoves(activeMoves);

      const computedStates = computeAllStatesForPhase(parsed, practicePhase);
      statesRef.current = computedStates;
      setCurrentMoveIndex(0);
      setIsPlaying(autoPlay);
      jumpToStateIndex(0);
    } else {
      setMoves([]);
      const computedStates = computeAllStatesForPhase([], practicePhase);
      statesRef.current = computedStates;
      setCurrentMoveIndex(0);
      setIsPlaying(false);
      jumpToStateIndex(0);
    }
  }, [initialAlgorithm, autoPlay, practicePhase, computeAllStatesForPhase, jumpToStateIndex]);

  // Set up Three.js Scene ONCE on mount or highlightMode change
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
    cameraRef.current = camera;

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

    // Shared geometry instances
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

          // Add crisp Notion border wireframes
          const lineMaterial = new THREE.LineBasicMaterial({
            color: isTargetLayer ? 0x2d2d2d : 0x383838,
            linewidth: 1,
          });
          const wireframe = new THREE.LineSegments(sharedEdgesGeometry, lineMaterial);
          cubie.add(wireframe);

          cubeGroup.add(cubie);
          cubies.push(cubie);
        }
      }
    }
    cubiesRef.current = cubies;
    isAnimatingRef.current = false;

    // Apply active state index immediately after cubies are created
    jumpToStateIndex(currentMoveIndex);

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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (wholeCubeAnimFrameRef.current) cancelAnimationFrame(wholeCubeAnimFrameRef.current);

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
      sceneRef.current = null;
      cameraRef.current = null;
      cubeGroupRef.current = null;
    };
  }, [highlightMode]);

  // Execute a single move animation from state i to state i+1
  const animateMove = (move: string, reverse: boolean = false): Promise<void> => {
    return new Promise(resolve => {
      if (!cubeGroupRef.current || isAnimatingRef.current) {
        resolve();
        return;
      }

      isAnimatingRef.current = true;
      const { axis, condition, angle: baseAngle } = getMoveParameters(move);
      const angle = reverse ? -baseAngle : baseAngle;

      const pivot = new THREE.Group();
      pivotRef.current = pivot;
      cubeGroupRef.current.add(pivot);

      const movingCubies: THREE.Mesh[] = [];
      cubiesRef.current.forEach(cubie => {
        if (condition(cubie.position)) {
          pivot.attach(cubie);
          movingCubies.push(cubie);
        }
      });

      const startTime = performance.now();
      const animDuration = Math.min(speed * 0.85, 300);

      const updateRotation = () => {
        const now = performance.now();
        const rawProgress = Math.min((now - startTime) / animDuration, 1);
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
          });

          if (pivotRef.current) {
            cubeGroupRef.current?.remove(pivotRef.current);
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
  const handleNextMove = useCallback(async () => {
    if (currentMoveIndex < moves.length && !isAnimatingRef.current) {
      const nextIdx = currentMoveIndex + 1;
      const move = moves[currentMoveIndex];
      await animateMove(move, false);
      jumpToStateIndex(nextIdx);
    }
  }, [currentMoveIndex, moves, jumpToStateIndex]);

  const handlePrevMove = async () => {
    if (currentMoveIndex > 0 && !isAnimatingRef.current) {
      const prevIdx = currentMoveIndex - 1;
      const move = moves[prevIdx];
      await animateMove(move, true);
      jumpToStateIndex(prevIdx);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    jumpToStateIndex(0);
  };

  const handleScrambleNew = () => {
    const newScramble = generateScramble(21);
    const parsed = parseMoveString(newScramble);
    setMoves(parsed);
    const computedStates = computeAllStatesForPhase(parsed, 'solve');
    statesRef.current = computedStates;
    setIsPlaying(false);
    jumpToStateIndex(0);
  };

  // Auto-play interval
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (isPlaying && currentMoveIndex < moves.length && !isAnimatingRef.current) {
      timeoutId = setTimeout(async () => {
        await handleNextMove();
      }, speed);
    } else if (currentMoveIndex >= moves.length) {
      setIsPlaying(false);
    }

    return () => clearTimeout(timeoutId);
  }, [isPlaying, currentMoveIndex, moves, speed, handleNextMove]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full bg-[#202020] rounded-xl border border-[#2d2d2d] p-4 shadow-none">
      {/* Top Header: Single 1-Tap Toggle Button for Practice Mode */}
      {mode === 'algorithm' && (
        <div className="w-full flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#2d2d2d]">
          <span className="text-xs text-[#888888] font-bold uppercase tracking-wider">Practice Mode:</span>

          {/* Single 1-Tap Toggle Button */}
          <button
            type="button"
            onClick={() => setPracticePhase(prev => (prev === 'solve' ? 'setup' : 'solve'))}
            className="px-3 py-1.5 rounded-lg bg-[#191919] hover:bg-[#2d2d2d] border border-[#2d2d2d] hover:border-[#eab308]/50 text-xs font-bold text-[#eab308] flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title={
              practicePhase === 'solve'
                ? 'Currently: Solve Case Mode. Click to switch to Setup Case Mode'
                : 'Currently: Case Setup Mode. Click to switch to Solve Case Mode'
            }
          >
            {practicePhase === 'solve' ? (
              <>
                <Play className="w-3.5 h-3.5 text-[#eab308] fill-[#eab308]" />
                <span>Solve Case (Click to switch to Setup)</span>
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5 text-[#eab308]" />
                <span>Create Case Setup (Click to switch to Solve)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 3D Canvas Box with Floating Overlay Arrow Buttons */}
      <div className="relative w-full overflow-hidden rounded-lg bg-[#191919]">
        <div ref={containerRef} className={`w-full ${size} cursor-default select-none`} />

        {/* Floating Arrow Overlay Controls (Up ⬆️, Down ⬇️, Left ⬅️, Right ➡️) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between p-2">
          {/* Rotate Left Button (⬅️) */}
          <button
            type="button"
            onClick={() => animateWholeCube90('y', 1)}
            aria-label="Rotate Cube Left 90 degrees"
            title="Rotate Cube Left 90° (y')"
            className="pointer-events-auto p-2.5 rounded-full bg-[#191919]/85 hover:bg-[#2d2d2d] border border-[#383838] text-[#eab308] hover:scale-110 active:scale-95 transition-all shadow-md backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Top (⬆️) and Bottom (⬇️) Arrow Stack in Center Top/Bottom */}
          <button
            type="button"
            onClick={() => animateWholeCube90('x', 1)}
            aria-label="Tilt Cube Up 90 degrees"
            title="Tilt Cube Up 90° (x)"
            className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-[#191919]/85 hover:bg-[#2d2d2d] border border-[#383838] text-[#eab308] hover:scale-110 active:scale-95 transition-all shadow-md backdrop-blur-sm"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => animateWholeCube90('x', -1)}
            aria-label="Tilt Cube Down 90 degrees"
            title="Tilt Cube Down 90° (x')"
            className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-[#191919]/85 hover:bg-[#2d2d2d] border border-[#383838] text-[#eab308] hover:scale-110 active:scale-95 transition-all shadow-md backdrop-blur-sm"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Rotate Right Button (➡️) */}
          <button
            type="button"
            onClick={() => animateWholeCube90('y', -1)}
            aria-label="Rotate Cube Right 90 degrees"
            title="Rotate Cube Right 90° (y)"
            className="pointer-events-auto p-2.5 rounded-full bg-[#191919]/85 hover:bg-[#2d2d2d] border border-[#383838] text-[#eab308] hover:scale-110 active:scale-95 transition-all shadow-md backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Reset Camera Button (Bottom-Right) */}
          <button
            type="button"
            onClick={resetCubeOrientation}
            aria-label="Reset Cube View Orientation"
            title="Reset Cube View Angle"
            className="pointer-events-auto absolute bottom-2 right-2 p-1.5 rounded-lg bg-[#191919]/90 hover:bg-[#2d2d2d] border border-[#383838] text-[#888888] hover:text-white text-xs font-mono flex items-center gap-1 transition-all shadow-md backdrop-blur-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset View
          </button>
        </div>
      </div>

      {/* Interactive Clickable Formula Move Tokens Bar */}
      {moves.length > 0 && (
        <div className="w-full flex flex-col gap-1.5 bg-[#191919] border border-[#2d2d2d] rounded-lg p-2 mt-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#eab308] font-sans font-bold">
              {practicePhase === 'setup' ? 'Phase 1: Solved ➔ Case Setup' : 'Phase 2: Case Setup ➔ Solved'}
            </span>
            <span className="text-[11px] text-[#888888] font-sans font-semibold">
              Step {currentMoveIndex} / {moves.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 items-center">
            {/* Step 0: Setup / Solved Button */}
            <button
              type="button"
              aria-pressed={currentMoveIndex === 0}
              onClick={() => jumpToStateIndex(0)}
              className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                currentMoveIndex === 0
                  ? 'bg-[#eab308] text-black border border-[#eab308]'
                  : 'bg-[#202020] text-[#888888] hover:text-white border border-[#2d2d2d]'
              }`}
              title={practicePhase === 'setup' ? 'Start at Solved Cube' : 'Start at Case Setup Pattern'}
            >
              <Target className="w-3 h-3" /> {practicePhase === 'setup' ? 'Solved' : 'Setup'}
            </button>

            {/* Clickable Move Step Buttons */}
            {moves.map((m, idx) => {
              const stepIdx = idx + 1;
              const isActive = currentMoveIndex === stepIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => jumpToStateIndex(stepIdx)}
                  className={`px-2 py-1 rounded font-mono font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-[#eab308] text-black border border-[#eab308] scale-105'
                      : idx < currentMoveIndex
                      ? 'text-[#888888] bg-[#202020] hover:text-white'
                      : 'text-[#d4d4d4] bg-[#202020] hover:text-white'
                  }`}
                  title={`Jump to step ${stepIdx} (${m})`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {showControls && (
        <div className="flex items-center justify-between w-full mt-3 gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-[#eab308] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Reset 3D Cube to Start of Phase"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Phase
            </button>

            {mode === 'scramble' && (
              <button
                type="button"
                onClick={handleScrambleNew}
                className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-[#d4d4d4] text-xs font-medium flex items-center gap-1 transition-colors"
                title="Generate Random Scramble"
              >
                <Shuffle className="w-3.5 h-3.5" /> Scramble
              </button>
            )}
          </div>

          {moves.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMove}
                disabled={currentMoveIndex === 0}
                className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] disabled:opacity-40 border border-[#383838] text-[#d4d4d4] transition-colors"
                aria-label="Previous Move Step"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-lg bg-[#eab308] hover:bg-[#facc15] text-black font-semibold transition-all"
                aria-label={isPlaying ? 'Pause Algorithm Animation' : 'Play Algorithm Animation'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
              </button>

              <button
                type="button"
                onClick={handleNextMove}
                disabled={currentMoveIndex >= moves.length}
                className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] disabled:opacity-40 border border-[#383838] text-[#d4d4d4] transition-colors"
                aria-label="Next Move Step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Playback speed selector */}
          <div className="flex items-center gap-1 text-xs text-[#888888] font-mono">
            <span>Speed:</span>
            <select
              aria-label="Select Playback Speed"
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="bg-[#2d2d2d] border border-[#383838] text-[#d4d4d4] rounded px-1.5 py-0.5 text-xs focus:outline-none cursor-pointer"
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
