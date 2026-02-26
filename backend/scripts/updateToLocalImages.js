require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const connectDB = require('../config/db');

/*
 * This script updates menu items to use local image paths instead of external URLs.
 * It uses a predefined mapping of item names to filenames.
 * Useful for development or when hosting images statically.
 */

// Map menu item names to local image filenames
const localImagePaths = {
    'Idli': 'idli.jpg',
    'Dosa': 'dosa.jpg',
    'Dal': 'dal.jpg',
    'Rice': 'rice.jpg',
    'Roti': 'roti.jpg',
    'Poha': 'poha.jpg',
    'Samosa': 'samosa.jpg',
    'Pakora': 'pakora.jpg',
    'Sandwich': 'sandwich.jpg',
    'Pancake': 'pancake.jpg',
    'Paneer Curry': 'paneer_curry.jpg',
    'Veg Biryani': 'veg_biryani.jpg',
    'Biryani': 'biryani.jpg',
    'Chicken Curry': 'chicken_curry.jpg',
    'Tea': 'tea.jpg',
    'Coffee': 'coffee.jpg',
    'Gulab Jamun': 'gulab_jamun.jpg',
    'Ice Cream': 'ice_cream.jpg',
};

const updateToLocalImages = async () => {
    try {
        await connectDB();
        console.log('\n UPDATING TO LOCAL IMAGES\n');
        console.log('═'.repeat(70));

        const menuItems = await MenuItem.find().sort({ name: 1 });
        let updated = 0;

        for (const item of menuItems) {
            const imageFileName = localImagePaths[item.name];

            if (imageFileName) {
                // Store just the filename - frontend will handle the path
                item.imageUrl = imageFileName;
                await item.save();
                console.log(`${item.name.padEnd(20)} → ${imageFileName}`);
                updated++;
            } else {
                console.log(`${item.name.padEnd(20)} → NO MAPPING FOUND!`);
            }
        }

        console.log('\n' + '═'.repeat(70));
        console.log(`\n SUMMARY:`);
        console.log(`    Updated: ${updated}/${menuItems.length} items`);

        if (updated === menuItems.length) {
            console.log(`\n SUCCESS! All items now use local images!\n`);
        }

        console.log('═'.repeat(70));
        process.exit(0);
    } catch (error) {
        console.error(' Error:', error.message);
        process.exit(1);
    }
};

updateToLocalImages();
