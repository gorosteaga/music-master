import { roomManager } from '../managers/RoomManager.js';
import { playerManager } from '../managers/PlayerManager.js';
import { teamManager } from '../managers/TeamManager.js';
import { turnManager } from '../managers/TurnManager.js';
import { CONFIG } from '../config.js';

/**
 * Setup all Socket.IO event handlers
 * @param {Server} io - Socket.IO server instance
 */
export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Create player on connection
    const player = playerManager.createPlayer(socket.id);

    // Send player their ID
    socket.emit('player-created', {
      playerId: player.id,
      username: player.username
    });

    /**
     * CREATE ROOM
     */
    socket.on('create-room', (callback) => {
      try {
        const room = roomManager.createRoom(socket.id);

        // Add creator to room
        const result = roomManager.addPlayerToRoom(room.id, player);
        if (!result.success) {
          callback({ success: false, message: result.message });
          return;
        }

        // Update player's room
        playerManager.setPlayerRoom(socket.id, room.id);

        // Join socket room for broadcasting
        socket.join(room.id);

        callback({
          success: true,
          roomId: room.id,
          room: serializeRoom(room)
        });

        console.log(`✅ Room ${room.id} created by ${player.username}`);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, message: 'Failed to create room' });
      }
    });

    /**
     * JOIN ROOM
     */
    socket.on('join-room', (data, callback) => {
      try {
        const { roomId } = data;

        if (!roomManager.roomExists(roomId)) {
          callback({ success: false, message: 'Room not found' });
          return;
        }

        const room = roomManager.getRoom(roomId);
        const result = roomManager.addPlayerToRoom(roomId, player);

        if (!result.success) {
          callback({ success: false, message: result.message });
          return;
        }

        // Update player's room
        playerManager.setPlayerRoom(socket.id, roomId);

        // Join socket room for broadcasting
        socket.join(roomId);

        // Notify all players in room
        io.to(roomId).emit('player-joined', {
          player: serializePlayer(player),
          room: serializeRoom(room)
        });

        callback({
          success: true,
          roomId,
          room: serializeRoom(room)
        });

        console.log(`✅ ${player.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, message: 'Failed to join room' });
      }
    });

    /**
     * LEAVE ROOM
     */
    socket.on('leave-room', (data, callback) => {
      try {
        const { roomId } = data;
        const result = roomManager.removePlayerFromRoom(roomId, socket.id);

        if (result.success && !result.shouldDeleteRoom) {
          // Notify remaining players
          io.to(roomId).emit('player-left', {
            playerId: player.id,
            room: serializeRoom(result.room)
          });
        }

        // Leave socket room
        socket.leave(roomId);
        playerManager.setPlayerRoom(socket.id, null);

        callback({ success: true });
      } catch (error) {
        console.error('Error leaving room:', error);
        callback({ success: false, message: 'Failed to leave room' });
      }
    });

    /**
     * START GAME
     */
    socket.on('start-game', (data, callback) => {
      try {
        const { roomId, numTeams = CONFIG.DEFAULT_NUM_TEAMS } = data;
        const room = roomManager.getRoom(roomId);

        if (!room) {
          callback({ success: false, message: 'Room not found' });
          return;
        }

        // Verify caller is host
        if (room.hostSocketId !== socket.id) {
          callback({ success: false, message: 'Only host can start game' });
          return;
        }

        // Start game
        const result = roomManager.startGame(roomId);
        if (!result.success) {
          callback({ success: false, message: result.message });
          return;
        }

        // Create and assign teams
        room.teams = teamManager.createTeams(numTeams);
        teamManager.assignPlayersToTeams(room.players, room.teams);
        teamManager.balanceTeams(room.teams);

        // Initialize turn system
        turnManager.initializeTurns(room);

        // Notify all players
        io.to(roomId).emit('game-started', {
          room: serializeRoom(room),
          teams: room.teams,
          turnInfo: turnManager.getTurnInfo(room)
        });

        callback({ success: true });

        console.log(`🎮 Game started in room ${roomId}`);
      } catch (error) {
        console.error('Error starting game:', error);
        callback({ success: false, message: 'Failed to start game' });
      }
    });

    /**
     * MAKE MOVE (Placeholder for game-specific logic)
     */
    socket.on('make-move', (data, callback) => {
      try {
        const { roomId, moveData } = data;
        const room = roomManager.getRoom(roomId);

        if (!room) {
          callback({ success: false, message: 'Room not found' });
          return;
        }

        // Validate turn
        const validation = turnManager.validateTurn(room, socket.id);
        if (!validation.valid) {
          callback({ success: false, message: validation.message });
          return;
        }

        // Lock turn to prevent concurrent moves
        turnManager.lockTurn(room);

        // TODO: Process game-specific move logic here
        // For now, just accept the move
        console.log(`🎯 Move made in room ${roomId}:`, moveData);

        // Broadcast move to all players
        io.to(roomId).emit('move-made', {
          playerId: player.id,
          moveData,
          gameState: room.gameState
        });

        // Unlock turn
        turnManager.unlockTurn(room);

        callback({ success: true });
      } catch (error) {
        console.error('Error making move:', error);
        const room = roomManager.getRoom(data.roomId);
        if (room) turnManager.unlockTurn(room);
        callback({ success: false, message: 'Failed to make move' });
      }
    });

    /**
     * END TURN
     */
    socket.on('end-turn', (data, callback) => {
      try {
        const { roomId } = data;
        const room = roomManager.getRoom(roomId);

        if (!room) {
          callback({ success: false, message: 'Room not found' });
          return;
        }

        // Validate it's the player's turn
        const validation = turnManager.validateTurn(room, socket.id);
        if (!validation.valid) {
          callback({ success: false, message: validation.message });
          return;
        }

        // Advance turn
        const result = turnManager.advanceTurn(room);

        // Notify all players
        io.to(roomId).emit('turn-changed', {
          turnInfo: turnManager.getTurnInfo(room),
          previousTeamId: validation.teamId,
          currentTeamId: result.team.id
        });

        callback({ success: true, turnInfo: turnManager.getTurnInfo(room) });

        console.log(`➡️  Turn ended in room ${roomId}`);
      } catch (error) {
        console.error('Error ending turn:', error);
        callback({ success: false, message: 'Failed to end turn' });
      }
    });

    /**
     * GET ROOM INFO
     */
    socket.on('get-room-info', (data, callback) => {
      try {
        const { roomId } = data;
        const room = roomManager.getRoom(roomId);

        if (!room) {
          callback({ success: false, message: 'Room not found' });
          return;
        }

        callback({
          success: true,
          room: serializeRoom(room),
          turnInfo: room.gameStarted ? turnManager.getTurnInfo(room) : null
        });
      } catch (error) {
        console.error('Error getting room info:', error);
        callback({ success: false, message: 'Failed to get room info' });
      }
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      const disconnectedPlayer = playerManager.getPlayer(socket.id);
      if (disconnectedPlayer && disconnectedPlayer.roomId) {
        const result = roomManager.removePlayerFromRoom(
          disconnectedPlayer.roomId,
          socket.id
        );

        if (result.success && !result.shouldDeleteRoom) {
          // Notify remaining players
          io.to(disconnectedPlayer.roomId).emit('player-left', {
            playerId: disconnectedPlayer.id,
            room: serializeRoom(result.room)
          });
        }
      }

      playerManager.removePlayer(socket.id);
    });
  });

  // Log server stats periodically (every 30 seconds)
  setInterval(() => {
    const stats = {
      rooms: roomManager.getRoomCount(),
      players: playerManager.getPlayerCount()
    };
    console.log(`📊 Server stats: ${stats.rooms} rooms, ${stats.players} players`);
  }, 30000);
}

/**
 * Serialize room data for client
 */
function serializeRoom(room) {
  return {
    id: room.id,
    hostSocketId: room.hostSocketId,
    players: Array.from(room.players.values()).map(serializePlayer),
    teams: room.teams,
    gameStarted: room.gameStarted,
    currentTurn: room.currentTurn,
    gameState: room.gameState
  };
}

/**
 * Serialize player data for client
 */
function serializePlayer(player) {
  return {
    id: player.id,
    socketId: player.socketId,
    username: player.username,
    teamId: player.teamId,
    isConnected: player.isConnected
  };
}
