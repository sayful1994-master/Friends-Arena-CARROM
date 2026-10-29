import { Coin, CoinType, Vector2D, PlayerSeat } from '../types/carrom';
import { sounds } from '../audio/soundEffects';

export const BOARD_SIZE = 800;
export const BOARD_FRAME = 56;
export const PLAY_AREA_MIN = BOARD_FRAME;
export const PLAY_AREA_MAX = BOARD_SIZE - BOARD_FRAME;
export const POCKET_RADIUS = 36;
export const POCKET_HOLE_RADIUS = 28;

export const STRIKER_RADIUS = 26;
export const STRIKER_MASS = 3.2;

export const COIN_RADIUS = 18;
export const COIN_MASS = 1.0;

export const FRICTION = 0.984; // Dynamic surface friction
export const CUSHION_RESTITUTION = 0.88;
export const COIN_RESTITUTION = 0.94;
export const MIN_VELOCITY = 1.2;

export interface BaselineConfig {
  start: Vector2D;
  end: Vector2D;
  foulCircleStart: Vector2D;
  foulCircleEnd: Vector2D;
  center: Vector2D;
  aimAngleMin: number;
  aimAngleMax: number;
}

export const BASELINES: Record<PlayerSeat, BaselineConfig> = {
  0: { // South (Bottom)
    start: { x: 230, y: 660 },
    end: { x: 570, y: 660 },
    foulCircleStart: { x: 230, y: 660 },
    foulCircleEnd: { x: 570, y: 660 },
    center: { x: 400, y: 660 },
    aimAngleMin: -Math.PI,
    aimAngleMax: 0
  },
  1: { // East (Right)
    start: { x: 660, y: 230 },
    end: { x: 660, y: 570 },
    foulCircleStart: { x: 660, y: 230 },
    foulCircleEnd: { x: 660, y: 570 },
    center: { x: 660, y: 400 },
    aimAngleMin: Math.PI / 2,
    aimAngleMax: (3 * Math.PI) / 2
  },
  2: { // North (Top)
    start: { x: 230, y: 140 },
    end: { x: 570, y: 140 },
    foulCircleStart: { x: 230, y: 140 },
    foulCircleEnd: { x: 570, y: 140 },
    center: { x: 400, y: 140 },
    aimAngleMin: 0,
    aimAngleMax: Math.PI
  },
  3: { // West (Left)
    start: { x: 140, y: 230 },
    end: { x: 140, y: 570 },
    foulCircleStart: { x: 140, y: 230 },
    foulCircleEnd: { x: 140, y: 570 },
    center: { x: 140, y: 400 },
    aimAngleMin: -Math.PI / 2,
    aimAngleMax: Math.PI / 2
  }
};

export const POCKETS: Vector2D[] = [
  { x: PLAY_AREA_MIN + 22, y: PLAY_AREA_MIN + 22 }, // Top-Left
  { x: PLAY_AREA_MAX - 22, y: PLAY_AREA_MIN + 22 }, // Top-Right
  { x: PLAY_AREA_MAX - 22, y: PLAY_AREA_MAX - 22 }, // Bottom-Right
  { x: PLAY_AREA_MIN + 22, y: PLAY_AREA_MAX - 22 }, // Bottom-Left
];

export function createInitialCoins(): Coin[] {
  const coins: Coin[] = [];
  const center = { x: BOARD_SIZE / 2, y: BOARD_SIZE / 2 };

  // 1 Queen at center
  coins.push({
    id: 'queen',
    type: 'QUEEN',
    x: center.x,
    y: center.y,
    vx: 0,
    vy: 0,
    radius: COIN_RADIUS,
    mass: COIN_MASS,
    isPocketed: false,
    sinkScale: 1.0,
    sinkOpacity: 1.0
  });

  // Inner ring: 6 coins alternating (White, Black, White, Black, White, Black)
  const r1 = 37;
  for (let i = 0; i < 6; i++) {
    const angle = i * ((2 * Math.PI) / 6);
    const type: CoinType = i % 2 === 0 ? 'WHITE' : 'BLACK';
    coins.push({
      id: `inner_${i}`,
      type,
      x: center.x + Math.cos(angle) * r1,
      y: center.y + Math.sin(angle) * r1,
      vx: 0,
      vy: 0,
      radius: COIN_RADIUS,
      mass: COIN_MASS,
      isPocketed: false,
      sinkScale: 1.0,
      sinkOpacity: 1.0
    });
  }

  // Outer ring: 12 coins (6 White, 6 Black alternating)
  const r2 = 74;
  for (let i = 0; i < 12; i++) {
    const angle = i * ((2 * Math.PI) / 12) + Math.PI / 12;
    const type: CoinType = i % 2 === 0 ? 'BLACK' : 'WHITE';
    coins.push({
      id: `outer_${i}`,
      type,
      x: center.x + Math.cos(angle) * r2,
      y: center.y + Math.sin(angle) * r2,
      vx: 0,
      vy: 0,
      radius: COIN_RADIUS,
      mass: COIN_MASS,
      isPocketed: false,
      sinkScale: 1.0,
      sinkOpacity: 1.0
    });
  }

  return coins;
}

