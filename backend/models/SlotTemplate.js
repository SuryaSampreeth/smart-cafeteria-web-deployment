const mongoose = require('mongoose');

/*
 * This Schema defines the templates for time slots for meals.
 * Examples: Breakfast (7:00-9:00), Lunch (12:00-2:00).
 * These are seeded once and never expire.
 */
const slotTemplateSchema = new mongoose.Schema({
    // Name of the meal slot (breakfast, lunch, snacks, dinner)
    name: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
        unique: true, // Only one template per meal type
    },
    // Starting time of the slot (e.g., "07:00")
    startTime: {
        type: String,
        required: true,
    },
    // Ending time of the slot (e.g., "09:00")
    endTime: {
        type: String,
        required: true,
    },
    // Maximum number of users allowed in this slot globally
    capacity: {
        type: Number,
        required: true,
        default: 10,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('SlotTemplate', slotTemplateSchema);
