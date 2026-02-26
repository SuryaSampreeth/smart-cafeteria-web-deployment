const Booking = require('../models/Booking');

/*
 * This function generates a unique token number for each booking.
 * The token resets daily and is based on the slot name.
 * Example formats: B001 (Breakfast), L023 (Lunch).
 */
const generateTokenNumber = async (slotId, slotName) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
