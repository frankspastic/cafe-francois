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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../client/dist');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

    // WebSocket connection handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
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
