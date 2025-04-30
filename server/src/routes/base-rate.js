const express = require('express');
const router = express.Router();

// GET current base interest rate
router.get('/', (req, res) => {
  // This would typically come from a database or external API
  // For now, we'll use a static value as a placeholder
  res.json({
    baseRate: 7.75,
    lastUpdated: new Date().toISOString(),
    source: 'Polish Central Bank (placeholder)'
  });
});

module.exports = router;