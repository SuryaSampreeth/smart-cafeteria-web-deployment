const mongoose = require('mongoose');
require('dotenv').config();
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const AlertLog = require('../models/AlertLog');
const connectDB = require('../config/db');
const { detectOvercrowding } = require('../services/alertService');

const verifyAlerts = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // 1. Find a suitable slot
        const slot = await Slot.findOne({ isActive: true, capacity: { $gt: 0 } });
        if (!slot) {
            console.log('No active slot found.');
            process.exit(0);
        }
        console.log(`Testing with slot: ${slot.name} (Capacity: ${slot.capacity})`);

        // 2. Clear existing bookings for this slot to start fresh
        await Booking.deleteMany({ slotId: slot._id });
        await AlertLog.deleteMany({ slotId: slot._id });
        console.log('Cleared existing bookings and alerts.');

        // 3. Create bookings to reach 90% capacity
        const targetBookings = Math.ceil(slot.capacity * 0.9);
        const bookings = [];
        for (let i = 0; i < targetBookings; i++) {
            bookings.push({
                studentId: new mongoose.Types.ObjectId(), // Fake student ID
                slotId: slot._id,
                tokenNumber: 1000 + i,
                status: 'pending',
                items: [],
                queuePosition: i + 1,
                estimatedWaitTime: 5
            });
        }
        await Booking.insertMany(bookings);
        console.log(`Created ${targetBookings} bookings.`);

        // 4. Update slot currentBookings
        slot.currentBookings = targetBookings;
        await slot.save();

        // 5. Trigger Alert Check (This mocks what the controller/interval does)
        console.log('Triggering alert check...');
        const alerts = await detectOvercrowding();

        // 6. Verify Alert
        if (alerts.length > 0) {
            console.log('✅ Success: Overcrowding alert generated!');
            console.log('Alert Message:', alerts[0].message);
        } else {
            console.log('❌ Failed: No alert generated.');
        }

        // 7. Cleanup
        await Booking.deleteMany({ slotId: slot._id });
        await AlertLog.deleteMany({ slotId: slot._id });
        slot.currentBookings = 0;
        await slot.save();
        console.log('Cleanup completed.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyAlerts();
