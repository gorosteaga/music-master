import { generateRoomCode } from '../utils/roomCodeGenerator.js';
import { CONFIG } from '../config.js';

class RoomManager {
  constructor() {
    // In-memory storage: Map<roomId, Room>
    this.rooms = new Map();
  }

  /**
   * Create a new room
   * @param {string} hostSocketId - Socket ID of the room creator
   * @returns {Object} Room object with room code
   */
  createRoom(hostSocketId) {
    const roomId = generateRoomCode();

    // Ensure unique room code (extremely unlikely collision, but safe)
    if (this.rooms.has(roomId)) {
      return this.createRoom(hostSocketId);
    }

    const room = {
      id: roomId,
      hostSocketId,
      players: new Map(),
      teams: [],
      currentTurn: 0,
      gameStarted: false,
      turnLocked: false,
      gameState: {}, // Placeholder for future game-specific data
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);
    console.log(`✨ Room created: ${roomId}`);

    return room;
  }

  /**
   * Get a room by ID
   * @param {string} roomId - Room code
   * @returns {Object|null} Room object or null if not found
   */
  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Check if a room exists
   * @param {string} roomId - Room code
   * @returns {boolean}
   */
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  /**
   * Add a player to a room
   * @param {string} roomId - Room code
   * @param {Object} player - Player object
   * @returns {Object} Result with success status and message
   */
  addPlayerToRoom(roomId, player) {
    const room = this.getRoom(roomId);

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    if (room.gameStarted) {
      return { success: false, message: 'Game already started' };
    }

    if (room.players.size >= CONFIG.MAX_PLAYERS_PER_ROOM) {
      return { success: false, message: 'Room is full' };
    }

    room.players.set(player.socketId, player);
    console.log(`👤 Player ${player.id} joined room ${roomId}`);

    return { success: true, room };
  }

  /**
   * Remove a player from a room
   * @param {string} roomId - Room code
   * @param {string} socketId - Player's socket ID
   * @returns {Object} Result with success status and shouldDeleteRoom flag
   */
  removePlayerFromRoom(roomId, socketId) {
    const room = this.getRoom(roomId);

    if (!room) {
      return { success: false, shouldDeleteRoom: false };
    }

    const player = room.players.get(socketId);
    room.players.delete(socketId);

    if (player) {
      console.log(`👋 Player ${player.id} left room ${roomId}`);
    }

    // Remove player from team if assigned
    room.teams.forEach(team => {
      const index = team.players.indexOf(socketId);
      if (index > -1) {
        team.players.splice(index, 1);
      }
    });

    // If room is empty, mark for deletion
    const shouldDeleteRoom = room.players.size === 0;

    if (shouldDeleteRoom) {
      this.deleteRoom(roomId);
    } else if (room.hostSocketId === socketId && room.players.size > 0) {
      // Transfer host to another player
      const newHost = Array.from(room.players.values())[0];
      room.hostSocketId = newHost.socketId;
      console.log(`👑 Host transferred to ${newHost.id} in room ${roomId}`);
    }

    return { success: true, shouldDeleteRoom, room };
  }

  /**
   * Delete a room
   * @param {string} roomId - Room code
   */
  deleteRoom(roomId) {
    if (this.rooms.delete(roomId)) {
      console.log(`🗑️  Room deleted: ${roomId}`);
    }
  }

  /**
   * Start a game in a room
   * @param {string} roomId - Room code
   * @returns {Object} Result with success status and message
   */
  startGame(roomId) {
    const room = this.getRoom(roomId);

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    if (room.gameStarted) {
      return { success: false, message: 'Game already started' };
    }

    if (room.players.size < CONFIG.MIN_PLAYERS_TO_START) {
      return { success: false, message: `Need at least ${CONFIG.MIN_PLAYERS_TO_START} players` };
    }

    room.gameStarted = true;
    console.log(`🎮 Game started in room ${roomId}`);

    return { success: true, room };
  }

  /**
   * Get all rooms (for debugging/admin purposes)
   * @returns {Array} Array of room objects
   */
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  /**
   * Get room count (for monitoring)
   * @returns {number} Number of active rooms
   */
  getRoomCount() {
    return this.rooms.size;
  }
}

// Singleton instance
export const roomManager = new RoomManager();
