import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  // Player state
  const [playerId, setPlayerId] = useState(null);
  const [username, setUsername] = useState(null);

  // Room state
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [turnInfo, setTurnInfo] = useState(null);
  const [myTeamId, setMyTeamId] = useState(null);

  // UI state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Connect to server on mount
  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Player created event
    socket.on('player-created', (data) => {
      setPlayerId(data.playerId);
      setUsername(data.username);
      console.log('Player created:', data);
    });

    // Player joined event
    socket.on('player-joined', (data) => {
      setRoom(data.room);
      setPlayers(data.room.players);
      console.log('Player joined:', data);
    });

    // Player left event
    socket.on('player-left', (data) => {
      setRoom(data.room);
      setPlayers(data.room.players);
      console.log('Player left:', data);
    });

    // Game started event
    socket.on('game-started', (data) => {
      setRoom(data.room);
      setTeams(data.teams);
      setPlayers(data.room.players);
      setGameStarted(true);
      setTurnInfo(data.turnInfo);
      setCurrentTeamId(data.turnInfo.currentTeamId);

      // Find my team
      const myPlayer = data.room.players.find(p => p.id === playerId);
      if (myPlayer) {
        setMyTeamId(myPlayer.teamId);
      }

      console.log('Game started:', data);
    });

    // Turn changed event
    socket.on('turn-changed', (data) => {
      setTurnInfo(data.turnInfo);
      setCurrentTeamId(data.turnInfo.currentTeamId);
      console.log('Turn changed:', data);
    });

    // Move made event
    socket.on('move-made', (data) => {
      console.log('Move made:', data);
      // TODO: Update game state when game logic is implemented
    });

    // Error event
    socket.on('error', (data) => {
      setError(data.message);
      console.error('Socket error:', data);
    });

    return () => {
      socketService.disconnect();
    };
  }, []); // Empty dependency array - only connect once on mount

  // Create room
  const createRoom = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await socketService.createRoom();
      setRoomId(response.roomId);
      setRoom(response.room);
      setPlayers(response.room.players);
      setIsHost(true);
      return response.roomId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Join room
  const joinRoom = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);
      const response = await socketService.joinRoom(code);
      setRoomId(response.roomId);
      setRoom(response.room);
      setPlayers(response.room.players);
      setIsHost(response.room.hostSocketId === socketService.socket.id);
      return response.roomId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (roomId) {
        await socketService.leaveRoom(roomId);
      }
      // Reset room state
      setRoomId(null);
      setRoom(null);
      setPlayers([]);
      setTeams([]);
      setGameStarted(false);
      setIsHost(false);
      setMyTeamId(null);
      setCurrentTeamId(null);
      setTurnInfo(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Start game
  const startGame = useCallback(async (numTeams = 2) => {
    try {
      setLoading(true);
      setError(null);
      await socketService.startGame(roomId, numTeams);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Make move
  const makeMove = useCallback(async (moveData) => {
    try {
      setLoading(true);
      setError(null);
      await socketService.makeMove(roomId, moveData);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // End turn
  const endTurn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const newTurnInfo = await socketService.endTurn(roomId);
      setTurnInfo(newTurnInfo);
      setCurrentTeamId(newTurnInfo.currentTeamId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Check if it's my turn
  const isMyTurn = useCallback(() => {
    return myTeamId !== null && myTeamId === currentTeamId;
  }, [myTeamId, currentTeamId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // Player
    playerId,
    username,

    // Room
    roomId,
    room,
    isHost,
    players,

    // Game
    gameStarted,
    teams,
    currentTeamId,
    turnInfo,
    myTeamId,

    // UI
    error,
    loading,
    connected,

    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    makeMove,
    endTurn,
    isMyTurn,
    clearError
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
