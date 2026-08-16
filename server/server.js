import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, seedDatabase } from './db/database.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import settingsRoutes from './routes/settings.js';
import { isValidSession } from './auth.js';
import { debug } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../client/dist');

// In production the client is served from this same origin, so cross-origin
// requests only need to be allowed for the local Vite dev server. Set
// ALLOWED_ORIGINS (comma separated) to permit others.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

const corsOptions = {
  origin(origin, callback) {
    // Same-origin and non-browser clients send no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  }
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 3000;

// Railway terminates TLS upstream, so trust its proxy headers to get the real
// client IP for PIN rate limiting.
app.set('trust proxy', 1);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    seedDatabase();

    // Routes
    app.use('/api/menu', menuRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/settings', settingsRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Serve the built client (production)
    app.use(express.static(clientDist));
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });

    // WebSocket connection handling.
    //
    // Order events carry guest names and drinks, so nothing is broadcast to every
    // socket. Baristas authenticate into the 'barista' room; guests subscribe only
    // to the order they just placed.
    io.on('connection', (socket) => {
      debug('Client connected:', socket.id);

      socket.on('barista:join', (token, ack) => {
        if (!isValidSession(token)) {
          if (typeof ack === 'function') ack({ ok: false });
          return;
        }
        socket.join('barista');
        if (typeof ack === 'function') ack({ ok: true });
      });

      socket.on('order:subscribe', (orderId) => {
        const id = Number(orderId);
        if (Number.isInteger(id) && id > 0) socket.join(`order:${id}`);
      });

      socket.on('disconnect', () => {
        debug('Client disconnected:', socket.id);
      });
    });

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
