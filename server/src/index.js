// Load environment variables from .env file
require('dotenv').config();

console.log('🚀 Starting server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('DEEPSEEK_API_KEY set:', process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No');

const express = require('express');
const cors = require('cors');
const bankOffersRoutes = require('./routes/bank-offers');
const propertyAnalyzerRoutes = require('./routes/otodom-analyzer');
const otodomStatsRoutes = require('./routes/otodom-stats');
const aiChatRoutes = require('./routes/ai-chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Root endpoint for App Runner health check - MUST be defined first
app.get('/', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

console.log("✅ GET / route is mounted");

// Configure CORS - must be before routes
// Parse CORS_ORIGIN from environment variable
const parseAllowedOrigins = () => {
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  if (corsOrigin === '*') {
    return '*'; // Wildcard case
  }
  // Parse comma-separated list
  return corsOrigin.split(',').map(origin => origin.trim());
};

const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = parseAllowedOrigins();
    
    // Handle wildcard case
    if (allowedOrigins === '*' || !origin) {
      callback(null, true);
      return;
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json());

// Add a root handler for /api
app.get('/api', (req, res) => {
  return res.status(200).json({ status: 'API is running' });
});

// Add a root handler for /api/otodom-analyzer
app.get('/api/otodom-analyzer', (req, res) => {
  return res.status(200).json({ status: 'Otodom Analyzer API is running' });
});

// Routes
app.use('/api', bankOffersRoutes);
app.use('/api/otodom-analyzer', propertyAnalyzerRoutes);
app.use('/api/otodom-stats', otodomStatsRoutes);
app.use('/api/ai-chat', aiChatRoutes);

// Simple health check endpoint
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});