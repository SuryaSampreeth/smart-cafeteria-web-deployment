require('dotenv').config();
const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const connectDB = require('../config/db');

const updateSlotCapacity = async () => {
    try {
        await connectDB();

        const result = await Slot.updateMany({}, { $set: { capacity: 10 } });
        console.log(`Successfully updated capacity for ${result.modifiedCount} slots.`);

        process.exit(0);
    } catch (error) {
        console.error('Error updating slot capacity:', error);
        process.exit(1);
    }
};

updateSlotCapacity();
