const express = require('express');
const router = express.Router();

// Данные о банковских предложениях
const bankOffers = [
  {
    "bankName": "PKO BP",
    "margin": 2.3,
    "baseRateName": "WIBOR 3M",
    "baseRateValue": 5.88,
    "totalRate": 8.18
  },
  {
    "bankName": "Santander",
    "margin": 2.39,
    "baseRateName": "WIBOR 3M",
    "baseRateValue": 5.88,
    "totalRate": 8.27
  },
  {
    "bankName": "ING Bank Śląski",
    "margin": 2.15,
    "baseRateName": "WIBOR 6M",
    "baseRateValue": 5.90,
    "totalRate": 8.05
  },
  {
    "bankName": "mBank",
    "margin": 2.40,
    "baseRateName": "WIBOR 3M",
    "baseRateValue": 5.88,
    "totalRate": 8.28
  },
  {
    "bankName": "Millennium",
    "margin": 2.20,
    "baseRateName": "WIBOR 6M",
    "baseRateValue": 5.90,
    "totalRate": 8.10
  }
];

// Маршрут для получения банковских предложений
router.get('/bank-offers', (req, res) => {
  res.json(bankOffers);
});

module.exports = router;