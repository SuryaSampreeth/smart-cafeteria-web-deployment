const mongoose = require('mongoose');

/*
 * This Schema tracks the food orders made by students.
 * It links students to slots, tokens, and the items they ordered.
 */
const bookingSchema = new mongoose.Schema({
    // The student who made the booking
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The time slot for which the booking is made
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: true,
    },
    // Unique token number assigned for this booking
    tokenNumber: {
        type: String,
        required: true,
    },
    // List of food items ordered
    items: [{
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    }],
    // Current position in the serving queue
    queuePosition: {
        type: Number,
        required: true,
    },
    // Current status of the booking
    status: {
        type: String,
        enum: ['pending', 'serving', 'served', 'cancelled', 'expired'],
        default: 'pending',
    },
    // Predicted waiting time in minutes
    estimatedWaitTime: {
        type: Number, // in minutes
        default: 0,
    },
    // Time when the booking was created
    bookedAt: {
        type: Date,
        default: Date.now,
    },
    // Time when the student was actually served
    servedAt: {
        type: Date,
    },
    // Time when the booking was cancelled (if booking is cancelled)
    cancelledAt: {
        type: Date,
    },
    // Time when the booking was auto-expired (if slot time passed)
    expiredAt: {
        type: Date,
    },
    // Log of any changes made to the booking
    modificationHistory: [{
        modifiedAt: Date,
        changes: String,
    }],
}, {
    timestamps: true,
});

// Indexes to speed up searching bookings
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ slotId: 1, status: 1, queuePosition: 1 });
bookingSchema.index({ tokenNumber: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
