require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const connectDB = require('../config/db');

/*
 * This script fetches and lists all menu items from the database.
 * Useful for verifying what items are currently available.
 */
const listMenuItems = async () => {
    try {
        await connectDB();
        // Fetch all items and sort them alphabetically
        const items = await MenuItem.find().sort({ name: 1 });

        console.log('\n ALL MENU ITEMS:\n');
        items.forEach(i => {
            console.log(`${i.name} - ${i.category}`);
        });
        console.log(`\nTotal: ${items.length} items\n`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listMenuItems();
