const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { updateQueuePositions } = require('../utils/queueManager');
const { getNowIST, getCurrentTimeStringIST } = require('../utils/istTime');

/*
 * This service automatically expires bookings that are still pending
 * after their slot's end time has passed.
 * It runs periodically to keep the system clean and accurate.
 */

/**
 * Checks and expires all pending bookings whose slot time has ended
 */
const checkAndExpireBookings = async () => {
    try {
        const now = getNowIST();
        const currentTime = getCurrentTimeStringIST();

        console.log(`[${now.toUTCString().slice(17, 25)} IST] Running expired booking check...`);

        // Find all pending bookings
        const pendingBookings = await Booking.find({
            status: 'pending'
        }).populate('slotId', 'name endTime');

        if (pendingBookings.length === 0) {
            console.log('  No pending bookings found.');
            return;
        }

        let expiredCount = 0;
        const expiredBookingsBySlot = new Map();

        // Check each booking to see if its slot has ended
        for (const booking of pendingBookings) {
            if (!booking.slotId) {
                console.warn(`  Warning: Booking ${booking._id} has no slot reference`);
                continue;
            }

            const slotEndTime = booking.slotId.endTime;

            // Compare current time with slot end time
            if (currentTime > slotEndTime) {
                // Mark booking as expired
                booking.status = 'expired';
                booking.expiredAt = now;
                await booking.save();

                expiredCount++;

                // Track expired bookings by slot for capacity release
                const slotId = booking.slotId._id.toString();
                if (!expiredBookingsBySlot.has(slotId)) {
                    expiredBookingsBySlot.set(slotId, {
                        slotName: booking.slotId.name,
                        bookings: []
                    });
                }
                expiredBookingsBySlot.get(slotId).bookings.push({
                    id: booking._id,
                    tokenNumber: booking.tokenNumber,
                    queuePosition: booking.queuePosition
                });

                console.log(`  ✓ Expired: ${booking.tokenNumber} (${booking.slotId.name})`);
            }
        }

        // Release slot capacity and update queue positions
        for (const [slotId, data] of expiredBookingsBySlot) {
            const slot = await Slot.findById(slotId);
            if (slot) {
                // Decrease booking count
                const expiredBookingsCount = data.bookings.length;
                slot.currentBookings = Math.max(0, slot.currentBookings - expiredBookingsCount);
                await slot.save();

                console.log(`  Released ${expiredBookingsCount} slots for ${data.slotName}`);

                // Update queue positions for remaining bookings
                // Sort by queue position to update from lowest to highest
                data.bookings.sort((a, b) => a.queuePosition - b.queuePosition);

                for (const expiredBooking of data.bookings) {
                    await updateQueuePositions(slotId, expiredBooking.queuePosition);
                }
            }
        }

        if (expiredCount > 0) {
            console.log(`✅ Expired ${expiredCount} booking(s) successfully`);
        } else {
            console.log('  No bookings to expire at this time.');
        }

    } catch (error) {
        console.error('❌ Error in expired booking check:', error);
    }
};

/**
 * Starts the expired booking service
 * Runs immediately on startup, then every 5 minutes
 */
const startExpiredBookingService = (intervalMinutes = 5) => {
    console.log(`🕒 Starting expired booking service (checking every ${intervalMinutes} minutes)...`);

    // Run immediately on startup
    checkAndExpireBookings();

    // Then run periodically
    setInterval(() => {
        checkAndExpireBookings();
    }, intervalMinutes * 60 * 1000);
};

module.exports = {
    startExpiredBookingService,
    checkAndExpireBookings
};
