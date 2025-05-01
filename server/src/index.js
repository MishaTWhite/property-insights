const express = require('express');
const cors = require('cors');
const ratesRoutes = require('./routes/rates');
const baseRateRoutes = require('./routes/base-rate');
const bankOffersRoutes = require('./routes/bank-offers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  // Allow requests from any origin for better development experience
  origin: '*',
  credentials: false
}));
app.use(express.json());

// Routes
app.use('/api', ratesRoutes);
app.use('/api', baseRateRoutes);
app.use('/api', bankOffersRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/base-rate`);
  console.log(`Bank offers API available at http://localhost:${PORT}/api/bank-offers`);
});