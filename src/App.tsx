import React, { useState, useCallback, useEffect } from 'react';
import {
  Coin,
  CoinType,
  Player,
  PlayerSeat,
  GameMode,
  ConnectivityType,
  QueenState,
  Vector2D
} from './types/carrom';
import {
  createInitialCoins,
  createStriker,
  BOARD_SIZE
} from './engine/carromPhysics';
import { evaluateShot } from './engine/rulesEngine';
import { sounds } from './audio/soundEffects';
import { onlineService, ShotActionPayload } from './services/onlineService';

import { CarromCanvas } from './components/CarromCanvas';
import { ScoreBoard } from './components/ScoreBoard';
import { NavigationHeader } from './components/NavigationHeader';
import { LobbyModal } from './components/LobbyModal';
import { PauseModal } from './components/PauseModal';
import { ResultModal } from './components/ResultModal';
import { CreditsModal } from './components/CreditsModal';
import { GodotSuiteModal } from './components/GodotSuiteModal';
import { Globe, Copy, Check, Users, MessageSquare, Sparkles } from 'lucide-react';

export default function App() {
  // Game Setup State
  const [gameMode, setGameMode] = useState<GameMode>('TWO_PLAYER');
  const [transport, setTransport] = useState<ConnectivityType>('LOCAL_OFFLINE');

  // Online Multiplayer State
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string>('p1');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [chatToast, setChatToast] = useState<{ sender: string; msg: string } | null>(null);

  // Players
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 'p1',
      name: 'Player 1',
      seat: 0, // South
      assignedColor: 'WHITE',
      score: 0,
      fouls: 0,
      isReady: true,
      isHost: true
    },
    {
      id: 'p2',
      name: 'Player 2',
      seat: 2, // North
      assignedColor: 'BLACK',
      score: 0,
      fouls: 0,
      isReady: true,
      isHost: false
    }
  ]);

  const [activeSeat, setActiveSeat] = useState<number>(0);

  // Coins & Striker
  const [coins, setCoins] = useState<Coin[]>(() => createInitialCoins());
  const [sliderRatio, setSliderRatio] = useState<number>(0.5);
  const [striker, setStriker] = useState<Coin>(() => createStriker(0, 0.5));

  // Simulation & Turn Tracking
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [pocketedThisShot, setPocketedThisShot] = useState<CoinType[]>([]);
  const [hasStrikerFoul, setHasStrikerFoul] = useState<boolean>(false);

  // Queen State
  const [queenState, setQueenState] = useState<QueenState>({
    pocketedBySeat: null,
    isCovered: false,
    pendingCover: false
  });

  // UI & Modals
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('Match ready! Drag the striker backwards to aim and shoot.');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [isPauseOpen, setIsPauseOpen] = useState<boolean>(false);
  const [isResultOpen, setIsResultOpen] = useState<boolean>(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState<boolean>(false);
  const [isGodotSuiteOpen, setIsGodotSuiteOpen] = useState<boolean>(false);
  const [winnerPlayerId, setWinnerPlayerId] = useState<string | undefined>(undefined);
  const [urlRoomParam, setUrlRoomParam] = useState<string>('');

  // Active Player helper
  const activePlayer = players.find(p => p.seat === activeSeat) || players[0];
  const isMyTurn = !onlineRoomCode || activePlayer.id === localPlayerId;

  // Check URL query on load for ?room=XXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        setUrlRoomParam(room);
        setIsLobbyOpen(true);
      }
    }
  }, []);

  // Real-time Online Event Stream Listener
  useEffect(() => {
    if (!onlineRoomCode) return;

    const es = onlineService.listenToRoom(onlineRoomCode, {
      onPlayerJoined: (data) => {
        setPlayers(prev => {
          const updated = data.players.map((p, idx) => ({
            id: p.id,
            name: p.name,
            seat: p.seat as PlayerSeat,
            assignedColor: p.assignedColor,
            score: 0,
            fouls: 0,
            isReady: true,
            isHost: idx === 0,
          }));
          return updated;
        });
        setLastAnnouncement(`🎉 ${data.newPlayer.name} joined the online room! Ready to play.`);
      },
      onShotAction: (shot: ShotActionPayload) => {
        // If this shot was fired by another player, execute it locally
        if (shot.playerId !== localPlayerId) {
          setSliderRatio(shot.sliderRatio);
          setStriker(createStriker(shot.seat as PlayerSeat, shot.sliderRatio));
          setPocketedThisShot([]);
          setHasStrikerFoul(false);

          setStriker(prev => ({
            ...prev,
            vx: shot.dir.x * shot.power,
            vy: shot.dir.y * shot.power
          }));
          setIsSimulating(true);
          sounds.playStrike(Math.min(1.0, shot.power / 1200));
        }
      },
      onStateSync: (data) => {
        if (typeof data.nextSeat === 'number') {
          setActiveSeat(data.nextSeat);
          setStriker(createStriker(data.nextSeat as PlayerSeat, 0.5));
        }
        if (data.announcement) {
          setLastAnnouncement(data.announcement);
        }
      },
      onChatMessage: (data) => {
        setChatToast({ sender: data.senderName, msg: data.message });
        setTimeout(() => setChatToast(null), 3500);
      }
    });

    return () => {
      es?.close();
    };
  }, [onlineRoomCode, localPlayerId]);

  // Re-position striker when slider or active seat changes
  const updateStrikerPosition = useCallback((seat: PlayerSeat, ratio: number) => {
    setSliderRatio(ratio);
    setStriker(createStriker(seat, ratio));
  }, []);

  const handleStrikerSliderChange = (ratio: number) => {
    if (isSimulating || !isMyTurn) return;
    updateStrikerPosition(activeSeat as PlayerSeat, ratio);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  // Start new match
  const resetMatch = useCallback((mode: GameMode = gameMode, customPlayers?: Player[], roomCode?: string, myId?: string) => {
    const initialCoins = createInitialCoins();
    setCoins(initialCoins);
    setPocketedThisShot([]);
    setHasStrikerFoul(false);
    setQueenState({
      pocketedBySeat: null,
      isCovered: false,
      pendingCover: false
    });
    setIsSimulating(false);
    setIsResultOpen(false);
    setWinnerPlayerId(undefined);

    if (roomCode) {
      setOnlineRoomCode(roomCode);
    } else {
      setOnlineRoomCode(null);
    }

    if (myId) {
      setLocalPlayerId(myId);
    }

    let finalPlayers = customPlayers;
    if (!finalPlayers) {
      if (mode === 'PRACTICE') {
        finalPlayers = [{
          id: 'p1',
          name: 'Solo Player',
          seat: 0,
          assignedColor: 'WHITE',
          score: 0,
          fouls: 0,
          isReady: true,
          isHost: true
        }];
      } else if (mode === 'FOUR_PLAYER') {
        finalPlayers = [
          { id: 'p1', name: 'Team A (P1)', seat: 0, assignedColor: 'WHITE', score: 0, fouls: 0, isReady: true, isHost: true },
          { id: 'p2', name: 'Team B (P2)', seat: 1, assignedColor: 'BLACK', score: 0, fouls: 0, isReady: true, isHost: false },
          { id: 'p3', name: 'Team A (P3)', seat: 2, assignedColor: 'WHITE', score: 0, fouls: 0, isReady: true, isHost: false },
          { id: 'p4', name: 'Team B (P4)', seat: 3, assignedColor: 'BLACK', score: 0, fouls: 0, isReady: true, isHost: false }
        ];
      } else {
        finalPlayers = [
          { id: 'p1', name: 'Player 1', seat: 0, assignedColor: 'WHITE', score: 0, fouls: 0, isReady: true, isHost: true },
          { id: 'p2', name: 'Player 2', seat: 2, assignedColor: 'BLACK', score: 0, fouls: 0, isReady: true, isHost: false }
        ];
      }
    }

    setPlayers(finalPlayers);
    setActiveSeat(finalPlayers[0].seat);
    setSliderRatio(0.5);
    setStriker(createStriker(finalPlayers[0].seat as PlayerSeat, 0.5));
    setLastAnnouncement(`New ${mode.replace('_', ' ')} Match Started! ${finalPlayers[0].name} to shoot.`);
  }, [gameMode]);

  // Mode Selection
  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    setOnlineRoomCode(null);
    resetMatch(mode);
  };

  // Launch from Lobby
  const handleLobbyStartMatch = (
    newLobbyPlayers: Player[],
    mode: GameMode,
    selectedTransport: ConnectivityType,
    roomCode?: string,
    myId?: string
  ) => {
    setGameMode(mode);
    setTransport(selectedTransport);
    resetMatch(mode, newLobbyPlayers, roomCode, myId);
  };

  // Shot Release Trigger
  const handleShotRelease = (dir: Vector2D, power: number) => {
    if (isSimulating || !isMyTurn) return;
    setPocketedThisShot([]);
    setHasStrikerFoul(false);

    setStriker(prev => ({
      ...prev,
      vx: dir.x * power,
      vy: dir.y * power
    }));
    setIsSimulating(true);

    // If in online room, broadcast shot to opponent
    if (onlineRoomCode) {
      onlineService.sendShot(onlineRoomCode, {
        dir,
        power,
        sliderRatio,
        seat: activeSeat,
        playerId: localPlayerId
      });
    }
  };

  // Coin Pocketed Callback
  const handleCoinPocketed = (potted: Coin) => {
    if (potted.type === 'STRIKER') {
      setHasStrikerFoul(true);
    } else {
      setPocketedThisShot(prev => [...prev, potted.type]);
    }
  };

  // Physics Stopped -> Evaluate Turn and Outcome
  const handlePhysicsStopped = () => {
    setIsSimulating(false);

    const outcome = evaluateShot(
      activePlayer,
      pocketedThisShot,
      hasStrikerFoul,
      queenState,
      players,
      coins,
      gameMode
    );

    setLastAnnouncement(outcome.announcement);

    // Update Player Scores and Fouls
    setPlayers(prev => prev.map(p => {
      if (p.id === activePlayer.id) {
        return {
          ...p,
          score: Math.max(0, p.score + outcome.pointsAdded),
          fouls: outcome.foulReason ? p.fouls + 1 : p.fouls
        };
      }
      return p;
    }));

    // Return penalty or uncovered Queen to center
    if (outcome.returnedCoins.length > 0) {
      setCoins(prevCoins => {
        const next = [...prevCoins];
        outcome.returnedCoins.forEach(coinType => {
          const coinToReturn = next.find(c => c.isPocketed && c.type === coinType);
          if (coinToReturn) {
            coinToReturn.isPocketed = false;
            coinToReturn.x = BOARD_SIZE / 2 + (Math.random() * 8 - 4);
            coinToReturn.y = BOARD_SIZE / 2 + (Math.random() * 8 - 4);
            coinToReturn.vx = 0;
            coinToReturn.vy = 0;
            coinToReturn.sinkScale = 1.0;
            coinToReturn.sinkOpacity = 1.0;
          }
        });
        return next;
      });
    }

    // Check Game Over
    if (outcome.isGameOver) {
      setWinnerPlayerId(outcome.winnerPlayerId);
      setIsResultOpen(true);
      return;
    }

    // Advance to next seat
    const nextSeat = outcome.nextTurnSeat;
    setActiveSeat(nextSeat);
    setSliderRatio(0.5);
    setStriker(createStriker(nextSeat as PlayerSeat, 0.5));
    setPocketedThisShot([]);
    setHasStrikerFoul(false);

    // If host in online room, broadcast turn sync
    if (onlineRoomCode && activePlayer.id === localPlayerId) {
      onlineService.sendSync(onlineRoomCode, {
        nextSeat,
        announcement: outcome.announcement,
      });
    }
  };

  // Copy Online Room Link
  const handleCopyOnlineLink = () => {
    if (!onlineRoomCode) return;
    const link = onlineService.getInviteLink(onlineRoomCode);
    navigator.clipboard?.writeText?.(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Quick Emoji Reaction in Online Match
  const handleSendEmoji = (emoji: string) => {
    if (!onlineRoomCode) return;
    const myName = players.find(p => p.id === localPlayerId)?.name || 'Player';
    onlineService.sendChat(onlineRoomCode, myName, emoji);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Header */}
      <NavigationHeader
        currentMode={gameMode}
        onSelectMode={handleSelectMode}
        onOpenLobby={() => setIsLobbyOpen(true)}
        onOpenPause={() => setIsPauseOpen(true)}
        onOpenGodotSuite={() => setIsGodotSuiteOpen(true)}
        onOpenCredits={() => setIsCreditsOpen(true)}
        onResetBoard={() => resetMatch(gameMode)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Online Match Active Status Ribbon */}
      {onlineRoomCode && (
        <div className="w-full bg-gradient-to-r from-sky-950/90 via-neutral-900/95 to-sky-950/90 border-b border-sky-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40">
              <Globe className="w-3.5 h-3.5" />
              <span>LIVE ROOM: <b className="font-mono text-amber-300 tracking-wider text-sm">{onlineRoomCode}</b></span>
            </span>

            <span className="text-neutral-300 hidden sm:inline">
              Playing as: <b className="text-amber-200">{players.find(p => p.id === localPlayerId)?.name}</b>
            </span>

            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>{players.filter(p => p.id !== 'waiting_peer').length} Connected</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Emoji Reactions */}
            <div className="flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded-lg border border-neutral-800">
              {['🎯', '👏', '😅', '🔥'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleSendEmoji(emoji)}
                  className="hover:scale-125 transition-transform text-sm px-1"
                  title="Send Reaction"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleCopyOnlineLink}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold rounded-lg flex items-center gap-1.5 shadow transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat Reaction Toast */}
      {chatToast && (
        <div className="fixed bottom-6 right-6 z-40 bg-neutral-900 border border-amber-500/60 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2 text-sm text-neutral-100 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-neutral-400">{chatToast.sender}:</span>
          <span className="text-lg font-bold">{chatToast.msg}</span>
        </div>
      )}

      {/* Main Game Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        {/* Left: Carrom Board Simulation Canvas */}
        <div className="w-full flex justify-center">
          <CarromCanvas
            coins={coins}
            striker={striker}
            activePlayer={activePlayer}
            isSimulating={isSimulating}
            onShotRelease={handleShotRelease}
            onStrikerPositionChange={handleStrikerSliderChange}
            onPhysicsStopped={handlePhysicsStopped}
            onCoinPocketed={handleCoinPocketed}
            sliderRatio={sliderRatio}
          />
        </div>

        {/* Right: HUD, Scoreboard, Instructions & Quick Controls */}
        <div className="w-full lg:max-w-md flex flex-col gap-4">
          {/* Turn Indicator Banner if Online */}
          {onlineRoomCode && (
            <div className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
              isMyTurn
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-neutral-900/80 border-neutral-700 text-neutral-400'
            }`}>
              {isMyTurn ? '👉 It is YOUR turn! Position striker and take your shot.' : `⏳ Waiting for ${activePlayer.name} to shoot...`}
            </div>
          )}

          {/* Live Scoreboard */}
          <ScoreBoard
            players={players}
            activePlayerSeat={activeSeat}
            queenState={queenState}
            coins={coins}
            lastAnnouncement={lastAnnouncement}
          />

          {/* Quick Play & Mobile Guide Card */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Game Controls & Physics Guide</span>
              <span className="text-[10px] text-neutral-500">Android Touchscreen</span>
            </h3>

            <div className="grid grid-cols-1 gap-2 text-xs text-neutral-300">
              <div className="p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <b className="text-amber-200">Position Striker:</b>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Slide the horizontal bar below the board to position your striker along the active baseline.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <b className="text-amber-200">Aim & Power:</b>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Touch & drag backward from the striker. Watch the blue dashed guide line and arc power gauge charge up.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-start gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <b className="text-amber-200">Release & Queen Rule:</b>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Release to flick the striker. Pocketing Queen requires covering it by potting your own coin on that shot or the next shot.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setIsLobbyOpen(true)}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Play Online with Friends</span>
              </button>
              <button
                onClick={() => setIsCreditsOpen(true)}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 font-semibold text-xs rounded-xl transition"
              >
                Credits
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <LobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        onStartMatch={handleLobbyStartMatch}
        initialRoomCode={urlRoomParam}
      />

      <PauseModal
        isOpen={isPauseOpen}
        onResume={() => setIsPauseOpen(false)}
        onRestart={() => {
          setIsPauseOpen(false);
          resetMatch(gameMode);
        }}
        onMainMenu={() => {
          setIsPauseOpen(false);
          setGameMode('TWO_PLAYER');
          resetMatch('TWO_PLAYER');
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <ResultModal
        isOpen={isResultOpen}
        winnerPlayerId={winnerPlayerId}
        players={players}
        onRematch={() => resetMatch(gameMode)}
        onMainMenu={() => {
          setIsResultOpen(false);
          setGameMode('TWO_PLAYER');
          resetMatch('TWO_PLAYER');
        }}
      />

      <CreditsModal
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
      />

      <GodotSuiteModal
        isOpen={isGodotSuiteOpen}
        onClose={() => setIsGodotSuiteOpen(false)}
      />
    </div>
  );
}
