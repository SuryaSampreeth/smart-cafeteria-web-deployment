require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import route files
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/admin');
const menuRoutes = require('./routes/menu');
const crowdRoutes = require('./routes/crowd');
const demandForecastRoutes = require('./routes/demandForecast');

// Initialize the Express application
const app = express();

// Standard Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded data

// Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/demand-forecast', demandForecastRoutes);

// Import background services for crowd monitoring
const { startTracking } = require('./services/crowdTrackingService');
const { performAlertCheck } = require('./services/alertService');
const { aggregateDailyData } = require('./services/crowdPredictionService');
const { startExpiredBookingService } = require('./services/expiredBookingService');

// Simple health check route to verify server status
app.get('/', (req, res) => {
    res.json({ message: 'Smart Cafeteria API is running' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

/*
 * This function starts the backend server.
 * It connects to the database, starts the server,
 * and initializes all background services.
 */
const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);

            // Start background crowd tracking (snapshots every 2 mins)
            console.log('Starting crowd monitoring system...');
            startTracking(2);

            // Set up interval for Alert Checks (every 1 min)
            setInterval(() => {
                performAlertCheck();
            }, 1 * 60 * 1000);

            // Schedule Daily Data Aggregation (runs effectively at midnight/early morning)
            const scheduleDailyAggregation = () => {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 5, 0, 0); // Target time: 00:05 AM tomorrow

                const timeUntilMidnight = tomorrow - now;

                // Set initial timeout to run at next midnight
                setTimeout(() => {
                    aggregateDailyData();
                    // Then repeat every 24 hours
                    setInterval(() => {
                        aggregateDailyData();
                    }, 24 * 60 * 60 * 1000);
                }, timeUntilMidnight);
            };

            scheduleDailyAggregation();
            console.log('✅ Crowd monitoring system initialized');

            // Start expired booking service (checks every 5 mins)
            startExpiredBookingService(5);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Execute start logic
startServer();
