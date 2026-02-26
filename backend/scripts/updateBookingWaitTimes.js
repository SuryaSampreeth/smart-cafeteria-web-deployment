require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { predictWaitTime } = require('../services/crowdPredictionService');
const connectDB = require('../config/db');

/*
 * This script updates the estimated wait time for all active bookings.
 * It manually triggers a recalculation using the latest prediction model.
 * Useful after seeding new historical data or changing the prediction algorithm.
 */
const updateExistingBookings = async () => {
    try {
        await connectDB();
        console.log('🔄 Updating existing bookings with smart wait times...\n');

        // Get all active bookings
        const activeBookings = await Booking.find({
            status: { $in: ['pending', 'serving'] },
        }).sort({ slotId: 1, queuePosition: 1 });

        console.log(`Found ${activeBookings.length} active bookings\n`);

        let updated = 0;

        for (const booking of activeBookings) {
            try {
                // Get smart prediction based on slot and queue position
                const prediction = await predictWaitTime(
                    booking.slotId,
                    booking.queuePosition
                );

                // Update the booking with refined estimate
                booking.estimatedWaitTime = prediction.predictedWaitTime;
                await booking.save();

                console.log(
                    `Updated ${booking.tokenNumber}: Position #${booking.queuePosition} → ${prediction.predictedWaitTime} mins (was ${booking.estimatedWaitTime})`
                );

                updated++;
            } catch (error) {
                console.error(`Error updating ${booking.tokenNumber}:`, error.message);
            }
        }

        console.log('\n═'.repeat(50));
        console.log(`\nUpdated ${updated} bookings with smart predictions!\n`);
        console.log('All active tokens now show accurate wait times based on:');
        console.log('   - 7 days of historical patterns');
        console.log('   - Hour-specific crowd levels');
        console.log('   - Peak hour detection');
        console.log('   - Real queue positions\n');
        console.log('═'.repeat(50));
        console.log('Booking update complete!\n');

        process.exit(0);
    } catch (error) {
        console.error('Error updating bookings:', error);
        process.exit(1);
    }
};

updateExistingBookings();
