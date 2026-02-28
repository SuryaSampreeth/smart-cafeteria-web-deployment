const Booking = require('../models/Booking');
const { getNowIST } = require('./istTime');

/*
 * This function generates a unique token number for each booking.
 * The token resets daily and is based on the slot name.
 * Example formats: B001 (Breakfast), L023 (Lunch).
 */
const generateTokenNumber = async (slotId, slotName) => {
    const today = getNowIST();
    today.setUTCHours(0, 0, 0, 0); // Midnight in IST (since getNowIST shifts to IST)

    // Count how many bookings are already made for this slot today
    const count = await Booking.countDocuments({
        slotId,
        bookedAt: { $gte: today },
    });

    // Generate token using slot initial and sequence number
    const prefix = slotName.charAt(0).toUpperCase();           // e.g., 'L' for Lunch
    const number = String(count + 1).padStart(3, '0');         // e.g., '005'

    return `${prefix}${number}`;
};

module.exports = { generateTokenNumber };
