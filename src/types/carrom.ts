export type CoinType = 'WHITE' | 'BLACK' | 'QUEEN' | 'STRIKER';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Coin {
  id: string;
  type: CoinType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  isPocketed: boolean;
  sinkScale: number;
  sinkOpacity: number;
}

export type PlayerSeat = 0 | 1 | 2 | 3; // 0: South (Bottom), 1: East (Right), 2: North (Top), 3: West (Left)

export interface Player {
  id: string;
  name: string;
  seat: PlayerSeat;
  assignedColor: 'WHITE' | 'BLACK';
  score: number;
  fouls: number;
  isReady: boolean;
  isHost: boolean;
  isAI?: boolean;
}

export type GameMode = 'PRACTICE' | 'TWO_PLAYER' | 'FOUR_PLAYER' | 'MULTIPLAYER_LOBBY';

export type ConnectivityType = 'WIFI_HOTSPOT' | 'WIFI_DIRECT' | 'BLUETOOTH' | 'LOCAL_OFFLINE';

export interface ShotOutcome {
  pocketedCoins: CoinType[];
  strikerFoul: boolean;
  ownCoinsPocketed: number;
  opponentCoinsPocketed: number;
  queenPocketed: boolean;
}

export interface QueenState {
  pocketedBySeat: number | null;
  isCovered: boolean;
  pendingCover: boolean;
}
