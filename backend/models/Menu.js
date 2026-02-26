const mongoose = require('mongoose');

/*
 * This schema is used to map menu items to a specific time slot template.
 * It defines which food items are available for each meal.
 */
const menuSchema = new mongoose.Schema({
    // Reference to the slot template (for example: breakfast or lunch)
    slotTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SlotTemplate',
        required: true,
    },
    // List of menu items available in this slot
    menuItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
    }],
    // Date on which this menu was assigned
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index added to quickly fetch menu by slot template
menuSchema.index({ slotTemplateId: 1, date: 1 });

module.exports = mongoose.model('Menu', menuSchema);
