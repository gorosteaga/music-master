export const CONFIG = {
  PORT: process.env.PORT || 3001,
  ROOM_CODE_LENGTH: 6,
  MAX_PLAYERS_PER_ROOM: 20,
  MIN_PLAYERS_TO_START: 2,
  DEFAULT_NUM_TEAMS: 2,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
