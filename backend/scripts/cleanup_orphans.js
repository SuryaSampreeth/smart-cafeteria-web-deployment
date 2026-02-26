const mongoose = require('mongoose');
require('dotenv').config();
const AlertLog = require('../models/AlertLog');
const Slot = require('../models/Slot');
const connectDB = require('../config/db');

const cleanupOrphans = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const result = await AlertLog.deleteMany({ slotId: null }); // This won't work because slotId is ref, populate makes it null in resulting object, but in DB it's an ObjectId that doesn't exist in Slot collection.

        // Correct approach: Find alerts where slotId does not exist in Slot collection
        // Since we can't easily do a join delete in Mongo, we fetch and iterate.
        // Or we rely on populate result.

        const alerts = await AlertLog.find({}).populate('slotId');
        const idsToDelete = [];

        alerts.forEach(alert => {
            if (!alert.slotId) {
                idsToDelete.push(alert._id);
            }
        });

        if (idsToDelete.length > 0) {
            const deleteResult = await AlertLog.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted ${deleteResult.deletedCount} orphan alerts.`);
        } else {
            console.log('No orphan alerts found to delete.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanupOrphans();
