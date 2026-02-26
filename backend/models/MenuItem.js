const mongoose = require('mongoose');

/*
 * This schema represents individual food items in the cafeteria.
 * It stores basic details like name, price, category, and availability.
 */
const menuItemSchema = new mongoose.Schema({
    // Name of the food item
    name: {
        type: String,
        required: true,
        trim: true,
    },
    // Short description of the food item
    description: {
        type: String,
        trim: true,
    },
    // Food category (veg, non-veg, beverage, dessert)
    category: {
        type: String,
        enum: ['veg', 'non-veg', 'beverage', 'dessert'],
        required: true,
    },
    // Price of the food item
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    // URL of the food item's image
    imageUrl: {
        type: String,
        default: 'https://via.placeholder.com/150',
    },
    // Availability status of the food item
    isAvailable: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
