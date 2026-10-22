# 🎲 RunoPoly

A modern, cross-platform real-time multiplayer Monopoly game engine and interactive client built for **Web, iOS, and Android**, deployed on **Render.com**.

---

## ✨ Features

- **Cross-Platform**: Play seamlessly across Desktop Web browsers, iOS, and Android powered by React Native and Expo.
- **Authoritative Server**: Server-authoritative rules engine with Node.js, TypeScript, Express, and Socket.io.
- **2.5D Isometric SVG Board**: Fully responsive vector board with smooth player pawn movements, house/hotel indicators, mortgage stamps, and pinch/zoom/pan controls.
- **Classic Monopoly Rules**: Atlantic City 40-space board (Boardwalk, Park Place, Reading Railroad, Chance, Community Chest) with authentic rents, color group monopolies, utilities, and railroad progression.
- **Host House Rules**:
  - Turn Timer (30s, 60s, 90s, or Unlimited)
  - Free Parking Cash Pot (taxes and fines gather in the center)
  - Double GO Landing Bonus ($400 instead of $200)
  - Property Auctions (highest bidder wins declined properties)
- **Interactive Multi-Asset Trading**: Trade cash, properties, and "Get Out of Jail Free" cards with real-time counter-offers and validations.
- **Public Room Browser & Matchmaking**: 4-letter room codes, quick join, and instant session reconnection.
- **Social Chat & Reactions**: Match text chat and one-tap emoji reactions (🎩, 💸, 🎲, 🏆, etc.).
- **Automated Rules Test Suite**: 17 unit tests with Vitest covering rent, auctions, trading, monopolies, jail, and bankruptcies.

---

## 🏗️ Repository Architecture

```text
RunoPoly/
├── client/                     # Expo React Native App (iOS, Android, Web)
│   ├── src/app/                # Expo Router file-based routes
│   │   ├── _layout.tsx         # Root Stack layout, theme & safe areas
│   │   ├── index.tsx           # Welcome screen (create/join room)
│   │   ├── lobby.tsx           # Waiting room & ready-up flow
│   │   └── game.tsx            # Board, HUD, modals & chat
│   ├── components/
│   │   ├── board/              # 2.5D SVG Board with tiles, pawns, center emblem
│   │   ├── hud/                # Player list bar, action dock, game over screen
│   │   ├── modals/             # Title Deed modal, Auction modal, Trade modal
│   │   ├── chat/               # Live chat & emoji reaction drawer
│   │   └── lobby/              # Welcome lobby & waiting room roster
│   ├── data/                   # Atlantic City 40-space data & tokens meta
│   ├── store/                  # Zustand reactive client state store
│   ├── services/               # Socket.io client service
│   ├── types/                  # Shared game contracts
│   └── app.json                # Expo config (Expo Router, typed routes)
│
├── server/                     # Node.js + Express + Socket.io Server
│   ├── src/
│   │   ├── engine/             # Authoritative Monopoly Rules Engine
│   │   │   ├── board.ts        # 40 Atlantic City spaces & deeds
│   │   │   ├── cards.ts        # Chance & Community Chest decks
│   │   │   ├── rent.ts         # Rent formulas, color monopolies, houses
│   │   │   ├── trade.ts        # Trade validation & asset exchange
│   │   │   ├── auction.ts      # Real-time bidding & folding logic
│   │   │   └── GameEngine.ts   # Core state machine
│   │   ├── rooms/              # In-memory room & session manager
│   │   ├── sockets/            # Socket.io event dispatchers
│   │   └── index.ts            # Express server & Render /healthz endpoint
│   └── test/                   # Vitest unit test suite (17 tests)
│
├── render.yaml                 # Render Blueprint for automated web service deployment
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v26)
- npm or pnpm

### 1. Run the Authoritative Server
```bash
cd server
npm install
npm test            # Run Vitest test suite
npm run dev         # Starts server on http://localhost:4000
```

Verify the server is running:
- Health check: `http://localhost:4000/healthz`
- Public rooms: `http://localhost:4000/api/rooms`

### 2. Run the Client (Web, iOS, Android)
In a new terminal:
```bash
cd client
npm install
npm run web         # Launch in desktop/mobile web browser
```

For mobile devices:
- `npm run android` (Android emulator / physical device)
- `npm run ios` (iOS simulator on macOS)

---

## ☁️ Deploying to Render.com

RunoPoly includes a pre-configured `render.yaml` blueprint:

1. Push this repository to GitHub or GitLab.
2. Log in to [Render.com](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your repository. Render will automatically detect `render.yaml` and configure:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build` (inside `server/`)
   - **Start Command**: `npm start`
   - **Health Check Path**: `/healthz`
5. Once deployed, copy your Render web service URL (e.g. `https://runopoly-server.onrender.com`) and paste it into the **Server Connection** box in the RunoPoly client!

---

## 🧪 Testing

The game engine rules are thoroughly tested using Vitest:
```bash
cd server
npm test
```

Test coverage includes:
- Rent formulas across unimproved, color monopoly, houses (1-4), and hotel
- Railroad rent scaling ($25, $50, $100, $200) and Chance card multipliers
- Utility rent formulas (4x and 10x dice rolls)
- House building & selling even distribution rules
- Mortgage restrictions (all houses in color group must be sold first)
- Trade validations (insufficient cash, trading properties with houses)
- Dice rolling, passing GO bonus ($200), landing on GO bonus ($400)
- Rolling doubles (extra turn) and 3 consecutive doubles (sent to jail)
- Auction creation, bidding increments, and fold resolutions
- Bankruptcy debt settlement and victory declaration
