import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONFIG } from './config.js';
import { setupSocketHandlers } from './handlers/socketHandlers.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: CONFIG.CORS_ORIGIN,
  credentials: true
}));

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Socket.IO event handlers
setupSocketHandlers(io);

// Start server
httpServer.listen(CONFIG.PORT, () => {
  console.log(`🚀 Server running on port ${CONFIG.PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🌐 CORS enabled for: ${CONFIG.CORS_ORIGIN}`);
});
