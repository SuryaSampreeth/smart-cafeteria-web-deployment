require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const connectDB = require('../config/db');

// Main function to clear all bookings
const Slot = require('../models/Slot');

const clearBookings = async () => {
    try {
        await connectDB();

        // 1. Delete all bookings
        const bookingResult = await Booking.deleteMany({});
        console.log(`Successfully deleted ${bookingResult.deletedCount} bookings.`);

        // 2. Reset booking counts in Slots
        const slotResult = await Slot.updateMany({}, { $set: { currentBookings: 0 } });
        console.log(`Successfully reset booking counts for ${slotResult.modifiedCount} slots.`);

        console.log('Clearing process completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing bookings:', error);
        process.exit(1);
    }
};

clearBookings();
