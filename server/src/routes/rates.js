const express = require('express');
const router = express.Router();

/**
 * @route GET /api/base-rate
 * @desc Get the base interest rate
 * @access Public
 */
// This route is now handled in base-rate.js
// router.get('/base-rate', (req, res) => {
//   // Mock response - in a real application, this would come from a database or external API
//   res.json({ baseRate: 5.75 });
// });

module.exports = router;