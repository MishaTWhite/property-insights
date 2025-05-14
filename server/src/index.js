// Load environment variables from .env file
require('dotenv').config();

console.log('🚀 Starting server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('DEEPSEEK_API_KEY set:', process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No');

const express = require('express');
const cors = require('cors');
const bankOffersRoutes = require('./routes/bank-offers');
const otodomAnalyzerRoutes = require('./routes/otodom-analyzer');
const otodomStatsRoutes = require('./routes/otodom-stats');
const aiChatRoutes = require('./routes/ai-chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Explicit handling of preflight requests
app.options('*', cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

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
app.use('/api/ai-chat', aiChatRoutes);

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});