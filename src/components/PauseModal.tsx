import React from 'react';
import { Volume2, VolumeX, RotateCcw, Play, Home, BookOpen } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onMainMenu,
  soundEnabled,
  onToggleSound
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-neutral-100">
        <div className="text-center pb-2 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-amber-400">Match Paused</h2>
          <p className="text-xs text-neutral-400">Game session suspended</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Game</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Match</span>
          </button>

          <button
            onClick={onToggleSound}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            <span>Sound Effects: {soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-rose-950/40 text-neutral-300 hover:text-rose-300 font-semibold rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>Exit to Main Menu</span>
          </button>
        </div>

        {/* Quick Rules Reminder */}
        <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
          <div className="flex items-center gap-1 font-semibold text-amber-300">
            <BookOpen className="w-3.5 h-3.5" /> Official Rules Quick Ref:
          </div>
          <p>• <b>Queen (+30 pts):</b> Pocketing queen requires covering it with your own coin on that shot or next shot.</p>
          <p>• <b>Foul (-5 pts):</b> Pocketing striker forfeits turn and incurs a Due penalty coin return.</p>
          <p>• <b>Continuous Turn:</b> Pocketing your own coin awards an extra shot.</p>
        </div>
      </div>
    </div>
  );
};
