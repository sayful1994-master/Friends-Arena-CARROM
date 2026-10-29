import React, { useState } from 'react';
import { GameMode, ConnectivityType, Player, PlayerSeat } from '../types/carrom';
import {
  Globe,
  Wifi,
  Radio,
  Bluetooth,
  Users,
  Play,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  Loader2
} from 'lucide-react';
import { onlineService } from '../services/onlineService';

interface LobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (players: Player[], mode: GameMode, transport: ConnectivityType, onlineRoomCode?: string, localPlayerId?: string) => void;
  initialRoomCode?: string;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  isOpen,
  onClose,
  onStartMatch,
  initialRoomCode = ''
}) => {
  const [activeTab, setActiveTab] = useState<'ONLINE_SERVER' | 'LOCAL_OFFLINE'>('ONLINE_SERVER');
  const [mode, setMode] = useState<GameMode>('TWO_PLAYER');
  const [localTransport, setLocalTransport] = useState<ConnectivityType>('WIFI_HOTSPOT');
  const [playerName, setPlayerName] = useState<string>('Player 1');

  // Online Room State
  const [onlineAction, setOnlineAction] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [inputCode, setInputCode] = useState<string>(initialRoomCode);
  const [createdRoomCode, setCreatedRoomCode] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Local Match Seats Mock
  const [localSeats] = useState<{ name: string; isReady: boolean }[]>([
    { name: 'Player 1 (You)', isReady: true },
    { name: 'Player 2 (Friend / AI)', isReady: true },
    { name: 'Player 3 (Teammate)', isReady: true },
    { name: 'Player 4 (Opponent)', isReady: true },
  ]);

  if (!isOpen) return null;

  // 1. Create Online Room on Server
  const handleCreateOnlineRoom = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      const res = await onlineService.createRoom(playerName || 'Player 1', mode === 'FOUR_PLAYER' ? 'FOUR_PLAYER' : 'TWO_PLAYER');
      if (res.success) {
        setCreatedRoomCode(res.roomCode);
        const hostPlayer: Player = {
          id: res.player.id,
          name: res.player.name,
          seat: 0,
          assignedColor: 'WHITE',
          score: 0,
          fouls: 0,
          isReady: true,
          isHost: true,
        };
        // Wait in lobby until friend joins or start with waiting slot
        const opponentPlaceholder: Player = {
          id: 'waiting_peer',
          name: 'Waiting for friend...',
          seat: 2,
          assignedColor: 'BLACK',
          score: 0,
          fouls: 0,
          isReady: false,
          isHost: false,
        };
        onStartMatch([hostPlayer, opponentPlaceholder], mode, 'WIFI_HOTSPOT', res.roomCode, hostPlayer.id);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to create room.');
      }
    } catch {
      setErrorMsg('Could not connect to online multiplayer server.');
    } finally {
      setIsConnecting(false);
    }
  };

  // 2. Join Existing Online Room
  const handleJoinOnlineRoom = async () => {
    if (!inputCode.trim()) {
      setErrorMsg('Please enter a 4-digit room code.');
      return;
    }
    setIsConnecting(true);
    setErrorMsg('');
    try {
      const res = await onlineService.joinRoom(inputCode.trim(), playerName || 'Player 2');
      if (res.success) {
        const joinedPlayer: Player = {
          id: res.player.id,
          name: res.player.name,
          seat: res.player.seat as PlayerSeat,
          assignedColor: res.player.assignedColor,
          score: 0,
          fouls: 0,
          isReady: true,
          isHost: false,
        };
        const allPlayers: Player[] = res.room.players.map((p: { id: string; name: string; seat: number; assignedColor: 'WHITE' | 'BLACK' }) => ({
          id: p.id,
          name: p.name,
          seat: p.seat as PlayerSeat,
          assignedColor: p.assignedColor,
          score: 0,
          fouls: 0,
          isReady: true,
          isHost: p.seat === 0,
        }));

        onStartMatch(allPlayers, res.room.mode, 'WIFI_HOTSPOT', res.roomCode, joinedPlayer.id);
        onClose();
      } else {
        setErrorMsg(res.message || 'Could not join room.');
      }
    } catch {
      setErrorMsg('Connection error. Please check the room code.');
    } finally {
      setIsConnecting(false);
    }
  };

  // 3. Launch Local Match (Offline/Practice)
  const handleLaunchLocal = () => {
    const totalCount = mode === 'FOUR_PLAYER' ? 4 : 2;
    const finalPlayers: Player[] = [];
    for (let i = 0; i < totalCount; i++) {
      const seat = (mode === 'TWO_PLAYER' && i === 1 ? 2 : i) as PlayerSeat;
      const assignedColor = (mode === 'TWO_PLAYER' ? (i === 0 ? 'WHITE' : 'BLACK') : (i % 2 === 0 ? 'WHITE' : 'BLACK'));
      finalPlayers.push({
        id: `local_p_${i + 1}`,
        name: i === 0 ? playerName : localSeats[i].name,
        seat,
        assignedColor,
        score: 0,
        fouls: 0,
        isReady: true,
        isHost: i === 0,
        isAI: i > 0,
      });
    }
    onStartMatch(finalPlayers, mode, localTransport);
    onClose();
  };

  const handleCopyInviteLink = (code: string) => {
    const link = onlineService.getInviteLink(code);
    navigator.clipboard?.writeText?.(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-bold text-amber-400">Play With Friends (অনলাইনে খেলুন)</h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Connect in real-time via online room link or offline local Wi-Fi
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection: Online Internet vs Offline Local */}
        <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('ONLINE_SERVER')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'ONLINE_SERVER'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Online Internet Room</span>
          </button>
          <button
            onClick={() => setActiveTab('LOCAL_OFFLINE')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'LOCAL_OFFLINE'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Wifi className="w-4 h-4 text-amber-400" />
            <span>Local Hotspot / Offline</span>
          </button>
        </div>

        {/* Player Name Input */}
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
            Your Nickname (আপনার নাম)
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* TAB 1: ONLINE INTERNET ROOM */}
        {activeTab === 'ONLINE_SERVER' && (
          <div className="space-y-4">
            {/* Create vs Join Sub-toggle */}
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
              <button
                onClick={() => setOnlineAction('CREATE')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  onlineAction === 'CREATE' ? 'bg-neutral-800 text-amber-300 shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                1. Create New Room (রুম তৈরি করুন)
              </button>
              <button
                onClick={() => setOnlineAction('JOIN')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  onlineAction === 'JOIN' ? 'bg-neutral-800 text-amber-300 shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                2. Join with Code (কোড দিয়ে যুক্ত হন)
              </button>
            </div>

            {/* Sub-view: CREATE ROOM */}
            {onlineAction === 'CREATE' && (
              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3.5">
                <div className="text-xs text-neutral-300 leading-relaxed">
                  রুম তৈরি করে বন্ধুদের সাথে ইনভাইট লিংক অথবা ৪ সংখ্যার কোড শেয়ার করুন। বন্ধু লিংকটিতে ক্লিক করলেই সরাসরি খেলায় যোগ দিতে পারবে!
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setMode('TWO_PLAYER')}
                    className={`p-2.5 rounded-lg border text-center font-semibold ${
                      mode === 'TWO_PLAYER' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    2 Players (1v1)
                  </button>
                  <button
                    onClick={() => setMode('FOUR_PLAYER')}
                    className={`p-2.5 rounded-lg border text-center font-semibold ${
                      mode === 'FOUR_PLAYER' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    4 Players (2v2)
                  </button>
                </div>

                <button
                  onClick={handleCreateOnlineRoom}
                  disabled={isConnecting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Room...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Online Room & Get Share Link</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Sub-view: JOIN ROOM */}
            {onlineAction === 'JOIN' && (
              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3.5">
                <div className="text-xs text-neutral-300 leading-relaxed">
                  আপনার বন্ধু যে ৪ সংখ্যার রুম কোডটি পাঠিয়েছে সেটি নিচে দিয়ে <b>Join Match</b> এ ক্লিক করুন।
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                    Enter 4-Digit Room Code (রুম কোড লিখুন)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7482"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-center text-xl font-mono font-bold tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleJoinOnlineRoom}
                  disabled={isConnecting || !inputCode.trim()}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining Room...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Join Friend&apos;s Room</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error banner */}
            {errorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 text-center">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LOCAL HOTSPOT / OFFLINE */}
        {activeTab === 'LOCAL_OFFLINE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLocalTransport('WIFI_HOTSPOT')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium text-center transition ${
                  localTransport === 'WIFI_HOTSPOT'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <Wifi className="w-4 h-4 text-sky-400" />
                <span>Wi-Fi / Hotspot</span>
              </button>
              <button
                onClick={() => setLocalTransport('WIFI_DIRECT')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium text-center transition ${
                  localTransport === 'WIFI_DIRECT'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <Radio className="w-4 h-4 text-purple-400" />
                <span>Wi-Fi Direct</span>
              </button>
              <button
                onClick={() => setLocalTransport('BLUETOOTH')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium text-center transition ${
                  localTransport === 'BLUETOOTH'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <Bluetooth className="w-4 h-4 text-blue-400" />
                <span>Bluetooth</span>
              </button>
            </div>

            <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-xs text-neutral-300 space-y-1.5">
              <p>• <b>মোবাইল হটস্পট:</b> একটি ফোন থেকে হটস্পট চালু করে অন্য বন্ধুকে ওয়াইফাইতে যুক্ত করুন।</p>
              <p>• <b>কোন ইন্টারনেট দরকার নেই:</b> লোকাল নেটওয়ার্কে ০% ইন্টারনেট ডাটা ছাড়াই দ্রুত খেলা যায়।</p>
            </div>

            <button
              onClick={handleLaunchLocal}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition"
            >
              <Play className="w-4 h-4" />
              <span>Launch Local Match</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
