const mongoose = require('mongoose');

/*
 * This Schema defines the daily instances of time slots for meals.
 * It is generated automatically from SlotTemplates.
 * Examples: Breakfast (7:00-9:00) on 2023-10-25.
 */
const slotSchema = new mongoose.Schema({
    // Reference to the template this slot was created from
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SlotTemplate',
        required: true,
    },
    // The specific date for this slot instance (format: YYYY-MM-DD)
    date: {
        type: String,
        required: true,
    },
    // Name of the meal slot (copied from template for ease of access)
    name: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
    },
    // Starting time of the slot (copied from template)
    startTime: {
        type: String,
        required: true,
    },
    // Ending time of the slot (copied from template)
    endTime: {
        type: String,
        required: true,
    },
    // Maximum number of users allowed in this slot instance
    capacity: {
        type: Number,
        required: true,
        default: 10,
    },
    // Current number of active bookings for this slot instance
    currentBookings: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Ensure we only have one slot instance per template per day
slotSchema.index({ templateId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
