import React from 'react';
import { Player, QueenState, Coin } from '../types/carrom';
import { Trophy, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface ScoreBoardProps {
  players: Player[];
  activePlayerSeat: number;
  queenState: QueenState;
  coins: Coin[];
  lastAnnouncement: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  activePlayerSeat,
  queenState,
  coins,
  lastAnnouncement
}) => {
  const whiteCoinsLeft = coins.filter(c => !c.isPocketed && c.type === 'WHITE').length;
  const blackCoinsLeft = coins.filter(c => !c.isPocketed && c.type === 'BLACK').length;
  const queenOnBoard = coins.some(c => !c.isPocketed && c.type === 'QUEEN');

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Announcement marquee */}
      {lastAnnouncement && (
        <div className="w-full px-4 py-2 bg-gradient-to-r from-amber-950/80 via-neutral-900/90 to-amber-950/80 border border-amber-600/40 rounded-xl text-center text-sm font-medium text-amber-200 shadow-md animate-pulse">
          {lastAnnouncement}
        </div>
      )}

      {/* Players Cards Grid */}
      <div className={`grid gap-3 ${players.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
        {players.map((p) => {
          const isActive = p.seat === activePlayerSeat;
          return (
            <div
              key={p.id}
              className={`relative overflow-hidden rounded-xl p-3 border transition-all duration-300 ${
                isActive
                  ? 'bg-neutral-800/95 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30 scale-[1.02]'
                  : 'bg-neutral-900/80 border-neutral-800 opacity-80'
              }`}
            >
              {/* Active glow tag */}
              {isActive && (
                <div className="absolute top-0 right-0 bg-amber-500 text-neutral-950 font-bold text-[10px] uppercase px-2 py-0.5 rounded-bl-lg">
                  Shooting
                </div>
              )}

              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full border ${
                    p.assignedColor === 'WHITE'
                      ? 'bg-amber-100 border-amber-300'
                      : 'bg-neutral-900 border-neutral-600'
                  }`}
                />
                <span className="font-bold text-sm text-neutral-100 truncate">{p.name}</span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-2xl font-black text-amber-400 tracking-tight">{p.score}</span>
                  <span className="text-xs text-neutral-400 ml-1 font-semibold">pts</span>
                </div>
                {p.fouls > 0 && (
                  <div className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{p.fouls} {p.fouls === 1 ? 'foul' : 'fouls'}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Queen & Coin Counters Bar */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Coin Remaining Count */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300 shadow" />
            <span className="text-neutral-300 font-semibold">White: <b className="text-amber-200">{whiteCoinsLeft}</b>/9</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-neutral-600 shadow" />
            <span className="text-neutral-300 font-semibold">Black: <b className="text-neutral-200">{blackCoinsLeft}</b>/9</span>
          </div>
        </div>

        {/* Queen Status */}
        <div className="flex items-center gap-2">
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Queen:
          </span>
          {queenState.isCovered ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Covered (+30 pts)
            </span>
          ) : queenState.pendingCover ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
              Pending Cover!
            </span>
          ) : queenOnBoard ? (
            <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
              On Board
            </span>
          ) : (
            <span className="text-neutral-500">Uncovered</span>
          )}
        </div>
      </div>
    </div>
  );
};
