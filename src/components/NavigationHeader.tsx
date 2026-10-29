import React from 'react';
import { GameMode } from '../types/carrom';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  FolderGit2,
  Users,
  Target,
  Sparkles,
  Wifi
} from 'lucide-react';

interface NavigationHeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenLobby: () => void;
  onOpenPause: () => void;
  onOpenGodotSuite: () => void;
  onOpenCredits: () => void;
  onResetBoard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenLobby,
  onOpenPause,
  onOpenGodotSuite,
  onOpenCredits,
  onResetBoard,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <header className="w-full bg-neutral-900/90 border-b border-amber-950/60 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/20 text-lg border border-amber-300">
          C
        </div>
        <div>
          <h1 className="text-sm font-black text-amber-200 tracking-wide uppercase flex items-center gap-1.5">
            <span>Friends Arena</span>
            <span className="text-amber-500 font-extrabold text-xs px-1.5 py-0.2 bg-amber-500/20 rounded border border-amber-500/30">
              CARROM
            </span>
          </h1>
          <p className="text-[10px] text-neutral-400">Android 2D Multiplayer • Godot 4.3</p>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
        <button
          onClick={() => onSelectMode('PRACTICE')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
            currentMode === 'PRACTICE'
              ? 'bg-amber-500 text-neutral-950 shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Practice</span>
        </button>

        <button
          onClick={() => onSelectMode('TWO_PLAYER')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
            currentMode === 'TWO_PLAYER'
              ? 'bg-amber-500 text-neutral-950 shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>2 Players</span>
        </button>

        <button
          onClick={() => onSelectMode('FOUR_PLAYER')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
            currentMode === 'FOUR_PLAYER'
              ? 'bg-amber-500 text-neutral-950 shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>4 Players</span>
        </button>

        <button
          onClick={onOpenLobby}
          className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 text-amber-300 hover:bg-neutral-800 transition"
        >
          <Wifi className="w-3.5 h-3.5 text-sky-400" />
          <span>Lobby / Room</span>
        </button>
      </div>

      {/* Tool Buttons */}
      <div className="flex items-center gap-2">
        {/* Reset match */}
        <button
          onClick={onResetBoard}
          title="Reset Coins"
          className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>

        {/* Pause Game */}
        <button
          onClick={onOpenPause}
          title="Pause Match"
          className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
        >
          <Pause className="w-4 h-4" />
        </button>

        {/* Godot Suite / APK Pipeline */}
        <button
          onClick={onOpenGodotSuite}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow"
        >
          <FolderGit2 className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">APK Pipeline</span>
        </button>

        {/* Creator Sayful Islam Profile Button */}
        <button
          onClick={onOpenCredits}
          className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-gradient-to-r from-amber-950 to-neutral-900 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-semibold text-amber-200 transition shadow"
        >
          <img
            src="/assets/aistudio/Create_a_professional_realistic_corporate_headsho-1784622602217_8389bbdd.png"
            alt="Sayful Islam"
            className="w-6 h-6 rounded-full object-cover border border-amber-400"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('public/')) {
                target.src = '/public/assets/aistudio/Create_a_professional_realistic_corporate_headsho-1784622602217_8389bbdd.png';
              }
            }}
          />
          <span className="hidden md:inline">Sayful Islam</span>
        </button>
      </div>
    </header>
  );
};
