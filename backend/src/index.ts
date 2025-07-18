import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDatabaseConnection } from './config/database';
import musicalsRoutes from './routes/musicals';
import castMembersRoutes from './routes/cast-members';
import ticketmasterRoutes from './routes/ticketmaster';
import importRoutes from './routes/import';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shows For Us API is running!',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /api/musicals',
      'GET /api/cast-members',
      'GET /api/ticketmaster/events',
      'GET /api/ticketmaster/musicals',
      'GET /api/ticketmaster/status',
      'POST /api/import/musicals',
      'GET /api/import/stats'
    ]
  });
});

app.get('/health', async (_req, res) => {
  const dbStatus = await testDatabaseConnection();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'Connected' : 'Disconnected'
  });
});

// API Routes
app.use('/api/musicals', musicalsRoutes);
app.use('/api/cast-members', castMembersRoutes);
app.use('/api/ticketmaster', ticketmasterRoutes);
app.use('/api/import', importRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}`);
});