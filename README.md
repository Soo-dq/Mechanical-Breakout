# Mechanical-Breakout

## Play locally
Open `/home/runner/work/Mechanical-Breakout/Mechanical-Breakout/index.html` in a browser.

## Same-device two-player mode
The GitHub Pages version supports a two-player match on one smartphone or
browser without an external server. Players take turns on the same board:
the lower player goes first, then the upper player uses the upside-down
display and controls. The result is decided by clear/fail, then time and
shots.

## Optional local server
The Node server is retained for local development and diagnostics:
```bash
cd /home/runner/work/Mechanical-Breakout/Mechanical-Breakout
npm install
npm start
```
Server default: `ws://localhost:8080`

The Pages game itself does not need this server.
