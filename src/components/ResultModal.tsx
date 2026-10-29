import React, { useEffect } from 'react';
import { Player } from '../types/carrom';
import { Trophy, RotateCcw, Home, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultModalProps {
  isOpen: boolean;
  winnerPlayerId?: string;
  players: Player[];
  onRematch: () => void;
  onMainMenu: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  winnerPlayerId,
  players,
  onRematch,
  onMainMenu
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback if canvas-confetti fails
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const winner = players.find(p => p.id === winnerPlayerId) || players[0];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Trophy icon */}
        <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/20">
          <Trophy className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Match Concluded</span>
          <h2 className="text-2xl font-black text-neutral-100 mt-1">{winner.name} Triumphs!</h2>
          <p className="text-xs text-neutral-400 mt-1">Carrom Board cleared</p>
        </div>

        {/* Score Leaderboard */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 divide-y divide-neutral-800">
          {sortedPlayers.map((p, idx) => (
            <div key={p.id} className="py-2 flex items-center justify-between text-sm first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {idx + 1}
                </span>
                <span className="font-semibold text-neutral-200">{p.name}</span>
                <span className="text-[11px] text-neutral-500">({p.assignedColor})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">{p.fouls} fouls</span>
                <span className="font-bold text-amber-400">{p.score} pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={onRematch}
            className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch</span>
          </button>
          <button
            onClick={onMainMenu}
            className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
