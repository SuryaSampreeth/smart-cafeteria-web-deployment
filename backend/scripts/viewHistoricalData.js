require('dotenv').config();
const mongoose = require('mongoose');
const CrowdPrediction = require('../models/CrowdPrediction');
const Slot = require('../models/Slot');
const connectDB = require('../config/db');

/*
 * This script displays the stored historical crowd data.
 * It is useful for verifying that the prediction engine has sufficient data to work with.
 * It shows peak hours, average occupancy, and hourly breakdowns for each slot.
 */
const viewHistoricalData = async () => {
    try {
        await connectDB();
        console.log('\n HISTORICAL CROWD PREDICTION DATA\n');
        console.log('═'.repeat(70));

        // Fetch all prediction records, sorted by date
        const predictions = await CrowdPrediction.find()
            .populate('slotId', 'name')
            .sort({ date: -1, 'slotId.name': 1 });

        console.log(`\n Total Predictions: ${predictions.length}\n`);

        // Group data by slot name for easier reading
        const slotGroups = {};
        predictions.forEach(pred => {
            const slotName = pred.slotId.name;
            if (!slotGroups[slotName]) {
                slotGroups[slotName] = [];
            }
            slotGroups[slotName].push(pred);
        });

        // Display detailed data for each slot
        Object.keys(slotGroups).sort().forEach(slotName => {
            console.log('\n' + '─'.repeat(70));
            console.log(`\n ${slotName.toUpperCase()}`);
            console.log('─'.repeat(70));

            slotGroups[slotName].forEach(pred => {
                const dateStr = pred.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });

                console.log(`\n  Date: ${dateStr}`);
                console.log(`  Peak Hours: ${pred.peakHours.map(h => {
                    const hour12 = h > 12 ? h - 12 : h;
                    const period = h >= 12 ? 'PM' : 'AM';
                    return `${hour12}:00 ${period}`;
                }).join(', ')}`);
                console.log(`  Avg Occupancy: ${pred.averageOccupancy}%`);
                console.log(`  Max Occupancy: ${pred.maxOccupancy}%`);

                console.log(`\n  Hourly Breakdown:`);
                pred.hourlyData.forEach(hourData => {
                    const hour12 = hourData.hour > 12 ? hourData.hour - 12 : hourData.hour;
                    const period = hourData.hour >= 12 ? 'PM' : 'AM';
                    const isPeak = pred.peakHours.includes(hourData.hour);
                    const peakLabel = isPeak ? ' 🔥 PEAK' : '';

                    let levelIcon = '🟢';
                    if (hourData.crowdLevel === 'high') levelIcon = '🔴';
                    else if (hourData.crowdLevel === 'medium') levelIcon = '🟡';

                    console.log(
                        `    ${hour12}:00 ${period}: ${levelIcon} ${hourData.avgOccupancy}% occupancy, ` +
                        `${hourData.avgWaitTime} mins/token${peakLabel}`
                    );
                });
            });
        });

        console.log('\n' + '═'.repeat(70));
        console.log('\n📈 SUMMARY BY SLOT\n');

        // Show a high-level summary
        Object.keys(slotGroups).sort().forEach(slotName => {
            const predictions = slotGroups[slotName];
            const allPeakHours = new Set();
            predictions.forEach(p => p.peakHours.forEach(h => allPeakHours.add(h)));

            console.log(`  ${slotName}:`);
            console.log(`    - ${predictions.length} days of data`);
            console.log(`    - Peak Hours: ${Array.from(allPeakHours).map(h => {
                const hour12 = h > 12 ? h - 12 : h;
                const period = h >= 12 ? 'PM' : 'AM';
                return `${hour12}:00 ${period}`;
            }).join(', ')}`);

            const avgOccupancy = Math.round(
                predictions.reduce((sum, p) => sum + p.averageOccupancy, 0) / predictions.length
            );
            console.log(`    - Average Occupancy: ${avgOccupancy}%\n`);
        });

        console.log('═'.repeat(70));
        console.log('\n This data is used for smart wait time predictions!\n');

        process.exit(0);
    } catch (error) {
        console.error(' Error viewing data:', error);
        process.exit(1);
    }
};

viewHistoricalData();
