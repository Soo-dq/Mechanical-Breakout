# Mechanical-Breakout

## Play locally
Open `/home/runner/work/Mechanical-Breakout/Mechanical-Breakout/index.html` in a browser.

## Online duel (lightweight 1v1)
This repository now includes a minimal WebSocket room server for "same seed / same start / race result" matches.

### 1) Start server
```bash
cd /home/runner/work/Mechanical-Breakout/Mechanical-Breakout
npm install
npm start
```
Server default: `ws://localhost:8080`

### GitHub Pages

GitHub Pages can host the game UI, but it cannot run `server.js`. Online
matches therefore require a separately deployed WebSocket server with a
public `wss://` URL. Enter that URL in the **WS URL** field before clicking
**接続**. The local default (`ws://localhost:8080`) is only for local
development.

### 2) Connect clients
- Open the game in two browser tabs/devices.
- Enter player names.
- Set WS URL (default auto-filled).
- One player clicks **ルーム作成**, the other enters room ID and clicks **参加**.
- Match auto-starts when 2 players are in the room.

### Rules (current implementation)
- Both players receive the same seed and start level.
- First ranking priority: clear vs fail.
- Tie-breakers: shorter clear time, fewer shots, then earlier submission.
