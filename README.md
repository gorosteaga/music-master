# Multiplayer Turn-Based Game

A real-time multiplayer turn-based game infrastructure built with React, Socket.IO, and Node.js. This project provides the foundation for any turn-based multiplayer game with ephemeral rooms, team management, and turn control.

## Features

✅ **Real-time Multiplayer** - WebSocket-based communication via Socket.IO
✅ **Ephemeral Rooms** - Create and join temporary game rooms with random codes
✅ **Team Management** - Automatic team balancing for 2-4 teams
✅ **Turn System** - Server-authoritative turn control with mutex locking
✅ **No Authentication** - Simple temporary player IDs on connection
✅ **Auto Cleanup** - Rooms automatically deleted when empty
✅ **Responsive UI** - Clean, modern interface that works on all devices

## Tech Stack

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **In-memory storage** (no database required)
- ES6 modules

### Frontend
- **React 19** with Vite
- **Socket.IO Client**
- **Context API** for state management
- Modern CSS with CSS variables

## Project Structure

```
music-master/
├── server/              # Backend Node.js server
│   ├── src/
│   │   ├── index.js            # Server entry point
│   │   ├── config.js           # Configuration
│   │   ├── managers/           # Business logic
│   │   │   ├── RoomManager.js
│   │   │   ├── PlayerManager.js
│   │   │   ├── TeamManager.js
│   │   │   └── TurnManager.js
│   │   ├── handlers/           # Socket.IO handlers
│   │   │   └── socketHandlers.js
│   │   └── utils/
│   │       └── roomCodeGenerator.js
│   └── package.json
├── client/              # Frontend React app
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── context/           # React Context
│   │   ├── services/          # API services
│   │   └── styles/            # CSS files
│   └── package.json
└── package.json         # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+ (preferably 20+)
- npm or yarn

### Installation

1. **Fix npm permissions** (if needed):
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

2. **Install all dependencies**:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

   Or from root:
   ```bash
   npm install
   ```

### Running the Application

**Option 1: Run from root (recommended)**

```bash
# Terminal 1 - Start server
npm run dev:server

# Terminal 2 - Start client
npm run dev:client
```

**Option 2: Run from individual folders**

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## How to Use

### Creating a Room

1. Open the app in your browser
2. Click "Create New Room"
3. Share the 6-character room code with other players

### Joining a Room

1. Get the room code from the host
2. Enter the code in the "Join Room" field
3. Click "Join Room"

### Starting a Game

1. As the host, wait for all players to join
2. Select the number of teams (2-4)
3. Click "Start Game"
4. Teams will be automatically balanced

### Playing

1. Wait for your team's turn
2. The turn indicator will show "🎯 Your Turn!" when it's your turn
3. Click "End Turn" to pass to the next team

## Configuration

### Server Configuration

Edit `server/src/config.js`:

```javascript
export const CONFIG = {
  PORT: 3001,                    // Server port
  ROOM_CODE_LENGTH: 6,           // Length of room codes
  MAX_PLAYERS_PER_ROOM: 20,      // Maximum players per room
  MIN_PLAYERS_TO_START: 2,       // Minimum players to start
  DEFAULT_NUM_TEAMS: 2,          // Default number of teams
  CORS_ORIGIN: 'http://localhost:5173'  // Frontend URL
};
```

### Client Configuration

Create `client/.env`:

```env
VITE_SERVER_URL=http://localhost:3001
```

## Architecture

### Room Management

- **Ephemeral rooms** created with unique 6-character codes
- **In-memory storage** using JavaScript Maps
- **Auto-cleanup** when the last player leaves
- **Host transfer** if the host disconnects

### Team System

- **Automatic balancing**: Teams differ by max 1 player
- **Shuffled assignment**: Random distribution
- **Flexible teams**: Support for 2-4 teams

### Turn Control

- **Server-authoritative**: All turn logic on server
- **Mutex locking**: Prevents concurrent moves
- **Round-robin**: Cycles through teams in order
- **Validation**: Only current team can make moves

### Real-time Communication

Socket.IO events:
- `create-room` - Create a new room
- `join-room` - Join an existing room
- `leave-room` - Leave current room
- `start-game` - Start the game (host only)
- `make-move` - Make a game move
- `end-turn` - End current turn
- `player-joined` - Broadcast when player joins
- `player-left` - Broadcast when player leaves
- `game-started` - Broadcast when game starts
- `turn-changed` - Broadcast turn changes
- `move-made` - Broadcast moves

## Adding Game Logic

This infrastructure is ready for your game-specific logic. Here's where to add it:

### Backend

1. **Game state**: Extend the `gameState` object in `RoomManager.js`
2. **Move validation**: Add logic in `socketHandlers.js` → `make-move` event
3. **Win conditions**: Add checks in your move handler

### Frontend

1. **Game board**: Replace placeholder in `client/src/pages/Game.jsx`
2. **Move UI**: Add buttons/controls for game-specific actions
3. **Visual state**: Use `room.gameState` from GameContext

### Example: Adding a Chess Move

**Backend** (`socketHandlers.js`):
```javascript
socket.on('make-move', (data, callback) => {
  const { roomId, moveData } = data;
  const { from, to } = moveData;

  // Validate chess move
  if (!isValidChessMove(room.gameState, from, to)) {
    callback({ success: false, message: 'Invalid move' });
    return;
  }

  // Update game state
  room.gameState.board = applyMove(room.gameState.board, from, to);

  // Broadcast to all players
  io.to(roomId).emit('move-made', {
    moveData,
    gameState: room.gameState
  });
});
```

**Frontend** (`Game.jsx`):
```javascript
const handleSquareClick = async (square) => {
  if (isMyTurn()) {
    await makeMove({ from: selectedSquare, to: square });
  }
};
```

## Testing Multi-Client

1. Open multiple browser tabs/windows
2. Use different browsers or incognito mode
3. Test on different devices on the same network
4. Use browser dev tools to throttle network

## Future Enhancements

### Database Integration

The code is designed with a repository pattern to make adding a database easy:

1. Create `server/src/repositories/DatabaseGameState.js`
2. Implement the same interface as in-memory storage
3. Swap the implementation in managers

**Note**: Room/session data should remain in-memory (ephemeral). Only persist game logic data that needs to survive across sessions.

### Recommended Features

- [ ] Reconnection handling
- [ ] Spectator mode
- [ ] Private/public rooms
- [ ] Game history
- [ ] Chat system
- [ ] Player profiles
- [ ] Leaderboards

## Troubleshooting

### npm Permission Errors

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

### Port Already in Use

Change ports in:
- `server/src/config.js` → PORT
- `client/.env` → VITE_SERVER_URL

### Socket Connection Failed

1. Check server is running on port 3001
2. Verify CORS_ORIGIN in server config matches client URL
3. Check browser console for errors

### Players Not Seeing Updates

1. Check Socket.IO connection in browser dev tools
2. Verify room code is correct
3. Check server logs for errors

## License

MIT

## Contributing

This is a foundational template - extend it for your specific game needs!
