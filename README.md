# Doodle Duel — Realtime Multiplayer Drawing & Guessing Game

A production-structured clone of Skribbl.io built with React 19 + Vite on the
frontend and Node.js + Express + Socket.IO on the backend. Players create or
join rooms, take turns drawing a chosen word while everyone else guesses in
real time, and compete for points across multiple rounds.

----

## 1. Quick Start (Local Development)

Requires Node.js 18+.

```bash
# 1. Backend
cd backend
cp .env.example .env      # defaults work out of the box, no Mongo required
npm install
npm run dev                # http://localhost:5000

# 2. Frontend (in a second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Open two browser tabs at `http://localhost:5173`, create a room in one,
join it with the room code in the other, and start the game. **The app
runs fully without MongoDB** — see [Database Strategy](#5-database-strategy)
below for why, and how to enable Atlas.

---

## 2. Architecture Overview

```
┌─────────────┐        REST (rooms, health)        ┌──────────────┐
│   React     │ ─────────────────────────────────► │   Express    │
│  (Vercel)   │                                     │   (Render)   │
│             │ ◄────────── Socket.IO ────────────► │              │
└─────────────┘     (drawing, chat, game state)      └──────┬───────┘
                                                              │
                                                     ┌────────▼────────┐
                                                     │  MongoDB Atlas  │
                                                     │ (word bank +    │
                                                     │  room history)  │
                                                     └─────────────────┘
```

**Key decision — where does game state live?** Every stroke, guess, and
timer tick is high-frequency and latency-sensitive. Round-tripping that
through a database would add lag a drawing game cannot tolerate, so the
**live** room/game state (players, current word, canvas history, timers)
lives entirely in-memory in the Node process (`backend/src/services/roomStore.js`),
keyed by room code. MongoDB is used only for:
- the persistent word bank (with an in-memory fallback if Atlas isn't configured)
- a lightweight historical record of rooms (for stats/audit), not live play

This is the same pattern used by production realtime games (Socket.IO rooms
as the source of truth, DB for anything that outlives a single session).

### Backend — MVC + Service + Socket layers
```
backend/src/
  config/       env loading, MongoDB connection (with graceful fallback)
  models/       Mongoose schemas: Word, Room (history)
  controllers/  REST request handlers (thin — delegate to services)
  routes/       Express route definitions
  services/     roomStore (in-memory state), roomService, wordService,
                gameService (turn engine: rounds, timers, hints, scoring)
  socket/       roomManager, canvasManager, chatManager, gameManager —
                one Socket.IO concern each, wired together in socket/index.js
  middlewares/  helmet/cors/rate-limit wiring, global error handler
  validators/   express-validator rule sets for REST payloads
  utils/        id generation, text sanitization, close-guess detection, DB seed
  constants/    socket event names, game tuning constants, fallback word bank
```

### Frontend — Feature-based + Context API
```
frontend/src/
  context/      SocketContext (connection lifecycle), GameContext (all
                socket-event-driven state: room, chat, timer, hints, results)
  socket/       Socket.IO client singleton
  services/     Axios instance + REST calls
  canvas/       useDrawingCanvas — the entire canvas drawing engine
  components/   PlayerList, ChatBox, DrawingBoard, Toolbar, TimerRing,
                HintDisplay, WordChoiceModal, RoundEnd/GameOver overlays
  pages/        LandingPage (create/join), RoomPage (lobby + in-game),
                NotFoundPage — all lazily loaded via React.lazy
  utils/        localStorage session persistence (refresh/reconnect support)
  constants/    mirrored event names + avatar/color palettes
```

---

## 3. Socket Event Reference

### Client → Server
| Event | Payload | Notes |
|---|---|---|
| `create_room` | `{ hostName, isPrivate, settings }` | ack callback returns `{ success, roomId, playerId }` |
| `join_room` | `{ roomId, playerName, avatar }` | ack callback, rejects if full/in-progress |
| `leave_room` | — | |
| `player_ready` | — | toggles ready state in lobby |
| `start_game` | — | host only, needs ≥2 connected players |
| `select_word` | `{ word }` | drawer only, must be one of the offered options |
| `draw_start` / `draw_move` / `draw_end` | stroke point data | drawer only, throttled client-side (~33/s) |
| `undo` | — | drawer only |
| `clear_canvas` | — | drawer only |
| `guess` | `{ text }` | scored against the current word |
| `chat` | `{ text }` | routed to guess logic automatically if the sender hasn't guessed yet during a round |
| `list_public_rooms` | — | ack returns array of open public rooms |

### Server → Client
| Event | Payload | Notes |
|---|---|---|
| `room_created` / `room_joined` | `{ playerId, room }` | initial state for the joining socket |
| `room_updated` | full room snapshot | **per-player tailored** — the word is only included for the current drawer, or once a round ends |
| `player_joined` / `player_left` | player info | for toast notifications |
| `game_started` | `{ totalRounds }` | |
| `drawer_changed` | `{ drawerId, drawerName, round, totalRounds }` | |
| `word_selected` | `{ options }` | sent **only** to the drawer's socket |
| `round_started` | `{ round, drawTimeSeconds, wordLength }` | |
| `canvas_update` / `canvas_clear` / `canvas_undo` | stroke data | relayed to everyone except the drawer |
| `chat_message` | `{ playerId, playerName, text, system, guessFeedback }` | |
| `guess_result` | `{ correct, close, points }` | private ack to the guesser |
| `score_update` | `{ players: [{id, score}] }` | |
| `hint_update` | `{ revealedHints }` | |
| `timer_update` | `{ phase, secondsLeft }` | |
| `round_end` | `{ reason, word, scores }` | |
| `game_over` | `{ leaderboard, winner }` | |
| `error` | `{ message }` | |

---

## 4. REST API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | uptime + DB connection status |
| POST | `/api/rooms` | create a room → `{ hostName, isPrivate?, settings? }` |
| POST | `/api/rooms/join` | pre-flight check before joining → `{ roomId, playerName }` |
| GET | `/api/rooms` | list open public rooms |
| GET | `/api/rooms/:id` | room metadata snapshot |
| DELETE | `/api/rooms/:id` | force-delete a room |

All mutating routes are validated with `express-validator` (see
`backend/src/validators/roomValidators.js`) and rate-limited
(`express-rate-limit`, 100 req/min/IP by default).

### Postman / manual testing guide
1. Import the endpoints above into Postman as a collection, or `curl`:
   ```bash
   curl -X POST http://localhost:5000/api/rooms \
     -H "Content-Type: application/json" \
     -d '{"hostName":"Alice","settings":{"rounds":3,"drawTimeSeconds":80}}'
   ```
2. Hit `GET /api/rooms` and confirm the new room appears (if public).
3. Hit `GET /api/health` and confirm `dbConnected` reflects your `.env`.

### Socket testing guide
Use a Socket.IO client (or the running frontend in two tabs) to walk through:
`create_room` → `join_room` (second client) → `start_game` (host) →
`word_selected` fires only for the drawer → `select_word` → `round_started`
broadcasts to all → drawer emits `draw_move`, confirm the other tab renders
strokes live → guesser emits `guess` with the wrong word (`guess_result.correct:false`)
then the right word (`correct:true`, score updates broadcast).

---

## 5. Database Strategy

- **Word.js** — `{ word, category, difficulty }`, sampled randomly per round.
- **Room.js** — lightweight historical record `{ roomId, hostName, isPrivate,
  maxPlayers, rounds, drawTimeSeconds, status, finalScores, startedAt, endedAt }`,
  useful for stats or an admin dashboard later.
- Live game state (players, sockets, current word, canvas strokes, timers)
  is **never** persisted — see the Architecture section above for why.

If `MONGODB_URI` is empty, the server logs a warning and falls back to the
static word bank in `backend/src/constants/wordBank.js`. Everything else
(rooms, gameplay, scoring) works identically either way — this means the
72-hour submission is never blocked on Atlas provisioning.

To enable Atlas:
```bash
# in backend/.env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/doodle-duel
npm run seed   # populates the Word collection from the fallback bank
```

---

## 6. Security & Performance Checklist

- [x] Helmet (secure headers), CORS restricted to `CLIENT_ORIGIN`
- [x] `express-rate-limit` on all `/api` routes
- [x] `express-validator` on every REST body
- [x] Input sanitization on chat/guess/name text (strips tags/control chars)
- [x] Drawing/word-selection events authorize against `currentDrawerId` —
      a client can't paint or pick words unless the server says it's their turn
- [x] `.env` / secrets never committed (`.gitignore`, `.env.example` only)
- [x] Canvas pointer events throttled client-side (~33/s) before emitting
- [x] React.lazy code-splitting for routes; `React.memo`/`useCallback` used
      through the canvas hook and list components to avoid needless re-renders
- [x] `compression` + `morgan` on the Express app

---

## 7. Deployment Guide

### Backend → Render
1. Push this repo to GitHub.
2. New → Web Service → connect the repo, set **root directory to `backend`**.
3. Build command: `npm install` · Start command: `npm start`.
4. Environment variables: `NODE_ENV=production`, `CLIENT_ORIGIN=<your-vercel-url>`,
   `MONGODB_URI` (optional). A `render.yaml` is included for Blueprint deploys.
5. Confirm `https://<service>.onrender.com/api/health` returns `200`.

### Frontend → Vercel
1. New Project → import the repo, set **root directory to `frontend`**.
2. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. Environment variables: `VITE_API_URL=https://<render-url>/api`,
   `VITE_SOCKET_URL=https://<render-url>`.
4. `vercel.json` is included to rewrite all routes to `index.html` (required
   for React Router's client-side `/room/:roomId` routes).

### Database → MongoDB Atlas
1. Create a free cluster, add a database user, allow network access from `0.0.0.0/0`
   (or Render's static IPs if you upgrade).
2. Copy the connection string into Render's `MONGODB_URI` and run `npm run seed` locally
   once pointed at that URI.

---

## 8. Production Checklist

- [x] `npm install && npm run dev` works with zero manual edits (both apps)
- [x] `npm run build` succeeds on the frontend (verified)
- [x] Backend boots and serves `/api/health` with zero required env vars
- [x] Reconnect handling: refreshing the page rejoins the same room via a
      `localStorage`-persisted session (see `frontend/src/utils/session.js`)
- [x] Disconnected players are marked `offline` rather than instantly removed,
      and the game skips their turn automatically if they were mid-draw
- [x] Deployment configs committed (`render.yaml`, `vercel.json`)
- [ ] Rate limiting values tuned for expected traffic (defaults are conservative)
- [ ] Add automated tests (see [Known Limitations](#9-known-limitations--nice-to-haves-not-yet-built))

---

## 9. Known Limitations / Nice-to-haves Not Yet Built

Given the 72-hour window, these "Nice to Have" items from the brief were
intentionally deprioritized in favor of a fully working core loop. They're
straightforward follow-ups on this architecture:

- Kick / ban / vote-skip moderation
- Spectator mode (watch without playing)
- Replay of the last round's drawing
- Multiple languages for the word list
- Full undo history replay (current `undo` clears back to the last stroke
  boundary rather than replaying the entire stroke stack minus one path)

---

## 10. Tech Stack

**Frontend:** React 19, Vite, React Router DOM, Context API, Axios,
Socket.IO Client, TailwindCSS v4, React Hot Toast, Framer Motion.

**Backend:** Node.js, Express, Socket.IO, MongoDB Atlas + Mongoose, Helmet,
Morgan, Compression, express-validator, express-rate-limit, UUID, CORS.
