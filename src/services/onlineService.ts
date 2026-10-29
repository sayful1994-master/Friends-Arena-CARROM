export interface OnlinePlayer {
  id: string;
  name: string;
  seat: number;
  assignedColor: 'WHITE' | 'BLACK';
  isReady: boolean;
}

export interface OnlineRoom {
  code: string;
  mode: 'TWO_PLAYER' | 'FOUR_PLAYER';
  hostId: string;
  players: OnlinePlayer[];
  currentTurnSeat: number;
}

export interface ShotActionPayload {
  dir: { x: number; y: number };
  power: number;
  sliderRatio: number;
  seat: number;
  playerId: string;
}

export class OnlineService {
  private eventSource: EventSource | null = null;

  async createRoom(hostName: string, mode: 'TWO_PLAYER' | 'FOUR_PLAYER' = 'TWO_PLAYER') {
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, mode }),
    });
    return res.json();
  }

  async joinRoom(roomCode: string, playerName: string) {
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, playerName }),
    });
    return res.json();
  }

  async sendShot(roomCode: string, shotData: ShotActionPayload) {
    await fetch(`/api/rooms/${roomCode}/shot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shotData),
    });
  }

  async sendSync(roomCode: string, syncData: Record<string, unknown>) {
    await fetch(`/api/rooms/${roomCode}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncData),
    });
  }

  async sendChat(roomCode: string, senderName: string, message: string) {
    await fetch(`/api/rooms/${roomCode}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName, message }),
    });
  }

  listenToRoom(
    roomCode: string,
    callbacks: {
      onPlayerJoined?: (data: { players: OnlinePlayer[]; newPlayer: OnlinePlayer }) => void;
      onShotAction?: (data: ShotActionPayload) => void;
      onStateSync?: (data: { nextSeat?: number; announcement?: string; scores?: Record<string, number> }) => void;
      onChatMessage?: (data: { senderName: string; message: string; timestamp: number }) => void;
      onError?: (err: Event) => void;
    }
  ) {
    this.disconnect();
    const es = new EventSource(`/api/rooms/${roomCode}/events`);
    this.eventSource = es;

    es.addEventListener('PLAYER_JOINED', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        callbacks.onPlayerJoined?.(data);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('SHOT_ACTION', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        callbacks.onShotAction?.(data);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('STATE_SYNC', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        callbacks.onStateSync?.(data);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('CHAT_MESSAGE', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        callbacks.onChatMessage?.(data);
      } catch (err) {
        console.error(err);
      }
    });

    es.onerror = (err) => {
      callbacks.onError?.(err);
    };

    return es;
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  getInviteLink(roomCode: string): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/?room=${roomCode}`;
  }
}

export const onlineService = new OnlineService();
