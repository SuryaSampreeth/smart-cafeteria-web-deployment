require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const connectDB = require('../config/db');

// food image URLs for the menu items
const foodImageUrls = {
    // Veg items
    'Idli': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80',
    'Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80',
    'Dal': 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=400&q=80',
    'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    'Roti': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&q=80',
    'Poha': 'https://images.unsplash.com/photo-1645696329251-f462c38f2925?w=400&q=80',
    'Samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    'Pakora': 'https://images.unsplash.com/photo-1626850192103-1da6e52e7931?w=400&q=80',
    'Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
    'Pancake': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    'Paneer Curry': 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=400&q=80',
    'Veg Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',

    // Non-veg items
    'Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    'Chicken Curry': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80',

    // Beverages
    'Tea': 'https://images.unsplash.com/photo-1597318145328-d7c1f7039a8e?w=400&q=80',
    'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',

    // Desserts
    'Gulab Jamun': 'https://images.unsplash.com/photo-1596181830131-caac9044e825?w=400&q=80',
    'Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
};

const updateAllMenuImages = async () => {
    try {
        await connectDB();
        console.log('\n UPDATING ALL MENU ITEM IMAGES\n');
        console.log('═'.repeat(70));

        const menuItems = await MenuItem.find().sort({ name: 1 });
        console.log(`\nFound ${menuItems.length} menu items\n`);

        let updated = 0;
        let notFound = 0;

        for (const item of menuItems) {
            const imageUrl = foodImageUrls[item.name];

            if (imageUrl) {
                item.imageUrl = imageUrl;
                await item.save();
                console.log(` ${item.name.padEnd(20)} - ${item.category.padEnd(10)} - Image updated`);
                updated++;
            } else {
                console.log(` ${item.name.padEnd(20)} - ${item.category.padEnd(10)} - NO IMAGE FOUND!`);
                notFound++;
            }
        }

        console.log('\n' + '═'.repeat(70));
        console.log(`\n SUMMARY:`);
        console.log(`    Updated: ${updated}/${menuItems.length} items`);
        console.log(`    Missing: ${notFound}/${menuItems.length} items`);

        if (notFound === 0) {
            console.log(`\n SUCCESS! All menu items now have images!\n`);
        } else {
            console.log(`\n  WARNING: ${notFound} items still missing images!\n`);
        }

        console.log('═'.repeat(70));
        console.log('\n COMPLETE LIST:\n');

        const updatedItems = await MenuItem.find().sort({ name: 1 });
        updatedItems.forEach((item, index) => {
            const status = item.imageUrl && !item.imageUrl.includes('placeholder') ? '✅' : '❌';
            console.log(`${(index + 1).toString().padStart(2)}. ${status} ${item.name.padEnd(20)} [${item.category}]`);
        });

        console.log('');
        process.exit(0);
    } catch (error) {
        console.error(' Error:', error);
        process.exit(1);
    }
};

updateAllMenuImages();
