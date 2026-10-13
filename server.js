const http = require('http');
const { WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 8080);
const server = http.createServer((_, res) => {
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Mechanical Breakout match server');
});
const wss = new WebSocketServer({ server });

const rooms = new Map();
const peers = new Map();

function id(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function safeSend(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function roomSnapshot(room) {
  return {
    roomId: room.id,
    players: room.players.map((p) => ({ id: p.id, name: p.name })),
  };
}

function emitRoom(room) {
  const snap = roomSnapshot(room);
  room.players.forEach((p) => safeSend(p.ws, { type: 'room_update', ...snap }));
}

function createRoom(host) {
  let roomId = id(6);
  while (rooms.has(roomId)) roomId = id(6);
  const room = {
    id: roomId,
    seed: null,
    level: 1,
    started: false,
    players: [host],
    results: new Map(),
  };
  rooms.set(roomId, room);
  host.roomId = roomId;
  emitRoom(room);
}

function leaveRoom(peer) {
  if (!peer.roomId) return;
  const room = rooms.get(peer.roomId);
  peer.roomId = '';
  if (!room) return;
  room.players = room.players.filter((p) => p.id !== peer.id);
  room.results.delete(peer.id);
  if (!room.players.length) {
    rooms.delete(room.id);
    return;
  }
  if (room.started && room.players.length === 1) {
    const survivor = room.players[0];
    const now = Date.now();
    room.results.set(survivor.id, {
      playerId: survivor.id,
      name: survivor.name,
      cleared: true,
      time: 0,
      shots: 0,
      submittedAt: now,
    });
    finalizeMatch(room);
    return;
  }
  emitRoom(room);
}

function startMatchIfReady(room) {
  if (room.started || room.players.length !== 2) return;
  room.seed = Math.floor(Math.random() * 1_000_000);
  room.level = 1;
  room.started = true;
  room.results.clear();
  room.players.forEach((p) => {
    safeSend(p.ws, { type: 'match_start', roomId: room.id, seed: room.seed, level: room.level });
  });
}

function finalizeMatch(room) {
  if (!room.started) return;
  const list = Array.from(room.results.values());
  if (!list.length) return;
  list.sort((a, b) => {
    if (a.cleared !== b.cleared) return a.cleared ? -1 : 1;
    if (a.time !== b.time) return a.time - b.time;
    if (a.shots !== b.shots) return a.shots - b.shots;
    return a.submittedAt - b.submittedAt;
  });
  const winnerId = list[0].playerId;
  room.players.forEach((p) => {
    safeSend(p.ws, { type: 'match_result', roomId: room.id, winnerId, results: list });
  });
  room.started = false;
  room.results.clear();
}

wss.on('connection', (ws) => {
  const peer = { id: id(8), ws, roomId: '', name: 'Player' };
  peers.set(ws, peer);
  safeSend(ws, { type: 'welcome', playerId: peer.id });

  ws.on('message', (buf) => {
    let msg;
    try {
      msg = JSON.parse(buf.toString());
    } catch {
      safeSend(ws, { type: 'error', message: 'JSON parse error' });
      return;
    }
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'create_room') {
      peer.name = String(msg.name || 'Player').slice(0, 20);
      leaveRoom(peer);
      createRoom(peer);
      return;
    }

    if (msg.type === 'join_room') {
      const roomId = String(msg.roomId || '').toUpperCase();
      const room = rooms.get(roomId);
      if (!room) return safeSend(ws, { type: 'error', message: 'ルームが見つかりません' });
      if (room.players.length >= 2) return safeSend(ws, { type: 'error', message: 'ルームが満員です' });
      peer.name = String(msg.name || 'Player').slice(0, 20);
      leaveRoom(peer);
      room.players.push(peer);
      peer.roomId = roomId;
      emitRoom(room);
      startMatchIfReady(room);
      return;
    }

    if (msg.type === 'submit_result') {
      const room = rooms.get(peer.roomId);
      if (!room || !room.started) return;
      const cleared = !!msg.cleared;
      const time = Number(msg.time);
      const shots = Number(msg.shots);
      room.results.set(peer.id, {
        playerId: peer.id,
        name: peer.name,
        cleared,
        time: Number.isFinite(time) && time >= 0 ? time : 9999,
        shots: Number.isFinite(shots) && shots >= 0 ? shots : 999,
        submittedAt: Date.now(),
      });
      if (room.results.size >= room.players.length) finalizeMatch(room);
      return;
    }
  });

  ws.on('close', () => {
    leaveRoom(peer);
    peers.delete(ws);
  });
});

server.listen(port, () => {
  console.log(`match server running on :${port}`);
});
