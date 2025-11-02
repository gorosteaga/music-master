import { CONFIG } from '../config.js';
import { playerManager } from './PlayerManager.js';

class TeamManager {
  /**
   * Create teams for a room
   * @param {number} numTeams - Number of teams to create
   * @returns {Array} Array of team objects
   */
  createTeams(numTeams = CONFIG.DEFAULT_NUM_TEAMS) {
    const teams = [];
    const teamNames = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];

    for (let i = 0; i < numTeams; i++) {
      teams.push({
        id: i,
        name: teamNames[i] || `Team ${i + 1}`,
        players: [],
        score: 0
      });
    }

    console.log(`👥 Created ${numTeams} teams`);
    return teams;
  }

  /**
   * Assign players to teams with balanced distribution
   * @param {Map} playersMap - Map of players in the room
   * @param {Array} teams - Array of team objects
   * @returns {Array} Updated teams with assigned players
   */
  assignPlayersToTeams(playersMap, teams) {
    // Convert players map to array
    const players = Array.from(playersMap.values());

    // Shuffle players for random distribution
    const shuffledPlayers = this.shuffleArray([...players]);

    // Clear existing team assignments
    teams.forEach(team => {
      team.players = [];
    });

    // Distribute players evenly across teams
    shuffledPlayers.forEach((player, index) => {
      const teamIndex = index % teams.length;
      const team = teams[teamIndex];

      team.players.push(player.socketId);
      playerManager.setPlayerTeam(player.socketId, team.id);
    });

    // Log team distribution
    teams.forEach(team => {
      console.log(`  ${team.name}: ${team.players.length} players`);
    });

    return teams;
  }

  /**
   * Balance teams to ensure max 1 player difference
   * @param {Array} teams - Array of team objects
   * @returns {Array} Balanced teams
   */
  balanceTeams(teams) {
    // Sort teams by player count (ascending)
    const sortedTeams = [...teams].sort((a, b) => a.players.length - b.players.length);

    const minSize = sortedTeams[0].players.length;
    const maxSize = sortedTeams[sortedTeams.length - 1].players.length;

    // If difference is more than 1, rebalance
    if (maxSize - minSize > 1) {
      const largestTeam = sortedTeams[sortedTeams.length - 1];
      const smallestTeam = sortedTeams[0];

      // Move a player from largest to smallest team
      if (largestTeam.players.length > smallestTeam.players.length + 1) {
        const playerToMove = largestTeam.players.pop();
        smallestTeam.players.push(playerToMove);

        // Update player's team assignment
        playerManager.setPlayerTeam(playerToMove, smallestTeam.id);

        // Recursively balance if still unbalanced
        return this.balanceTeams(teams);
      }
    }

    return teams;
  }

  /**
   * Get the team a player belongs to
   * @param {Array} teams - Array of team objects
   * @param {string} socketId - Player's socket ID
   * @returns {Object|null} Team object or null if not found
   */
  getPlayerTeam(teams, socketId) {
    return teams.find(team => team.players.includes(socketId)) || null;
  }

  /**
   * Get team by ID
   * @param {Array} teams - Array of team objects
   * @param {number} teamId - Team ID
   * @returns {Object|null} Team object or null if not found
   */
  getTeamById(teams, teamId) {
    return teams.find(team => team.id === teamId) || null;
  }

  /**
   * Move a player to a different team
   * @param {Array} teams - Array of team objects
   * @param {string} socketId - Player's socket ID
   * @param {number} newTeamId - Target team ID
   * @returns {Object} Result with success status
   */
  reassignPlayer(teams, socketId, newTeamId) {
    // Remove from current team
    teams.forEach(team => {
      const index = team.players.indexOf(socketId);
      if (index > -1) {
        team.players.splice(index, 1);
      }
    });

    // Add to new team
    const newTeam = this.getTeamById(teams, newTeamId);
    if (newTeam) {
      newTeam.players.push(socketId);
      playerManager.setPlayerTeam(socketId, newTeamId);
      return { success: true };
    }

    return { success: false, message: 'Team not found' };
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get team statistics
   * @param {Array} teams - Array of team objects
   * @returns {Object} Statistics about teams
   */
  getTeamStats(teams) {
    return {
      totalTeams: teams.length,
      teamSizes: teams.map(t => t.players.length),
      isBalanced: Math.max(...teams.map(t => t.players.length)) -
                  Math.min(...teams.map(t => t.players.length)) <= 1
    };
  }
}

// Singleton instance
export const teamManager = new TeamManager();
