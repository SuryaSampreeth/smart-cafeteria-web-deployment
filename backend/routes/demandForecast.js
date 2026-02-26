const express = require('express');
const router = express.Router();
const {
    getDailyForecast,
    getWeeklyForecast,
    getMonthlyForecast,
    getModelAccuracy,
    triggerRetrain,
    getHistoricalComparison,
    checkMLHealth,
} = require('../controllers/demandForecastController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// ==================== ADMIN ROUTES ====================
// All demand forecast routes are restricted to admin users

// Check ML service health status
router.get('/health', protect, checkRole('admin'), checkMLHealth);

// Get daily demand forecast (next 7 days)
router.get('/daily', protect, checkRole('admin'), getDailyForecast);

// Get weekly demand forecast (next 4 weeks)
router.get('/weekly', protect, checkRole('admin'), getWeeklyForecast);

// Get monthly demand forecast (next 3 months)
router.get('/monthly', protect, checkRole('admin'), getMonthlyForecast);

// Get model accuracy metrics
router.get('/accuracy', protect, checkRole('admin'), getModelAccuracy);

// Get historical actual vs predicted data
router.get('/historical', protect, checkRole('admin'), getHistoricalComparison);

// Trigger model retraining (POST)
router.post('/retrain', protect, checkRole('admin'), triggerRetrain);

module.exports = router;
