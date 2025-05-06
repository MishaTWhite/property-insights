const express = require('express');
const cors = require('cors');
// Удалены импорты маршрутов, которые больше не существуют
// const ratesRoutes = require('./routes/rates');
// const baseRateRoutes = require('./routes/base-rate');
// const bankOffersRoutes = require('./routes/bank-offers');
const otodomAnalyzerRoutes = require('./routes/otodom-analyzer');
const otodomStatsRoutes = require('./routes/otodom-stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  // Configure CORS based on environment
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://property-insights.onrender.com'] 
    : '*',
  credentials: false
}));
app.use(express.json());

// Routes
// Удалены маршруты, которые больше не существуют
// app.use('/api', ratesRoutes);
// app.use('/api', baseRateRoutes);
// app.use('/api', bankOffersRoutes);
app.use('/api/otodom-analyzer', otodomAnalyzerRoutes);
app.use('/api/otodom-stats', otodomStatsRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});