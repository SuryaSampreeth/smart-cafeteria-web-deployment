require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { getOrCreateTodaySlots } = require('../utils/slotManager');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const connectDB = require('../config/db');

/*
 * This script populates the database with crowd data for testing.
 * It creates bookings with specific occupancy levels (Low, Medium, High, Critical)
 * to simulate different crowd conditions.
 */
const seedCrowdData = async () => {
    try {
        await connectDB();

        console.log(' Starting crowd data seeding...\n');

        // Check if slots exist
        const allSlots = await getOrCreateTodaySlots();
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const slots = allSlots.filter(s => currentTime < s.endTime);
        console.log(`Found ${slots.length} active slots for today\n`);

        if (slots.length === 0) {
            console.log(' No active slots found. Please run seed script first.');
            process.exit(1);
        }

        // Check if students exist
        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students\n`);

        if (students.length === 0) {
            console.log(' No students found. Please create student accounts.');
            process.exit(1);
        }

        // Check if menu items exist
        const menuItems = await MenuItem.find();
        console.log(`Found ${menuItems.length} menu items\n`);

        if (menuItems.length === 0) {
            console.log(' No menu items found. Please run seed script first.');
            process.exit(1);
        }

        // Cleanup: Remove ALL existing bookings to start fresh
        await Booking.deleteMany({});
        console.log('✅ Cleared all existing bookings\n');

        let totalBookingsCreated = 0;

        // Loop through each slot and fill it to a specific percentage
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];

            // Assign different occupancy targets for variety
            let targetOccupancy;
            switch (i % 4) {
                case 0:
                    targetOccupancy = 0.3; // 30% - Low Traffic
                    break;
                case 1:
                    targetOccupancy = 0.55; // 55% - Medium Traffic
                    break;
                case 2:
                    targetOccupancy = 0.75; // 75% - High Traffic
                    break;
                case 3:
                    targetOccupancy = 0.92; // 92% - Critical/Overcrowded
                    break;
            }

            const targetBookings = Math.floor(slot.capacity * targetOccupancy);
            console.log(`Creating ${targetBookings} bookings for ${slot.name} (${Math.round(targetOccupancy * 100)}% occupancy)...`);

            // Setup token timestamp and prefix
            const today = new Date();
            const dateStr = `${today.getDate()}${today.getMonth() + 1}`;
            const slotPrefix = slot.name.substring(0, 2).toUpperCase();

            // Create individual bookings
            for (let j = 0; j < targetBookings; j++) {
                // Pick a random student
                const randomStudent = students[Math.floor(Math.random() * students.length)];

                // Pick random food items
                const numItems = Math.floor(Math.random() * 3) + 1;
                const selectedItems = [];

                for (let k = 0; k < numItems; k++) {
                    const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
                    const quantity = Math.floor(Math.random() * 2) + 1;

                    selectedItems.push({
                        menuItemId: randomItem._id,
                        quantity: quantity
                    });
                }

                // Estimate wait time based on queue position
                const estimatedWaitTime = Math.max(5, (j + 1) * 3);

                // Insert booking record
                const booking = await Booking.create({
                    studentId: randomStudent._id,
                    slotId: slot._id,
                    tokenNumber: `${slotPrefix}${dateStr}${String(j + 1).padStart(3, '0')}`,
                    items: selectedItems,
                    queuePosition: j + 1,
                    estimatedWaitTime: estimatedWaitTime,
                    status: 'pending',
                    bookedAt: new Date(Date.now() - Math.random() * 1800000), // Random time in last 30 mins
                });

                totalBookingsCreated++;
            }

            // Update the slot with new booking count
            slot.currentBookings = targetBookings;
            await slot.save();

            console.log(` Created ${targetBookings} bookings for ${slot.name}\n`);
        }

        console.log('═'.repeat(50));
        console.log(`\n Successfully created ${totalBookingsCreated} bookings!\n`);
        console.log(' Occupancy Summary:');

        // Display final occupancy stats
        for (const slot of slots) {
            const occupancyRate = Math.round((slot.currentBookings / slot.capacity) * 100);
            const levelEmoji = occupancyRate < 40 ? '🟢' : occupancyRate < 70 ? '🟡' : occupancyRate < 90 ? '🟠' : '🔴';
            console.log(`   ${levelEmoji} ${slot.name}: ${slot.currentBookings}/${slot.capacity} (${occupancyRate}%)`);
        }

        console.log('\n Tips:');
        console.log('   - Wait 5 minutes for crowd tracking to capture snapshots');
        console.log('   - Slots with >80% occupancy will trigger alerts within 10 minutes');
        console.log('   - Slots with >90% occupancy will trigger critical alerts');
        console.log('   - Check the crowd monitoring screens in the frontend\n');

        console.log('═'.repeat(50));
        console.log(' Crowd data seeding complete!\n');

        process.exit(0);
    } catch (error) {
        console.error(' Error seeding crowd data:', error);
        process.exit(1);
    }
};

seedCrowdData();
