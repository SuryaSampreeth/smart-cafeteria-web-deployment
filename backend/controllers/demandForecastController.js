const axios = require('axios');
const DemandForecast = require('../models/DemandForecast');

// URL of the Python ML service
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ==================== HELPER FUNCTIONS ====================

/**
 * Fetch data from the Python ML service with error handling.
 * @param {string} endpoint - The API endpoint to call
 * @param {string} method - HTTP method (GET or POST)
 * @param {object} params - Query parameters
 */
async function callMLService(endpoint, method = 'GET', params = {}) {
    try {
        const config = {
            method,
            url: `${ML_SERVICE_URL}${endpoint}`,
            timeout: 60000, // 60 second timeout (retraining can take a while)
        };

        if (method === 'GET') {
            config.params = params;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`ML Service error: ${error.response.data.error || error.response.statusText}`);
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('ML Service is not running. Start it with: cd backend/ml_service && python app.py');
        } else {
            throw new Error(`ML Service connection failed: ${error.message}`);
        }
    }
}

// ==================== CONTROLLER FUNCTIONS ====================

/**
 * GET /api/demand-forecast/daily
 * Get daily demand forecast for the next 7 days.
 */
const getDailyForecast = async (req, res) => {
    try {
        const days = req.query.days || 7;
        const data = await callMLService('/api/forecast/daily', 'GET', { days });

        // Cache the result
        await DemandForecast.findOneAndUpdate(
            { forecastType: 'daily' },
            {
                forecastType: 'daily',
                modelUsed: data.model_used,
                generatedAt: new Date(),
                forecastHorizon: data.forecast_horizon,
                forecastData: data.data.map(d => ({
                    date: new Date(d.date),
                    dayName: d.day_name,
                    predictedDemand: d.predicted_demand,
                    confidence: d.confidence,
                })),
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            forecastType: 'daily',
            modelUsed: data.model_used,
            generatedAt: data.generated_at,
            forecastHorizon: data.forecast_horizon,
            data: data.data,
        });
    } catch (error) {
        console.error('[DemandForecast] Daily forecast error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * GET /api/demand-forecast/weekly
 * Get weekly demand forecast for the next 4 weeks.
 */
const getWeeklyForecast = async (req, res) => {
    try {
        const weeks = req.query.weeks || 4;
        const data = await callMLService('/api/forecast/weekly', 'GET', { weeks });

        // Cache the result
        await DemandForecast.findOneAndUpdate(
            { forecastType: 'weekly' },
            {
                forecastType: 'weekly',
                modelUsed: data.model_used,
                generatedAt: new Date(),
                forecastHorizon: data.forecast_horizon,
                forecastData: data.data.map(d => ({
                    date: new Date(d.start_date),
                    predictedDemand: d.total_predicted_demand,
                    confidence: d.confidence,
                })),
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            forecastType: 'weekly',
            modelUsed: data.model_used,
            generatedAt: data.generated_at,
            forecastHorizon: data.forecast_horizon,
            data: data.data,
        });
    } catch (error) {
        console.error('[DemandForecast] Weekly forecast error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * GET /api/demand-forecast/monthly
 * Get monthly demand forecast for the next 3 months.
 */
const getMonthlyForecast = async (req, res) => {
    try {
        const months = req.query.months || 3;
        const data = await callMLService('/api/forecast/monthly', 'GET', { months });

        // Cache the result
        await DemandForecast.findOneAndUpdate(
            { forecastType: 'monthly' },
            {
                forecastType: 'monthly',
                modelUsed: data.model_used,
                generatedAt: new Date(),
                forecastHorizon: data.forecast_horizon,
                forecastData: data.data.map(d => ({
                    date: new Date(d.start_date),
                    predictedDemand: d.total_predicted_demand,
                    confidence: d.confidence,
                })),
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            forecastType: 'monthly',
            modelUsed: data.model_used,
            generatedAt: data.generated_at,
            forecastHorizon: data.forecast_horizon,
            data: data.data,
        });
    } catch (error) {
        console.error('[DemandForecast] Monthly forecast error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * GET /api/demand-forecast/accuracy
 * Get model accuracy metrics for all trained models.
 */
const getModelAccuracy = async (req, res) => {
    try {
        const data = await callMLService('/api/forecast/accuracy');

        res.json({
            success: true,
            bestModel: data.best_model,
            activeModel: data.active_model,
            trainedAt: data.trained_at,
            models: data.models,
            description: data.description,
        });
    } catch (error) {
        console.error('[DemandForecast] Accuracy fetch error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * POST /api/demand-forecast/retrain
 * Trigger model retraining on the ML service.
 */
const triggerRetrain = async (req, res) => {
    try {
        const data = await callMLService('/api/forecast/retrain', 'POST');

        res.json({
            success: true,
            status: data.status,
            message: data.message,
            activeModel: data.active_model,
        });
    } catch (error) {
        console.error('[DemandForecast] Retrain error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * GET /api/demand-forecast/historical
 * Get historical actual vs predicted comparison data.
 */
const getHistoricalComparison = async (req, res) => {
    try {
        const data = await callMLService('/api/forecast/historical');

        res.json({
            success: true,
            modelUsed: data.model_used,
            period: data.period,
            data: data.data,
        });
    } catch (error) {
        console.error('[DemandForecast] Historical data error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * GET /api/demand-forecast/health
 * Check if the ML service is running and healthy.
 */
const checkMLHealth = async (req, res) => {
    try {
        const data = await callMLService('/api/health');
        res.json({
            success: true,
            mlService: data,
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            error: error.message,
            hint: 'Start the ML service: cd backend/ml_service && python app.py',
        });
    }
};

module.exports = {
    getDailyForecast,
    getWeeklyForecast,
    getMonthlyForecast,
    getModelAccuracy,
    triggerRetrain,
    getHistoricalComparison,
    checkMLHealth,
};
