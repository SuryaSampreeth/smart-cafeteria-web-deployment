const CrowdData = require('../models/CrowdData');
const CrowdPrediction = require('../models/CrowdPrediction');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const SlotTemplate = require('../models/SlotTemplate');
const { determineCrowdLevel } = require('./crowdTrackingService');
const { getNowIST } = require('../utils/istTime');

/*
 * This function processes yesterday’s crowd data.
 * It calculates hourly average occupancy and wait time.
 * The processed data is stored for future predictions.
 * Usually runs once a day as a background job.
 */
const aggregateDailyData = async (date = null) => {
    try {
        // Default date is yesterday
        const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to Yesterday
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const targetDateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
        const slots = await Slot.find({ date: targetDateString });
        const predictions = [];

        for (const slot of slots) {
            // Fetch all crowd snapshots for this slot on the selected day
            const snapshots = await CrowdData.find({
                slotId: slot._id,
                timestamp: { $gte: startOfDay, $lte: endOfDay },
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

                    // Track maximum occupancy
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

            // Check if prediction already exists for this slot template and date
            const existing = await CrowdPrediction.findOne({
                slotTemplateId: slot.templateId,
                date: startOfDay,
            });

            if (existing) {
                existing.hourlyData = hourlyData;
                existing.peakHours = peakHours;
                existing.averageOccupancy = averageOccupancy;
                existing.maxOccupancy = maxOccupancy;
                existing.totalSamples = snapshots.length;
                await existing.save();
                predictions.push(existing);
            } else {
                const prediction = await CrowdPrediction.create({
                    slotTemplateId: slot.templateId,
                    date: startOfDay,
                    dayOfWeek: startOfDay.getDay(),
                    hourlyData,
                    peakHours,
                    averageOccupancy,
                    maxOccupancy,
                    totalSamples: snapshots.length,
                });
                predictions.push(prediction);
            }
        }

        console.log(`Aggregated daily data for ${predictions.length} slots on ${startOfDay.toISOString()}`);
        return predictions;
    } catch (error) {
        console.error('Error aggregating daily data:', error);
        throw error;
    }
};

/*
 * This function returns historical crowd data.
 * Used for charts, analysis, and reports.
 * Can be filtered by slot and date range.
 */
const getHistoricalPatterns = async ({ slotId = null, startDate, endDate }) => {
    try {
        const query = {};

        if (slotId) {
            const slot = await Slot.findById(slotId);
            if (slot) {
                query.slotTemplateId = slot.templateId;
            }
        }
        //apply date filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const patterns = await CrowdPrediction.find(query)
            .populate('slotTemplateId', 'name startTime endTime')
            .sort({ date: -1 })
            .limit(30); // Return max 30 days of history

        return patterns
            .filter(pattern => pattern.slotTemplateId) // Filter out patterns with deleted slots
            .map(pattern => ({
                slotId: pattern.slotTemplateId._id,
                slotName: pattern.slotTemplateId.name,
                date: pattern.date,
                dayOfWeek: pattern.dayOfWeek,
                hourlyData: pattern.hourlyData,
                peakHours: pattern.peakHours,
                averageOccupancy: pattern.averageOccupancy,
                maxOccupancy: pattern.maxOccupancy,
            }));
    } catch (error) {
        console.error('Error getting historical patterns:', error);
        throw error;
    }
};

/*
 * This function finds commonly busy hours for a slot.
 * It analyzes crowd data from the past few days.
 */
const getPeakHours = async (slotId, days = 7) => {
    try {
        const slot = await Slot.findById(slotId);
        if (!slot) {
            return { slotId, peakHours: [], message: 'Slot not found' };
        }

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const predictions = await CrowdPrediction.find({
            slotTemplateId: slot.templateId,
            date: { $gte: startDate },
        }).sort({ date: -1 });

        if (predictions.length === 0) {
            return {
                slotId,
                peakHours: [],
                message: 'Insufficient historical data',
            };
        }

        // Count how often each hour appears as peak
        const hourFrequency = {};
        for (let hour = 0; hour < 24; hour++) {
            hourFrequency[hour] = 0;
        }

        predictions.forEach(prediction => {
            prediction.peakHours.forEach(hour => {
                hourFrequency[hour]++;
            });
        });

        // Consider an hour as peak if it appears in more than 50% of records
        const threshold = predictions.length * 0.5;
        const peakHours = Object.entries(hourFrequency)
            .filter(([hour, count]) => count >= threshold)
            .map(([hour, count]) => ({
                hour: parseInt(hour),
                frequency: count,
                percentage: Math.round((count / predictions.length) * 100),
            }))
            .sort((a, b) => b.frequency - a.frequency);

        return {
            slotId,
            analyzedDays: predictions.length,
            peakHours,
            averageOccupancy: Math.round(
                predictions.reduce((sum, p) => sum + p.averageOccupancy, 0) / predictions.length
            ),
        };
    } catch (error) {
        console.error('Error getting peak hours:', error);
        throw error;
    }
};

/*
 * This function predicts the waiting time for a booking.
 * It uses historical average wait time for the current hour.
 */
const predictWaitTime = async (slotId, queuePosition) => {
    try {
        const slot = await Slot.findById(slotId);
        if (!slot) throw new Error('Slot not found');

        // Find historical data for the current hour over the last 7 days
        const currentHour = new Date().getHours();
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const predictions = await CrowdPrediction.find({
            slotTemplateId: slot.templateId,
            date: { $gte: last7Days },
        });

        let avgWaitTimePerToken = 5; // Fallback default: 5 mins

        if (predictions.length > 0) {
            const hourlyWaitTimes = [];

            predictions.forEach(prediction => {
                const hourData = prediction.hourlyData.find(h => h.hour === currentHour);
                if (hourData) {
                    hourlyWaitTimes.push(hourData.avgWaitTime);
                }
            });

            // Average the wait times found for this hour
            if (hourlyWaitTimes.length > 0) {
                avgWaitTimePerToken = Math.round(
                    hourlyWaitTimes.reduce((a, b) => a + b, 0) / hourlyWaitTimes.length
                );
            }
        }

        // Compute total wait time
        const predictedWaitTime = Math.max(1, queuePosition * avgWaitTimePerToken);

        return {
            queuePosition,
            predictedWaitTime,
            avgWaitTimePerToken,
            confidence: predictions.length > 0 ? 'high' : 'low',
        };
    } catch (error) {
        console.error('Error predicting wait time:', error);
        return {
            queuePosition,
            predictedWaitTime: queuePosition * 5, // Fallback calculation
            avgWaitTimePerToken: 5,
            confidence: 'low',
        };
    }
};

module.exports = {
    aggregateDailyData,
    getHistoricalPatterns,
    getPeakHours,
    predictWaitTime,
};
