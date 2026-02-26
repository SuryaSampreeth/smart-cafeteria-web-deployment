const mongoose = require('mongoose');
require('dotenv').config();
const AlertLog = require('../models/AlertLog');
const Slot = require('../models/Slot');
const CrowdData = require('../models/CrowdData');
const connectDB = require('../config/db');

const checkOrphans = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const alerts = await AlertLog.find({}).populate('slotId');
        let orphanAlerts = 0;
        alerts.forEach(alert => {
            if (!alert.slotId) {
                console.log(`Orphan Alert Found: ID ${alert._id}, Message: ${alert.message}`);
                orphanAlerts++;
            }
        });
        console.log(`Total Orphan Alerts: ${orphanAlerts}`);

        const crowdData = await CrowdData.find({}).populate('slotId').limit(100);
        let orphanCrowdData = 0;
        crowdData.forEach(data => {
            if (!data.slotId) {
                console.log(`Orphan CrowdData Found: ID ${data._id}`);
                orphanCrowdData++;
            }
        });
        console.log(`checked first 100 CrowdData. Total Orphan CrowdData: ${orphanCrowdData}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkOrphans();