export function createStriker(seat: PlayerSeat, sliderRatio: number = 0.5): Coin {
  const baseline = BASELINES[seat];
  const x = baseline.start.x + (baseline.end.x - baseline.start.x) * sliderRatio;
  const y = baseline.start.y + (baseline.end.y - baseline.start.y) * sliderRatio;

  return {
    id: 'striker',
    type: 'STRIKER',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: STRIKER_RADIUS,
    mass: STRIKER_MASS,
    isPocketed: false,
    sinkScale: 1.0,
    sinkOpacity: 1.0
  };
}

export function stepPhysics(
  coins: Coin[],
  striker: Coin,
  onPocketed: (coin: Coin) => void
): boolean {
  let isMoving = false;
  const allObjects = [...coins.filter(c => !c.isPocketed), striker];

  // 1. Position update + Friction + Cushion bounce
  for (const obj of allObjects) {
    if (obj.isPocketed) continue;

    const speed = Math.hypot(obj.vx, obj.vy);
    if (speed > 0.05) {
      isMoving = true;
      obj.vx *= FRICTION;
      obj.vy *= FRICTION;

      if (speed < MIN_VELOCITY) {
        obj.vx = 0;
        obj.vy = 0;
      } else {
        obj.x += obj.vx * (1 / 60);
        obj.y += obj.vy * (1 / 60);
      }

      // Cushion Bounces
      if (obj.x - obj.radius < PLAY_AREA_MIN) {
        obj.x = PLAY_AREA_MIN + obj.radius;
        obj.vx = -obj.vx * CUSHION_RESTITUTION;
        sounds.playCollision(Math.abs(obj.vx));
      } else if (obj.x + obj.radius > PLAY_AREA_MAX) {
        obj.x = PLAY_AREA_MAX - obj.radius;
        obj.vx = -obj.vx * CUSHION_RESTITUTION;
        sounds.playCollision(Math.abs(obj.vx));
      }

      if (obj.y - obj.radius < PLAY_AREA_MIN) {
        obj.y = PLAY_AREA_MIN + obj.radius;
        obj.vy = -obj.vy * CUSHION_RESTITUTION;
        sounds.playCollision(Math.abs(obj.vy));
      } else if (obj.y + obj.radius > PLAY_AREA_MAX) {
        obj.y = PLAY_AREA_MAX - obj.radius;
        obj.vy = -obj.vy * CUSHION_RESTITUTION;
        sounds.playCollision(Math.abs(obj.vy));
      }

      // Pocket check
      for (const pocket of POCKETS) {
        const dist = Math.hypot(obj.x - pocket.x, obj.y - pocket.y);
        if (dist <= POCKET_HOLE_RADIUS + obj.radius * 0.4) {
          // Suction into pocket
          obj.vx = (pocket.x - obj.x) * 4;
          obj.vy = (pocket.y - obj.y) * 4;
          if (dist < POCKET_HOLE_RADIUS * 0.6) {
            obj.isPocketed = true;
            obj.vx = 0;
            obj.vy = 0;
            sounds.playPocket();
            onPocketed(obj);
          }
          break;
        }
      }
    }
  }

  // 2. Object to Object Collisions
  for (let i = 0; i < allObjects.length; i++) {
    const o1 = allObjects[i];
    if (o1.isPocketed) continue;

    for (let j = i + 1; j < allObjects.length; j++) {
      const o2 = allObjects[j];
      if (o2.isPocketed) continue;

      const dx = o2.x - o1.x;
      const dy = o2.y - o1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = o1.radius + o2.radius;

      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Separate overlaps
        const overlap = minDist - dist;
        const totalMass = o1.mass + o2.mass;
        o1.x -= nx * (overlap * (o2.mass / totalMass));
        o1.y -= ny * (overlap * (o2.mass / totalMass));
        o2.x += nx * (overlap * (o1.mass / totalMass));
        o2.y += ny * (overlap * (o1.mass / totalMass));

        // Velocities along normal
        const rvx = o2.vx - o1.vx;
        const rvy = o2.vy - o1.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
          const impulseMag = -((1 + COIN_RESTITUTION) * velAlongNormal) / (1 / o1.mass + 1 / o2.mass);
          const ix = nx * impulseMag;
          const iy = ny * impulseMag;

          o1.vx -= ix / o1.mass;
          o1.vy -= iy / o1.mass;
          o2.vx += ix / o2.mass;
          o2.vy += iy / o2.mass;

          sounds.playCollision(Math.abs(velAlongNormal));
          isMoving = true;
        }
      }
    }
  }

  return isMoving;
}
