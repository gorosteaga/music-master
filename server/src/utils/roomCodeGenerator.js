import { customAlphabet } from 'nanoid';
import { CONFIG } from '../config.js';

// Use only uppercase letters and numbers, excluding similar looking characters
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, CONFIG.ROOM_CODE_LENGTH);

/**
 * Generate a unique room code
 * @returns {string} A random room code (e.g., "A3B5C7")
 */
export function generateRoomCode() {
  return nanoid();
}
