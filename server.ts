import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());

interface RoomPlayer {
  id: string;
  name: string;
  seat: number;
  assignedColor: 'WHITE' | 'BLACK';
  isReady: boolean;
}

interface Room {
  code: string;
  mode: 'TWO_PLAYER' | 'FOUR_PLAYER';
  hostId: string;
  players: RoomPlayer[];
  currentTurnSeat: number;
  createdTime: number;
  sseClients: Response[];
}

const rooms = new Map<string, Room>();

// Helper to broadcast SSE event to all connected clients in a room
function broadcastToRoom(room: Room, eventType: string, data: unknown) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  room.sseClients = room.sseClients.filter((client) => {
    try {
      client.write(payload);
      return true;
    } catch {
      return false;
    }
  });
}

// 1. Create Online Room
app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { hostName, mode = 'TWO_PLAYER' } = req.body;
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const hostId = `player_${Date.now()}`;

  const hostPlayer: RoomPlayer = {
    id: hostId,
    name: hostName || 'Player 1',
    seat: 0,
    assignedColor: 'WHITE',
    isReady: true,
  };

  const room: Room = {
    code,
    mode,
    hostId,
    players: [hostPlayer],
    currentTurnSeat: 0,
    createdTime: Date.now(),
    sseClients: [],
  };

  rooms.set(code, room);
  res.json({ success: true, roomCode: code, player: hostPlayer, room });
});

// 2. Join Online Room
app.post('/api/rooms/join', (req: Request, res: Response) => {
  const { roomCode, playerName } = req.body;
  const cleanCode = (roomCode || '').toString().trim().toUpperCase();
  const room = rooms.get(cleanCode);

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found. Check the room code.' });
  }

  const maxPlayers = room.mode === 'FOUR_PLAYER' ? 4 : 2;
  if (room.players.length >= maxPlayers) {
    return res.status(400).json({ success: false, message: 'Room is already full.' });
  }

  const seat = room.mode === 'TWO_PLAYER' ? 2 : room.players.length;
  const assignedColor: 'WHITE' | 'BLACK' = room.mode === 'TWO_PLAYER' ? 'BLACK' : (seat % 2 === 0 ? 'WHITE' : 'BLACK');

  const newPlayer: RoomPlayer = {
    id: `player_${Date.now()}_${Math.floor(Math.random() * 100)}`,
    name: playerName || `Player ${room.players.length + 1}`,
    seat,
    assignedColor,
    isReady: true,
  };

  room.players.push(newPlayer);
  broadcastToRoom(room, 'PLAYER_JOINED', { players: room.players, newPlayer });

  res.json({ success: true, roomCode: cleanCode, player: newPlayer, room });
});

// 3. Room Details
app.get('/api/rooms/:code', (req: Request, res: Response) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const room = rooms.get(cleanCode);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }
  res.json({
    success: true,
    code: room.code,
    mode: room.mode,
    players: room.players,
    currentTurnSeat: room.currentTurnSeat,
  });
});

// 4. Server-Sent Events (SSE) Stream for real-time room communication
app.get('/api/rooms/:code/events', (req: Request, res: Response) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const room = rooms.get(cleanCode);

  if (!room) {
    return res.status(404).send('Room not found');
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ code: room.code, players: room.players })}\n\n`);
  room.sseClients.push(res);

  req.on('close', () => {
    room.sseClients = room.sseClients.filter((c) => c !== res);
  });
});

// 5. Broadcast Shot Action to All Connected Players
app.post('/api/rooms/:code/shot', (req: Request, res: Response) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const room = rooms.get(cleanCode);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const { dir, power, sliderRatio, seat, playerId } = req.body;
  broadcastToRoom(room, 'SHOT_ACTION', { dir, power, sliderRatio, seat, playerId });
  res.json({ success: true });
});

// 6. State Sync / Turn Change / Chat Broadcast
app.post('/api/rooms/:code/sync', (req: Request, res: Response) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const room = rooms.get(cleanCode);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const { nextSeat, announcement, scores, eventType = 'STATE_SYNC' } = req.body;
  if (typeof nextSeat === 'number') {
    room.currentTurnSeat = nextSeat;
  }
  broadcastToRoom(room, eventType, { nextSeat, announcement, scores, senderId: req.body.senderId });
  res.json({ success: true });
});

// 7. Quick Chat / Emoji Reactions
app.post('/api/rooms/:code/chat', (req: Request, res: Response) => {
  const cleanCode = req.params.code.trim().toUpperCase();
  const room = rooms.get(cleanCode);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const { senderName, message } = req.body;
  broadcastToRoom(room, 'CHAT_MESSAGE', { senderName, message, timestamp: Date.now() });
  res.json({ success: true });
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
