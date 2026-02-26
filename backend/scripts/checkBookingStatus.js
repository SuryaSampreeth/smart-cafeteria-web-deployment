require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const connectDB = require('../config/db');

/*
 * This script checks the current booking statuses
 * to verify the auto-expiration feature is working
 */
const checkBookingStatus = async () => {
    try {
        await connectDB();

        console.log('\n📊 Checking Booking Status...\n');
        console.log('═'.repeat(60));

        // Get all slots
        const slots = await Slot.find({});

        for (const slot of slots) {
            console.log(`\n${slot.name} (${slot.startTime} - ${slot.endTime})`);
            console.log('-'.repeat(60));

            // Get bookings for this slot
            const bookings = await Booking.find({ slotId: slot._id });

            if (bookings.length === 0) {
                console.log('  No bookings found');
                continue;
            }

            // Count by status
            const statusCounts = {
                pending: 0,
                serving: 0,
                served: 0,
                cancelled: 0,
                expired: 0
            };

            bookings.forEach(booking => {
                statusCounts[booking.status]++;
            });

            console.log(`  Total Bookings: ${bookings.length}`);
            console.log(`  📝 Pending: ${statusCounts.pending}`);
            console.log(`  🔄 Serving: ${statusCounts.serving}`);
            console.log(`  ✅ Served: ${statusCounts.served}`);
            console.log(`  ❌ Cancelled: ${statusCounts.cancelled}`);
            console.log(`  ⏰ Expired: ${statusCounts.expired}`);
            console.log(`  Current Capacity: ${slot.currentBookings}/${slot.capacity}`);
        }

        console.log('\n' + '═'.repeat(60));
        console.log('\n✅ Status check complete!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking booking status:', error);
        process.exit(1);
    }
};

checkBookingStatus();
