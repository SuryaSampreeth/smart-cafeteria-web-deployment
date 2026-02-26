require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const connectDB = require('../config/db');

/*
 * This script repairs the queue order.
 * It ensures that only the first person in the queue is 'serving'
 * and everyone else is 'pending' to maintain FIFO.
 */
const fixQueueOrder = async () => {
    try {
        await connectDB();
        console.log('\n FIXING QUEUE ORDER\n');
        console.log('═'.repeat(60));

        // Get all active slots
        const slots = await Slot.find({ isActive: true });

        for (const slot of slots) {
            console.log(`\n Processing ${slot.name}...`);

            // Get all active bookings for this slot, sorted by position
            const bookings = await Booking.find({
                slotId: slot._id,
                status: { $in: ['pending', 'serving'] }
            }).sort({ queuePosition: 1 });

            console.log(`  Found ${bookings.length} active bookings`);

            // Enforce Rule: Only position #1 can be 'serving', others 'pending'

            let fixed = 0;
            for (let i = 0; i < bookings.length; i++) {
                const booking = bookings[i];
                const shouldBeServing = (i === 0); // Only the first one

                if (shouldBeServing && booking.status === 'pending') {
                    // Update first booking to 'serving'
                    booking.status = 'serving';
                    await booking.save();
                    console.log(`   Fixed #${booking.queuePosition} ${booking.tokenNumber}: pending → serving`);
                    fixed++;
                } else if (!shouldBeServing && booking.status === 'serving') {
                    // Downgrade others to 'pending' if they were wrongly marked
                    booking.status = 'pending';
                    await booking.save();
                    console.log(`   Fixed #${booking.queuePosition} ${booking.tokenNumber}: serving → pending`);
                    fixed++;
                }
            }

            if (fixed === 0) {
                console.log(`   Queue order already correct!`);
            } else {
                console.log(`  Fixed ${fixed} bookings`);
            }
        }

        console.log('\n' + '═'.repeat(60));
        console.log('\n Queue order fixed! FIFO maintained.\n');
        console.log(' Current Queue Status:\n');

        // Display final sorted queue for verification
        for (const slot of slots) {
            const bookings = await Booking.find({
                slotId: slot._id,
                status: { $in: ['pending', 'serving'] }
            }).sort({ queuePosition: 1 });

            if (bookings.length > 0) {
                console.log(`${slot.name}:`);
                bookings.forEach(b => {
                    const icon = b.status === 'serving' ? '🔔' : '⏳';
                    console.log(`  #${b.queuePosition}: ${b.tokenNumber} ${icon} ${b.status.toUpperCase()}`);
                });
                console.log('');
            }
        }

        console.log('═'.repeat(60));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixQueueOrder();
