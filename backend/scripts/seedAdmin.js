require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const SlotTemplate = require('../models/SlotTemplate');
const MenuItem = require('../models/MenuItem');
const Menu = require('../models/Menu');
const connectDB = require('../config/db');

/*
 * This script seeds the database with initial data.
 * It creates an admin user, time slots, menu items, and assigns menus to slots.
 */
const seedData = async () => {
    try {
        await connectDB();

        // 1. Create default admin user if it doesn't exist
        const adminExists = await User.findOne({ email: 'chsairithivik@gmail.com' });

        if (!adminExists) {
            await User.create({
                name: 'Admin',
                email: 'chsairithivik@gmail.com',
                password: 'abcdefgh',
                role: 'admin',
            });
            console.log(' Admin user created');
        } else {
            console.log('  Admin user already exists');
        }

        // 2. Create time slots (Breakfast, Lunch, Snacks, Dinner)
        const slotsData = [
            { name: 'Breakfast', startTime: '08:00', endTime: '12:00', capacity: 10 },
            { name: 'Lunch', startTime: '12:00', endTime: '18:00', capacity: 10 },
            { name: 'Snacks', startTime: '18:00', endTime: '19:00', capacity: 10 },
            { name: 'Dinner', startTime: '19:00', endTime: '22:00', capacity: 10 },
        ];

        for (const slotData of slotsData) {
            const slotExists = await SlotTemplate.findOne({ name: slotData.name });
            if (!slotExists) {
                await SlotTemplate.create(slotData);
                console.log(` ${slotData.name} slot created`);
            } else {
                console.log(`  ${slotData.name} slot already exists`);
            }
        }

        // 3. Create sample menu items
        const menuItemsData = [
            // Breakfast items
            { name: 'Idli', description: 'Steamed rice cakes', category: 'veg', price: 30, imageUrl: 'https://via.placeholder.com/150?text=Idli' },
            { name: 'Dosa', description: 'Crispy rice crepe', category: 'veg', price: 40, imageUrl: 'https://via.placeholder.com/150?text=Dosa' },
            { name: 'Poha', description: 'Flattened rice', category: 'veg', price: 25, imageUrl: 'https://via.placeholder.com/150?text=Poha' },
            { name: 'Tea', description: 'Hot tea', category: 'beverage', price: 10, imageUrl: 'https://via.placeholder.com/150?text=Tea' },
            { name: 'Coffee', description: 'Hot coffee', category: 'beverage', price: 15, imageUrl: 'https://via.placeholder.com/150?text=Coffee' },

            // Lunch items
            { name: 'Rice', description: 'Steamed rice', category: 'veg', price: 20, imageUrl: 'https://via.placeholder.com/150?text=Rice' },
            { name: 'Dal', description: 'Lentil curry', category: 'veg', price: 30, imageUrl: 'https://via.placeholder.com/150?text=Dal' },
            { name: 'Roti', description: 'Indian bread', category: 'veg', price: 5, imageUrl: 'https://via.placeholder.com/150?text=Roti' },
            { name: 'Chicken Curry', description: 'Spicy chicken curry', category: 'non-veg', price: 80, imageUrl: 'https://via.placeholder.com/150?text=Chicken' },
            { name: 'Paneer Curry', description: 'Cottage cheese curry', category: 'veg', price: 60, imageUrl: 'https://via.placeholder.com/150?text=Paneer' },

            // Snacks items
            { name: 'Samosa', description: 'Fried pastry', category: 'veg', price: 15, imageUrl: 'https://via.placeholder.com/150?text=Samosa' },
            { name: 'Pakora', description: 'Fried fritters', category: 'veg', price: 20, imageUrl: 'https://via.placeholder.com/150?text=Pakora' },
            { name: 'Sandwich', description: 'Veg sandwich', category: 'veg', price: 35, imageUrl: 'https://via.placeholder.com/150?text=Sandwich' },

            // Dinner items (similar to lunch)
            { name: 'Biryani', description: 'Fragrant rice dish', category: 'non-veg', price: 100, imageUrl: 'https://via.placeholder.com/150?text=Biryani' },
            { name: 'Veg Biryani', description: 'Vegetable biryani', category: 'veg', price: 70, imageUrl: 'https://via.placeholder.com/150?text=VegBiryani' },

            // Desserts
            { name: 'Ice Cream', description: 'Vanilla ice cream', category: 'dessert', price: 25, imageUrl: 'https://via.placeholder.com/150?text=IceCream' },
            { name: 'Gulab Jamun', description: 'Sweet dumplings', category: 'dessert', price: 20, imageUrl: 'https://via.placeholder.com/150?text=GulabJamun' },
        ];

        const createdItems = [];
        for (const itemData of menuItemsData) {
            const itemExists = await MenuItem.findOne({ name: itemData.name });
            if (!itemExists) {
                const item = await MenuItem.create(itemData);
                createdItems.push(item);
                console.log(`${itemData.name} menu item created`);
            } else {
                createdItems.push(itemExists);
                console.log(`${itemData.name} menu item already exists`);
            }
        }

        // 4. Assign menu items to each slot template
        const templates = await SlotTemplate.find({});

        // Breakfast menu
        const breakfastSlot = templates.find(s => s.name === 'Breakfast');
        if (breakfastSlot) {
            const breakfastItems = createdItems.filter(item =>
                ['Idli', 'Dosa', 'Poha', 'Tea', 'Coffee'].includes(item.name)
            );
            const breakfastMenu = await Menu.findOne({ slotTemplateId: breakfastSlot._id });
            if (!breakfastMenu) {
                await Menu.create({
                    slotTemplateId: breakfastSlot._id,
                    menuItems: breakfastItems.map(item => item._id),
                });
                console.log('Breakfast menu assigned');
            }
        }

        // Lunch menu
        const lunchSlot = templates.find(s => s.name === 'Lunch');
        if (lunchSlot) {
            const lunchItems = createdItems.filter(item =>
                ['Rice', 'Dal', 'Roti', 'Chicken Curry', 'Paneer Curry', 'Ice Cream'].includes(item.name)
            );
            const lunchMenu = await Menu.findOne({ slotTemplateId: lunchSlot._id });
            if (!lunchMenu) {
                await Menu.create({
                    slotTemplateId: lunchSlot._id,
                    menuItems: lunchItems.map(item => item._id),
                });
                console.log('Lunch menu assigned');
            }
        }

        // Snacks menu
        const snacksSlot = templates.find(s => s.name === 'Snacks');
        if (snacksSlot) {
            const snacksItems = createdItems.filter(item =>
                ['Samosa', 'Pakora', 'Sandwich', 'Tea', 'Coffee'].includes(item.name)
            );
            const snacksMenu = await Menu.findOne({ slotTemplateId: snacksSlot._id });
            if (!snacksMenu) {
                await Menu.create({
                    slotTemplateId: snacksSlot._id,
                    menuItems: snacksItems.map(item => item._id),
                });
                console.log('Snacks menu assigned');
            }
        }

        // Dinner menu
        const dinnerSlot = templates.find(s => s.name === 'Dinner');
        if (dinnerSlot) {
            const dinnerItems = createdItems.filter(item =>
                ['Biryani', 'Veg Biryani', 'Roti', 'Dal', 'Gulab Jamun'].includes(item.name)
            );
            const dinnerMenu = await Menu.findOne({ slotTemplateId: dinnerSlot._id });
            if (!dinnerMenu) {
                await Menu.create({
                    slotTemplateId: dinnerSlot._id,
                    menuItems: dinnerItems.map(item => item._id),
                });
                console.log('Dinner menu assigned');
            }
        }

        console.log('\nDatabase seeded successfully!');
        console.log('\nAdmin credentials:');
        console.log('   Email: chsairithivik@gmail.com');
        console.log('   Password: abcdefgh\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
