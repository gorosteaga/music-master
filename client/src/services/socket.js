import { io } from 'socket.io-client';
import { CONFIG } from '../config.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Connect to the Socket.IO server
   */
  connect() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(CONFIG.SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Create a new room
   * @returns {Promise<Object>} Room data
   */
  createRoom() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('create-room', (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Join an existing room
   * @param {string} roomId - Room code to join
   * @returns {Promise<Object>} Room data
   */
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('join-room', { roomId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Leave the current room
   * @param {string} roomId - Room code
   * @returns {Promise<void>}
   */
  leaveRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('leave-room', { roomId }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Start the game
   * @param {string} roomId - Room code
   * @param {number} numTeams - Number of teams
   * @returns {Promise<void>}
   */
  startGame(roomId, numTeams = 2) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('start-game', { roomId, numTeams }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Make a move in the game
   * @param {string} roomId - Room code
   * @param {Object} moveData - Move data (game-specific)
   * @returns {Promise<void>}
   */
  makeMove(roomId, moveData) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('make-move', { roomId, moveData }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * End the current turn
   * @param {string} roomId - Room code
   * @returns {Promise<Object>} Turn info
   */
  endTurn(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('end-turn', { roomId }, (response) => {
        if (response.success) {
          resolve(response.turnInfo);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Get room information
   * @param {string} roomId - Room code
   * @returns {Promise<Object>} Room data
   */
  getRoomInfo(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('get-room-info', { roomId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Singleton instance
export const socketService = new SocketService();
