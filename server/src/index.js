console.log('🚀 Starting server...');

const express = require('express');
const cors = require('cors');
const bankOffersRoutes = require('./routes/bank-offers');
const otodomAnalyzerRoutes = require('./routes/otodom-analyzer');
const otodomStatsRoutes = require('./routes/otodom-stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', bankOffersRoutes);
app.use('/api/otodom-analyzer', otodomAnalyzerRoutes);
app.use('/api/otodom-stats', otodomStatsRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error(error.stack);
  process.exit(1);
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.error(reason.stack);
  // Not calling process.exit here to allow other handlers to recover if possible
});

try {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}