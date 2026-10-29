import { Coin, CoinType, Player, QueenState, GameMode } from '../types/carrom';
import { sounds } from '../audio/soundEffects';

export interface ShotResult {
  nextTurnSeat: number;
  foulReason?: string;
  pointsAdded: number;
  returnedCoins: CoinType[];
  queenCoveredNow: boolean;
  isGameOver: boolean;
  winnerPlayerId?: string;
  announcement: string;
}

export function evaluateShot(
  activePlayer: Player,
  pocketedThisShot: CoinType[],
  hasStrikerFoul: boolean,
  queenState: QueenState,
  allPlayers: Player[],
  remainingCoins: Coin[],
  gameMode: GameMode
): ShotResult {
  const result: ShotResult = {
    nextTurnSeat: activePlayer.seat,
    pointsAdded: 0,
    returnedCoins: [],
    queenCoveredNow: false,
    isGameOver: false,
    announcement: ''
  };

  const playerColor = activePlayer.assignedColor;
  let ownPotted = 0;
  let oppPotted = 0;
  let queenPotted = false;

  for (const c of pocketedThisShot) {
    if (c === 'QUEEN') queenPotted = true;
    else if (c === playerColor) ownPotted++;
    else if (c !== 'STRIKER') oppPotted++;
  }

  // 1. Striker Foul
  if (hasStrikerFoul) {
    sounds.playFoul();
    result.foulReason = 'Foul! Striker pocketed.';
    result.announcement = `${activePlayer.name} committed a Foul! Striker pocketed.`;

    // Penalty Due coin returned if player has previously scored
    if (activePlayer.score >= 5) {
      result.returnedCoins.push(playerColor);
      result.pointsAdded -= 5;
    }

    // If player had queen pending cover, queen returns to center
    if (queenState.pendingCover && queenState.pocketedBySeat === activePlayer.seat) {
      result.returnedCoins.push('QUEEN');
      queenState.pendingCover = false;
      queenState.pocketedBySeat = null;
      result.announcement += ' Queen returned to center.';
    }

    // Foul forfeits turn
    result.nextTurnSeat = getNextSeat(activePlayer.seat, allPlayers.length, gameMode);
    return result;
  }

  // 2. Queen Pocketed Logic
  if (queenPotted) {
    if (!queenState.isCovered) {
      queenState.pendingCover = true;
      queenState.pocketedBySeat = activePlayer.seat;
      if (ownPotted > 0) {
        // Covered on the exact same stroke!
        queenState.isCovered = true;
        queenState.pendingCover = false;
        result.queenCoveredNow = true;
        result.pointsAdded += 30;
        result.announcement = `${activePlayer.name} pocketed and COVERED the Queen in one stroke! (+30 pts)`;
      } else {
        result.announcement = `${activePlayer.name} pocketed the Queen! Must cover with own coin on next shot!`;
      }
      // Pockets queen -> gets another turn to attempt cover
      result.nextTurnSeat = activePlayer.seat;
    }
  } else if (queenState.pendingCover && queenState.pocketedBySeat === activePlayer.seat) {
    // Was attempting cover on this shot
    if (ownPotted > 0) {
      queenState.isCovered = true;
      queenState.pendingCover = false;
      result.queenCoveredNow = true;
      result.pointsAdded += 30;
      result.announcement = `${activePlayer.name} COVERED the Queen! (+30 pts)`;
      result.nextTurnSeat = activePlayer.seat; // Keep turn
    } else {
      // Failed to cover
      queenState.pendingCover = false;
      queenState.pocketedBySeat = null;
      result.returnedCoins.push('QUEEN');
      result.announcement = `${activePlayer.name} failed to cover Queen. Queen returns to center!`;
      result.nextTurnSeat = getNextSeat(activePlayer.seat, allPlayers.length, gameMode);
    }
  }

  // 3. Regular Scoring
  if (ownPotted > 0) {
    const pts = ownPotted * (playerColor === 'WHITE' ? 10 : 5);
    result.pointsAdded += pts;
    if (!result.announcement) {
      result.announcement = `${activePlayer.name} pocketed ${ownPotted} ${playerColor} coin(s)! (+${pts} pts)`;
    }
    // Pocketing own coin keeps the turn
    result.nextTurnSeat = activePlayer.seat;
  } else if (!queenPotted && (!queenState.pendingCover || queenState.pocketedBySeat !== activePlayer.seat)) {
    // No own coin pocketed -> turn passes to next player
    result.nextTurnSeat = getNextSeat(activePlayer.seat, allPlayers.length, gameMode);
    if (!result.announcement) {
      result.announcement = `${activePlayer.name}'s turn ended.`;
    }
  }

  // 4. Opponent coin pocketed
  if (oppPotted > 0) {
    result.announcement += ` (Opponent coin pocketed)`;
  }

  // 5. Check Game Over
  const whiteLeft = remainingCoins.filter(c => !c.isPocketed && c.type === 'WHITE').length;
  const blackLeft = remainingCoins.filter(c => !c.isPocketed && c.type === 'BLACK').length;

  if (whiteLeft === 0 || blackLeft === 0) {
    result.isGameOver = true;
    sounds.playVictory();
    // Determine winner by highest score
    const sorted = [...allPlayers].sort((a, b) => (b.score + (b.id === activePlayer.id ? result.pointsAdded : 0)) - a.score);
    result.winnerPlayerId = sorted[0].id;
    result.announcement = `🏆 Match Over! ${sorted[0].name} wins with ${sorted[0].score + (sorted[0].id === activePlayer.id ? result.pointsAdded : 0)} points!`;
  }

  return result;
}

export function getNextSeat(currentSeat: number, totalPlayers: number, mode: GameMode): number {
  if (mode === 'PRACTICE') return 0;
  if (mode === 'TWO_PLAYER') {
    // 2-player mode plays South (0) and North (2)
    return currentSeat === 0 ? 2 : 0;
  }
  // 4-player mode rotates clockwise: 0 -> 1 -> 2 -> 3 -> 0
  return (currentSeat + 1) % totalPlayers;
}
