require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const connectDB = require('../config/db');

/*
 * This script verifies the integrity of the booking queue.
 * It checks if any student is being served out of order (FIFO violation).
 */
const checkQueueOrder = async () => {
    try {
        await connectDB();
        console.log('\nCHECKING QUEUE ORDER\n');
        console.log('═'.repeat(60));

        // Fetch active bookings (pending or serving)
        const bookings = await Booking.find({
            status: { $in: ['pending', 'serving'] }
        })
            .populate({
                path: 'slotId',
                select: 'name'
            })
            // Sort by slot and then by queue position to see the order clearly
            .sort({ slotId: 1, queuePosition: 1 })
            .lean();

        let currentSlot = null;
        let issues = [];

        bookings.forEach(booking => {
            if (currentSlot !== booking.slotId.name) {
                currentSlot = booking.slotId.name;
                console.log(`\n${currentSlot}:`);
            }

            const statusIcon = booking.status === 'serving' ? '🔔' : '⏳';
            console.log(
                `  Position #${booking.queuePosition}: ${booking.tokenNumber} - ` +
                `${statusIcon} ${booking.status.toUpperCase()}`
            );

            // Check for violations
            if (booking.status === 'pending' && booking.queuePosition > 1) {
                // Check if there's a serving status before this position
                const earlierServing = bookings.find(b =>
                    b.slotId._id.toString() === booking.slotId._id.toString() &&
                    b.queuePosition < booking.queuePosition &&
                    b.status === 'serving'
                );

                if (earlierServing) {
                    issues.push(
                        ` VIOLATION: ${booking.slotId.name} - Position #${earlierServing.queuePosition} ` +
                        `is SERVING while #${booking.queuePosition} is still PENDING`
                    );
                }
            }
        });

        console.log('\n' + '═'.repeat(60));

        if (issues.length > 0) {
            console.log('\nQUEUE ORDER VIOLATIONS FOUND:\n');
            issues.forEach(issue => console.log(issue));
        } else {
            console.log('\nQueue order is correct! FIFO maintained.');
        }

        console.log('\n═'.repeat(60));
        process.exit(0);
    } catch (error) {
        console.error(' Error:', error);
        process.exit(1);
    }
};

checkQueueOrder();
