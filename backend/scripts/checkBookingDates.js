require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const connectDB = require('../config/db');

const checkBookingDates = async () => {
    await connectDB();

    console.log('\n📅 Checking Booking Dates...\n');
    console.log('═'.repeat(60));

    const bookings = await Booking.find({}).sort({ bookedAt: -1 }).limit(10);

    console.log(`\nTotal Bookings: ${await Booking.countDocuments({})}`);
    console.log(`\nMost Recent 10 Bookings:\n`);

    bookings.forEach((booking, index) => {
        const date = new Date(booking.bookedAt);
        const timeAgo = Math.round((Date.now() - date.getTime()) / 60000);
        console.log(`${index + 1}. Token: ${booking.tokenNumber}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Booked: ${date.toLocaleString()}`);
        console.log(`   Time ago: ${timeAgo} minutes\n`);
    });

    console.log('═'.repeat(60));
    process.exit(0);
};

checkBookingDates();
