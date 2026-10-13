# Mechanical-Breakout

## Play locally
Open `/home/runner/work/Mechanical-Breakout/Mechanical-Breakout/index.html` in a browser.

## Same-device two-player mode
The GitHub Pages version supports two players simultaneously on one
smartphone or browser without an external server. The game opens two
independent frames: the lower player uses the normal frame and the upper
player uses the upside-down frame. Each player controls their own game at
the same time.

## Optional local server
The Node server is retained for local development and diagnostics:
```bash
cd /home/runner/work/Mechanical-Breakout/Mechanical-Breakout
npm install
npm start
```
Server default: `ws://localhost:8080`

The Pages game itself does not need this server.
