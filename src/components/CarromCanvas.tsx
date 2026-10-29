import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Coin, Player, PlayerSeat, Vector2D } from '../types/carrom';
import {
  BOARD_SIZE,
  BOARD_FRAME,
  PLAY_AREA_MIN,
  PLAY_AREA_MAX,
  POCKETS,
  POCKET_HOLE_RADIUS,
  BASELINES,
  stepPhysics
} from '../engine/carromPhysics';
import { sounds } from '../audio/soundEffects';

interface CarromCanvasProps {
  coins: Coin[];
  striker: Coin;
  activePlayer: Player;
  isSimulating: boolean;
  onShotRelease: (dir: Vector2D, power: number) => void;
  onStrikerPositionChange: (ratio: number) => void;
  onPhysicsStopped: () => void;
  onCoinPocketed: (coin: Coin) => void;
  sliderRatio: number;
}

export const CarromCanvas: React.FC<CarromCanvasProps> = ({
  coins,
  striker,
  activePlayer,
  isSimulating,
  onShotRelease,
  onStrikerPositionChange,
  onPhysicsStopped,
  onCoinPocketed,
  sliderRatio
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Aiming state
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [aimStart, setAimStart] = useState<Vector2D | null>(null);
  const [aimCurrent, setAimCurrent] = useState<Vector2D | null>(null);

  // Baseline dragging
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Coordinate conversion helper
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent): Vector2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scale = BOARD_SIZE / rect.width;
    return {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top) * scale
    };
  }, []);

  // Handle touch / mouse start
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSimulating || striker.isPocketed) return;
    const pos = getCanvasCoords(e);
    if (!pos) return;

    const distToStriker = Math.hypot(pos.x - striker.x, pos.y - striker.y);
    if (distToStriker <= striker.radius * 2.2) {
      setIsAiming(true);
      setAimStart({ x: striker.x, y: striker.y });
      setAimCurrent(pos);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming || !aimStart) return;
    const pos = getCanvasCoords(e);
    if (pos) {
      setAimCurrent(pos);
    }
  };

  const handleEnd = () => {
    if (isAiming && aimStart && aimCurrent) {
      // Pull back vector: release in direction opposite to drag (slingshot) or forward
      const dx = aimStart.x - aimCurrent.x;
      const dy = aimStart.y - aimCurrent.y;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 14) {
        const powerRatio = Math.min(1.0, pullDist / 140);
        const power = 250 + powerRatio * 1150;
        const dir: Vector2D = {
          x: dx / pullDist,
          y: dy / pullDist
        };
        sounds.playStrike(powerRatio);
        onShotRelease(dir, power);
      }
    }
    setIsAiming(false);
    setAimStart(null);
    setAimCurrent(null);
  };

  // Physics animation tick
  useEffect(() => {
    let animId: number;
    let prevMoving = false;

    const loop = () => {
      if (isSimulating) {
        const moving = stepPhysics(coins, striker, onCoinPocketed);
        if (prevMoving && !moving) {
          onPhysicsStopped();
        }
        prevMoving = moving;
      }
      drawBoard();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [coins, striker, isSimulating, onPhysicsStopped, onCoinPocketed, isAiming, aimCurrent, activePlayer]);

  // Master Canvas Drawing Routine
  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // 1. Dark Hardwood Frame
    const frameGradient = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
    frameGradient.addColorStop(0, '#3a180a');
    frameGradient.addColorStop(0.5, '#4e2311');
    frameGradient.addColorStop(1, '#2c1005');

    ctx.fillStyle = frameGradient;
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Frame bevel highlights
    ctx.strokeStyle = '#6d3319';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, BOARD_SIZE - 12, BOARD_SIZE - 12);

    ctx.strokeStyle = '#1b0a03';
    ctx.lineWidth = 5;
    ctx.strokeRect(BOARD_FRAME - 2, BOARD_FRAME - 2, PLAY_AREA_MAX - PLAY_AREA_MIN + 4, PLAY_AREA_MAX - PLAY_AREA_MIN + 4);

    // 2. Playing Surface (Fine Maple/Birch Wood Texture)
    const boardGrad = ctx.createRadialGradient(
      BOARD_SIZE / 2, BOARD_SIZE / 2, 80,
      BOARD_SIZE / 2, BOARD_SIZE / 2, 450
    );
    boardGrad.addColorStop(0, '#faebd7'); // Antique white / bleached maple
    boardGrad.addColorStop(0.7, '#f3e1c6');
    boardGrad.addColorStop(1, '#ebd0a8');

    ctx.fillStyle = boardGrad;
    ctx.fillRect(PLAY_AREA_MIN, PLAY_AREA_MIN, PLAY_AREA_MAX - PLAY_AREA_MIN, PLAY_AREA_MAX - PLAY_AREA_MIN);

    // Inner subtle grain ring
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 110, 60, 0.12)';
    ctx.lineWidth = 1;
    for (let r = 100; r < 360; r += 40) {
      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Markings: Center Circles & Rosette
    const cx = BOARD_SIZE / 2;
    const cy = BOARD_SIZE / 2;

    // Outer Circle (radius 65)
    ctx.strokeStyle = '#a62b2b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 65, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Circle (radius 22)
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Red center spot
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

    // Decorative rosette petals
    ctx.save();
    ctx.strokeStyle = 'rgba(166, 43, 43, 0.55)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(angle) * 44,
        cy + Math.sin(angle) * 44,
        18,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    ctx.restore();

    // 4. Diagonal Pocket Arrows
    POCKETS.forEach((p, idx) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const angle = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Arrow line
      ctx.strokeStyle = '#8d2424';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(75, 0);
      ctx.lineTo(240, 0);
      ctx.stroke();

      // Arrowhead circle
      ctx.beginPath();
      ctx.arc(245, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 5. Baselines and Foul Circles (South, East, North, West)
    const seats: PlayerSeat[] = [0, 1, 2, 3];
    seats.forEach(seat => {
      const b = BASELINES[seat];
      const isActive = activePlayer.seat === seat;

      ctx.save();
      ctx.strokeStyle = isActive ? '#2563eb' : '#7c2d12';
      ctx.lineWidth = isActive ? 2.5 : 2;

      // Outer baseline
      ctx.beginPath();
      if (seat === 0 || seat === 2) {
        ctx.moveTo(b.start.x, b.start.y - 12);
        ctx.lineTo(b.end.x, b.end.y - 12);
        ctx.moveTo(b.start.x, b.start.y + 12);
        ctx.lineTo(b.end.x, b.end.y + 12);
      } else {
        ctx.moveTo(b.start.x - 12, b.start.y);
        ctx.lineTo(b.end.x - 12, b.end.y);
        ctx.moveTo(b.start.x + 12, b.start.y);
        ctx.lineTo(b.end.x + 12, b.end.y);
      }
      ctx.stroke();

      // Foul Circles at endpoints (radius 18)
      [b.foulCircleStart, b.foulCircleEnd].forEach(pt => {
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Highlight active player's baseline track
      if (isActive && !isSimulating) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(b.start.x, b.start.y);
        ctx.lineTo(b.end.x, b.end.y);
        ctx.stroke();
      }

      ctx.restore();
    });

    // 6. Corner Pockets (Holes & Mesh Backing)
    POCKETS.forEach(p => {
      // Outer brass/wooden pocket ring
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_HOLE_RADIUS + 7, 0, Math.PI * 2);
      ctx.fill();

      // Pocket hole interior (black shadow depth)
      const pGrad = ctx.createRadialGradient(p.x, p.y, 5, p.x, p.y, POCKET_HOLE_RADIUS);
      pGrad.addColorStop(0, '#0a0a0a');
      pGrad.addColorStop(1, '#1f1f1f');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_HOLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Pocket rim stroke
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 7. Render Coins
    coins.forEach(c => {
      if (c.isPocketed) return;
      drawCoin(ctx, c);
    });

    // 8. Render Striker
    if (!striker.isPocketed) {
      drawStriker(ctx, striker);
    }

    // 9. Aiming Guide & Power Indicator
    if (isAiming && aimStart && aimCurrent && !isSimulating) {
      drawAimingGuide(ctx, striker, aimStart, aimCurrent);
    }
  };

  // Helper: Draw Single Coin
  const drawCoin = (ctx: CanvasRenderingContext2D, c: Coin) => {
    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    const baseGrad = ctx.createRadialGradient(
      c.x - c.radius * 0.35, c.y - c.radius * 0.35, c.radius * 0.1,
      c.x, c.y, c.radius
    );

    if (c.type === 'WHITE') {
      baseGrad.addColorStop(0, '#ffffff');
      baseGrad.addColorStop(0.7, '#f4ece1');
      baseGrad.addColorStop(1, '#d5c7b3');
    } else if (c.type === 'BLACK') {
      baseGrad.addColorStop(0, '#3f3f46');
      baseGrad.addColorStop(0.7, '#27272a');
      baseGrad.addColorStop(1, '#18181b');
    } else if (c.type === 'QUEEN') {
      baseGrad.addColorStop(0, '#f87171');
      baseGrad.addColorStop(0.6, '#dc2626');
      baseGrad.addColorStop(1, '#7f1d1d');
    }

    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fill();

    // Turn off shadow for crisp grooves
    ctx.shadowColor = 'transparent';

    // Concentric wooden groove
    ctx.strokeStyle = c.type === 'BLACK' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    // Center Core Inlay
    ctx.fillStyle = c.type === 'QUEEN' ? '#fbbf24' : (c.type === 'BLACK' ? '#52525b' : '#c9bbaa');
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Helper: Draw Striker
  const drawStriker = (ctx: CanvasRenderingContext2D, s: Coin) => {
    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 9;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;

    // Striker Body (Tournament Ivory / Gloss finish)
    const strikerGrad = ctx.createRadialGradient(
      s.x - s.radius * 0.4, s.y - s.radius * 0.4, 2,
      s.x, s.y, s.radius
    );
    strikerGrad.addColorStop(0, '#ffffff');
    strikerGrad.addColorStop(0.6, '#f8fafc');
    strikerGrad.addColorStop(1, '#cbd5e1');

    ctx.fillStyle = strikerGrad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Golden Outer Rim
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius - 1.8, 0, Math.PI * 2);
    ctx.stroke();

    // Inner cyan ring
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius * 0.58, 0, Math.PI * 2);
    ctx.stroke();

    // Center Ruby Dot
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Helper: Draw Aiming Guide Line and Power Meter
  const drawAimingGuide = (
    ctx: CanvasRenderingContext2D,
    s: Coin,
    start: Vector2D,
    current: Vector2D
  ) => {
    const dx = start.x - current.x;
    const dy = start.y - current.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return;

    const powerRatio = Math.min(1.0, dist / 140);
    const dirX = dx / dist;
    const dirY = dy / dist;

    ctx.save();

    // 1. Aiming Trajectory (Dashed projection ahead)
    const guideLength = 220 + powerRatio * 280;
    const targetX = s.x + dirX * guideLength;
    const targetY = s.y + dirY * guideLength;

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target reticle
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 2. Slingshot Pull Vector (behind striker)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();

    // 3. Power Meter Arc around striker
    const shotAngle = Math.atan2(dirY, dirX);
    const arcSpan = Math.PI * 0.45 * powerRatio;
    ctx.strokeStyle = powerRatio > 0.75 ? '#ef4444' : (powerRatio > 0.4 ? '#f59e0b' : '#10b981');
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius + 10, shotAngle - arcSpan, shotAngle + arcSpan);
    ctx.stroke();

    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[620px]">
      {/* Board Canvas */}
      <div
        ref={containerRef}
        className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-950/80 bg-neutral-900 cursor-crosshair touch-none"
      >
        <canvas
          ref={canvasRef}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          className="w-full h-full block"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* In-canvas active player turn banner */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-amber-200 border border-amber-500/30 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{activePlayer.name}&apos;s Turn ({activePlayer.assignedColor})</span>
        </div>
      </div>

      {/* Baseline Striker Position Slider */}
      <div className="w-full mt-3 bg-neutral-900/90 border border-amber-900/40 rounded-xl p-3 shadow-lg flex items-center gap-3">
        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider shrink-0">
          Striker Baseline:
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={sliderRatio}
          disabled={isSimulating || isAiming}
          onChange={(e) => onStrikerPositionChange(parseFloat(e.target.value))}
          className="w-full accent-amber-500 cursor-ew-resize h-2 bg-neutral-800 rounded-lg"
        />
        <span className="text-xs text-neutral-400 w-10 text-right font-mono">
          {Math.round(sliderRatio * 100)}%
        </span>
      </div>
    </div>
  );
};
