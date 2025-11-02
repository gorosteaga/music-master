import { teamManager } from './TeamManager.js';
import { playerManager } from './PlayerManager.js';

class TurnManager {
  /**
   * Initialize turn system for a room
   * @param {Object} room - Room object
   */
  initializeTurns(room) {
    room.currentTurn = 0;
    room.turnLocked = false;
    console.log(`🔄 Turn system initialized for room ${room.id}`);
  }

  /**
   * Get the current active team
   * @param {Object} room - Room object
   * @returns {Object|null} Current team object or null
   */
  getCurrentTeam(room) {
    if (!room.teams || room.teams.length === 0) {
      return null;
    }

    const teamIndex = room.currentTurn % room.teams.length;
    return room.teams[teamIndex];
  }

  /**
   * Get the current team ID
   * @param {Object} room - Room object
   * @returns {number|null} Current team ID or null
   */
  getCurrentTeamId(room) {
    const team = this.getCurrentTeam(room);
    return team ? team.id : null;
  }

  /**
   * Validate if a player can make a move (is on the current team)
   * @param {Object} room - Room object
   * @param {string} socketId - Player's socket ID
   * @returns {Object} Validation result
   */
  validateTurn(room, socketId) {
    if (!room.gameStarted) {
      return { valid: false, message: 'Game has not started' };
    }

    if (room.turnLocked) {
      return { valid: false, message: 'Turn is locked, please wait' };
    }

    const currentTeam = this.getCurrentTeam(room);
    if (!currentTeam) {
      return { valid: false, message: 'No teams configured' };
    }

    const player = playerManager.getPlayer(socketId);
    if (!player) {
      return { valid: false, message: 'Player not found' };
    }

    if (player.teamId !== currentTeam.id) {
      return { valid: false, message: `Not your turn (waiting for ${currentTeam.name})` };
    }

    return { valid: true, teamId: currentTeam.id };
  }

  /**
   * Lock the turn to prevent concurrent moves
   * @param {Object} room - Room object
   */
  lockTurn(room) {
    room.turnLocked = true;
    console.log(`🔒 Turn locked in room ${room.id}`);
  }

  /**
   * Unlock the turn after move completion
   * @param {Object} room - Room object
   */
  unlockTurn(room) {
    room.turnLocked = false;
    console.log(`🔓 Turn unlocked in room ${room.id}`);
  }

  /**
   * Advance to the next team's turn
   * @param {Object} room - Room object
   * @returns {Object} New current team
   */
  advanceTurn(room) {
    if (!room.gameStarted) {
      return { success: false, message: 'Game has not started' };
    }

    room.currentTurn++;
    room.turnLocked = false;

    const newTeam = this.getCurrentTeam(room);
    console.log(`➡️  Turn advanced to ${newTeam.name} in room ${room.id}`);

    return { success: true, team: newTeam, turnNumber: room.currentTurn };
  }

  /**
   * Set turn to a specific team
   * @param {Object} room - Room object
   * @param {number} teamId - Team ID to set as current
   */
  setTurn(room, teamId) {
    const teamIndex = room.teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      room.currentTurn = teamIndex;
      room.turnLocked = false;
      console.log(`🎯 Turn set to ${room.teams[teamIndex].name} in room ${room.id}`);
    }
  }

  /**
   * Get turn information for a room
   * @param {Object} room - Room object
   * @returns {Object} Turn information
   */
  getTurnInfo(room) {
    const currentTeam = this.getCurrentTeam(room);

    return {
      currentTurn: room.currentTurn,
      currentTeamId: currentTeam ? currentTeam.id : null,
      currentTeamName: currentTeam ? currentTeam.name : null,
      turnLocked: room.turnLocked,
      totalTeams: room.teams.length
    };
  }

  /**
   * Check if it's a specific player's turn
   * @param {Object} room - Room object
   * @param {string} socketId - Player's socket ID
   * @returns {boolean} True if it's the player's turn
   */
  isPlayerTurn(room, socketId) {
    const validation = this.validateTurn(room, socketId);
    return validation.valid;
  }

  /**
   * Get players who can currently move
   * @param {Object} room - Room object
   * @returns {Array} Array of player socket IDs
   */
  getActivePlayerIds(room) {
    const currentTeam = this.getCurrentTeam(room);
    return currentTeam ? currentTeam.players : [];
  }

  /**
   * Reset turn system
   * @param {Object} room - Room object
   */
  resetTurns(room) {
    room.currentTurn = 0;
    room.turnLocked = false;
    console.log(`🔄 Turns reset for room ${room.id}`);
  }
}

// Singleton instance
export const turnManager = new TurnManager();
