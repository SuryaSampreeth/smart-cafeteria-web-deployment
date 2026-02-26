require('dotenv').config();
const mongoose = require('mongoose');
const CrowdData = require('../models/CrowdData');
const CrowdPrediction = require('../models/CrowdPrediction');
const Slot = require('../models/Slot');
const connectDB = require('../config/db');
const { determineCrowdLevel } = require('../services/crowdTrackingService');

/**
 * This script seeds historical crowd data for the last 7 days.
 * It creates CrowdData snapshots and CrowdPrediction aggregates
 * to populate the analytics dashboard with realistic data.
 */

const seedHistoricalCrowdData = async () => {
    try {
        await connectDB();

        console.log('🚀 Starting historical crowd data seeding...\\n');

        // Get all active slots
        const slots = await Slot.find({ isActive: true });
        console.log(`Found ${slots.length} active slots\\n`);

        if (slots.length === 0) {
            console.log('❌ No active slots found. Please run seed script first.');
            process.exit(1);
        }

        // Clear existing crowd data to prevent duplicates
        await CrowdData.deleteMany({});
        await CrowdPrediction.deleteMany({});
        console.log('✅ Cleared existing crowd data\\n');

        const DAYS_TO_SEED = 7;
        const SNAPSHOTS_PER_DAY = 12; // One snapshot every 2 hours
        let totalSnapshots = 0;
        let totalPredictions = 0;

        // Loop through each day (from 7 days ago to yesterday)
        for (let dayOffset = DAYS_TO_SEED; dayOffset >= 1; dayOffset--) {
            const targetDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            console.log(`📅 Seeding data for ${startOfDay.toDateString()}...`);

            // Loop through each slot
            for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
                const slot = slots[slotIndex];

                // Determine base occupancy pattern for this slot
                // Different slots have different patterns for variety
                let baseOccupancy;
                switch (slotIndex % 4) {
                    case 0:
                        baseOccupancy = 35; // Low traffic slot
                        break;
                    case 1:
                        baseOccupancy = 55; // Medium traffic slot
                        break;
                    case 2:
                        baseOccupancy = 75; // High traffic slot
                        break;
                    case 3:
                        baseOccupancy = 90; // Critical/overcrowded slot
                        break;
                }

                // Create snapshots throughout the day
                for (let hour = 8; hour < 20; hour++) {
                    // Simulate peak hours (12-14 for lunch, 18-20 for dinner)
                    let hourlyMultiplier = 1.0;
                    if (hour >= 12 && hour <= 14) {
                        hourlyMultiplier = 1.3; // 30% increase during lunch
                    } else if (hour >= 18 && hour <= 20) {
                        hourlyMultiplier = 1.4; // 40% increase during dinner
                    } else if (hour < 10 || hour > 19) {
                        hourlyMultiplier = 0.7; // 30% decrease during off-peak
                    }

                    // Add some randomness (±15%)
                    const randomFactor = 0.85 + Math.random() * 0.3;
                    const occupancyRate = Math.min(100, Math.round(baseOccupancy * hourlyMultiplier * randomFactor));

                    const activeBookings = Math.round((slot.capacity * occupancyRate) / 100);
                    const avgWaitTime = Math.max(5, Math.round(activeBookings * 0.5)); // Rough estimate

                    const timestamp = new Date(startOfDay);
                    timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

                    await CrowdData.create({
                        slotId: slot._id,
                        timestamp,
                        activeBookings,
                        totalCapacity: slot.capacity,
                        occupancyRate,
                        activeTokenCount: activeBookings,
                        avgWaitTime,
                        crowdLevel: determineCrowdLevel(occupancyRate),
                    });

                    totalSnapshots++;
                }
            }

            // Now aggregate the day's data into CrowdPrediction
            for (const slot of slots) {
                const snapshots = await CrowdData.find({
                    slotId: slot._id,
                    timestamp: {
                        $gte: startOfDay,
                        $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
                    },
                }).sort({ timestamp: 1 });

                if (snapshots.length === 0) continue;

                // Initialize 24-hour bins
                const hourlyMap = {};
                for (let hour = 0; hour < 24; hour++) {
                    hourlyMap[hour] = {
                        hour,
                        occupancyRates: [],
                        waitTimes: [],
                    };
                }

                // Distribute snapshots into hourly bins
                snapshots.forEach(snapshot => {
                    const hour = new Date(snapshot.timestamp).getHours();
                    hourlyMap[hour].occupancyRates.push(snapshot.occupancyRate);
                    hourlyMap[hour].waitTimes.push(snapshot.avgWaitTime);
                });

                // Calculate averages for each hour
                const hourlyData = [];
                const peakHours = [];
                let maxOccupancy = 0;
                let totalOccupancy = 0;
                let hourCount = 0;

                for (let hour = 0; hour < 24; hour++) {
                    const data = hourlyMap[hour];
                    if (data.occupancyRates.length > 0) {
                        const avgOccupancy = Math.round(
                            data.occupancyRates.reduce((a, b) => a + b, 0) / data.occupancyRates.length
                        );
                        const avgWaitTime = Math.round(
                            data.waitTimes.reduce((a, b) => a + b, 0) / data.waitTimes.length
                        );

                        hourlyData.push({
                            hour,
                            avgOccupancy,
                            avgWaitTime,
                            crowdLevel: determineCrowdLevel(avgOccupancy),
                            sampleCount: data.occupancyRates.length,
                        });

                        totalOccupancy += avgOccupancy;
                        hourCount++;

                        if (avgOccupancy > maxOccupancy) {
                            maxOccupancy = avgOccupancy;
                        }

                        // Mark hour as peak if occupancy is above 60%
                        if (avgOccupancy > 60) {
                            peakHours.push(hour);
                        }
                    }
                }

                const averageOccupancy = hourCount > 0 ? Math.round(totalOccupancy / hourCount) : 0;

                await CrowdPrediction.create({
                    slotId: slot._id,
                    date: startOfDay,
                    dayOfWeek: startOfDay.getDay(),
                    hourlyData,
                    peakHours,
                    averageOccupancy,
                    maxOccupancy,
                    totalSamples: snapshots.length,
                });

                totalPredictions++;
            }

            console.log(`   ✅ Created snapshots and predictions for ${slots.length} slots\\n`);
        }

        console.log('═'.repeat(60));
        console.log(`\\n✨ Successfully seeded historical crowd data!\\n`);
        console.log(`📊 Summary:`);
        console.log(`   • Days seeded: ${DAYS_TO_SEED}`);
        console.log(`   • Total CrowdData snapshots: ${totalSnapshots}`);
        console.log(`   • Total CrowdPrediction records: ${totalPredictions}`);
        console.log(`   • Slots covered: ${slots.length}\\n`);

        console.log('💡 Next Steps:');
        console.log('   1. Open the Admin Crowd Analytics dashboard');
        console.log('   2. You should now see Peak Hours and Occupancy Summary data');
        console.log('   3. Try changing the analysis period (7, 14, 30 days)\\n');

        console.log('═'.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding historical crowd data:', error);
        process.exit(1);
    }
};

seedHistoricalCrowdData();
