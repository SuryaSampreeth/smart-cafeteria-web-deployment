require('dotenv').config();
const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const connectDB = require('../config/db');

const checkSlots = async () => {
    await connectDB();
    const slots = await Slot.find({}).sort({ name: 1 });
    console.log('\n✅ Current Slot Timings:\n');
    slots.forEach(s => {
        console.log(`  ${s.name.padEnd(12)} ${s.startTime} - ${s.endTime}`);
    });
    console.log('');
    process.exit(0);
};

checkSlots();
