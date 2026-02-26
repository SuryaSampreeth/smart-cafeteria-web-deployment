const mongoose = require('mongoose');

/*
 * This schema is used to store alert details when overcrowding happens.
 * It helps track crowd issues across different slots.
 */
const alertLogSchema = new mongoose.Schema({
    // Usage: Records the exact time the alert was triggered.
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
    },
    // Reference to the slot where the alert occurred
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: true,
        index: true,
    },
    // Percentage of slot capacity currently occupied
    occupancyRate: {
        type: Number, // Percentage
        required: true,
    },
    // Number of active bookings at the time of alert
    activeBookings: {
        type: Number,
        required: true,
    },
    // Maximum capacity of the slot
    totalCapacity: {
        type: Number,
        required: true,
    },
    // Type of alert (e.g., 'overcrowding', 'capacity_warning', 'spike_detected')
    alertType: {
        type: String,
        enum: ['overcrowding', 'capacity_warning', 'spike_detected'],
        default: 'overcrowding',
        required: true,
    },
    // Severity level of the alert
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'high',
        required: true,
    },
    // Usage: A human-readable message describing the issue.
    message: {
        type: String,
        required: true,
    },
    // Usage: List of staff/admins who were notified about this alert.
    notifiedUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        role: {
            type: String,
            enum: ['staff', 'admin'],
        },
        notifiedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    // Indicates whether the alert has been resolved
    resolved: {
        type: Boolean,
        default: false,
        index: true,
    },
    // Time when the alert was resolved
    resolvedAt: {
        type: Date,
    },
    // User who resolved the alert
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Notes added while resolving the alert
    resolvedNotes: {
        type: String,
    },
}, {
    timestamps: true,
});

// Indexes for efficient querying
alertLogSchema.index({ slotId: 1, timestamp: -1 });
alertLogSchema.index({ resolved: 1, timestamp: -1 });
alertLogSchema.index({ alertType: 1 });
alertLogSchema.index({ severity: 1 });

// Automatically delete resolved alerts after 30 days
alertLogSchema.index({
    resolvedAt: 1
}, {
    expireAfterSeconds: 2592000, // 30 days
    partialFilterExpression: { resolved: true }
});

module.exports = mongoose.model('AlertLog', alertLogSchema);
