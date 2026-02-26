const mongoose = require('mongoose');

/*
 * This Schema stores snapshots of crowd levels at specific times.
 * It is used to analyze historical crowd patterns and predict future wait times.
 */
const crowdDataSchema = new mongoose.Schema({
    // Time when this snapshot was recorded
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
    },
    // The slot being monitored
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: true,
        index: true,
    },
    // Number of active bookings at that moment
    activeBookings: {
        type: Number,
        required: true,
        default: 0,
    },
    // Maximum capacity of the slot
    totalCapacity: {
        type: Number,
        required: true,
    },
    // Percentage of capacity used
    occupancyRate: {
        type: Number,
        required: true,
    },
    // Number of active tokens (students waiting or being served)
    activeTokenCount: {
        type: Number,
        default: 0,
    },
    // Average waiting time in minutes
    avgWaitTime: {
        type: Number,
        default: 0,
    },
    // crowd level categories (low, medium, high)
    crowdLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
    },
}, {
    timestamps: true,
});

// Indexes for fast lookup by slot, time, or crowd level
crowdDataSchema.index({ slotId: 1, timestamp: -1 });
crowdDataSchema.index({ timestamp: -1 });
crowdDataSchema.index({ crowdLevel: 1 });

// Automatically remove old data after 90 days to save space
crowdDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('CrowdData', crowdDataSchema);
