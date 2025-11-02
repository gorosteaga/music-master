import { customAlphabet } from 'nanoid';

// Generate shorter player IDs (8 characters)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

class PlayerManager {
  constructor() {
    // Track all connected players across rooms
    // Map<socketId, Player>
    this.players = new Map();
  }

  /**
   * Create a new player
   * @param {string} socketId - Socket ID of the connected client
   * @param {string} [username] - Optional username (for future use)
   * @returns {Object} Player object
   */
  createPlayer(socketId, username = null) {
    const player = {
      id: nanoid(),
      socketId,
      username: username || `Player-${nanoid().substring(0, 4)}`,
      teamId: null,
      isConnected: true,
      connectedAt: Date.now(),
      roomId: null
    };

    this.players.set(socketId, player);
    console.log(`🆕 Player created: ${player.username} (${player.id})`);

    return player;
  }

  /**
   * Get a player by socket ID
   * @param {string} socketId - Socket ID
   * @returns {Object|null} Player object or null if not found
   */
  getPlayer(socketId) {
    return this.players.get(socketId) || null;
  }

  /**
   * Get a player by player ID
   * @param {string} playerId - Player ID
   * @returns {Object|null} Player object or null if not found
   */
  getPlayerById(playerId) {
    for (const player of this.players.values()) {
      if (player.id === playerId) {
        return player;
      }
    }
    return null;
  }

  /**
   * Update player's room
   * @param {string} socketId - Socket ID
   * @param {string} roomId - Room ID to assign
   */
  setPlayerRoom(socketId, roomId) {
    const player = this.getPlayer(socketId);
    if (player) {
      player.roomId = roomId;
    }
  }

  /**
   * Update player's team
   * @param {string} socketId - Socket ID
   * @param {number} teamId - Team ID to assign
   */
  setPlayerTeam(socketId, teamId) {
    const player = this.getPlayer(socketId);
    if (player) {
      player.teamId = teamId;
      console.log(`👥 Player ${player.username} assigned to team ${teamId}`);
    }
  }

  /**
   * Mark player as disconnected
   * @param {string} socketId - Socket ID
   */
  disconnectPlayer(socketId) {
    const player = this.getPlayer(socketId);
    if (player) {
      player.isConnected = false;
      console.log(`🔌 Player ${player.username} disconnected`);
    }
  }

  /**
   * Remove a player completely
   * @param {string} socketId - Socket ID
   */
  removePlayer(socketId) {
    const player = this.getPlayer(socketId);
    if (player) {
      this.players.delete(socketId);
      console.log(`🗑️  Player removed: ${player.username}`);
    }
  }

  /**
   * Get all players in a specific room
   * @param {string} roomId - Room ID
   * @returns {Array} Array of player objects
   */
  getPlayersInRoom(roomId) {
    return Array.from(this.players.values()).filter(
      player => player.roomId === roomId && player.isConnected
    );
  }

  /**
   * Get player count (for monitoring)
   * @returns {number} Number of connected players
   */
  getPlayerCount() {
    return Array.from(this.players.values()).filter(p => p.isConnected).length;
  }

  /**
   * Update player username
   * @param {string} socketId - Socket ID
   * @param {string} username - New username
   */
  setPlayerUsername(socketId, username) {
    const player = this.getPlayer(socketId);
    if (player) {
      player.username = username;
      console.log(`✏️  Player ${player.id} changed username to ${username}`);
    }
  }
}

// Singleton instance
export const playerManager = new PlayerManager();
