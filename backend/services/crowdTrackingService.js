const CrowdData = require('../models/CrowdData');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { getOrCreateTodaySlots } = require('../utils/slotManager');

// Threshold values used to classify crowd levels (in percentage)
const CROWD_THRESHOLDS = {
    LOW: 40,      // Below 40%: Quiet (Green)
    MEDIUM: 70,   // 40-70%: Moderate (Yellow)
    HIGH: 100,    // Above 70%: Busy (Red)
};

/*
 * This helper function converts occupancy percentage
 * into a crowd level (low, medium, or high).
 * Used for UI indicators like green, yellow, and red.
 */
const determineCrowdLevel = (occupancyRate) => {
    if (occupancyRate < CROWD_THRESHOLDS.LOW) return 'low';
    if (occupancyRate < CROWD_THRESHOLDS.MEDIUM) return 'medium';
    return 'high'; // Includes anything >= 70%
};

/*
 * This function calculates the average waiting time
 * based on recently served bookings (last 1 hour).
 */
const calculateAvgWaitTime = async (slotId) => {
    try {
        // Fetch bookings served in the last 60 minutes
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const servedBookings = await Booking.find({
            slotId,
            status: 'served',
            servedAt: { $gte: oneHourAgo },
        });

        if (servedBookings.length === 0) {
            return 5; // Default fallback: 5 minutes per token if no recent data
        }

        // Compute average duration from 'bookedAt' to 'servedAt'
        const totalTime = servedBookings.reduce((sum, booking) => {
            const waitTime = (booking.servedAt - booking.bookedAt) / 1000 / 60; // Convert ms to minutes
            return sum + waitTime;
        }, 0);

        return Math.round(totalTime / servedBookings.length);
    } catch (error) {
        console.error('Error calculating avg wait time:', error);
        return 5; // Default value on error
    }
};

/*
 * This function captures the current crowd status for all active slots.
 * The data is stored periodically to build crowd history.
 */
const captureOccupancySnapshot = async () => {
    try {
        const todaySlots = await getOrCreateTodaySlots();
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const activeSlots = todaySlots.filter(slot => currentTime < slot.endTime);
        const snapshots = [];

        for (const slot of activeSlots) {
            try {
                // Count how many bookings are currently active
                const activeBookings = await Booking.countDocuments({
                    slotId: slot._id,
                    status: { $in: ['pending', 'serving'] },
                });

                // Calculate occupancy percentage
                const occupancyRate = slot.capacity > 0
                    ? Math.round((activeBookings / slot.capacity) * 100)
                    : 0;

                const crowdLevel = determineCrowdLevel(occupancyRate);
                const avgWaitTime = await calculateAvgWaitTime(slot._id);

                // Save snapshot to database
                const snapshot = await CrowdData.create({
                    slotId: slot._id,
                    activeBookings,
                    totalCapacity: slot.capacity,
                    occupancyRate,
                    activeTokenCount: activeBookings,
                    avgWaitTime,
                    crowdLevel,
                });

                snapshots.push(snapshot);
            } catch (slotError) {
                console.error(`Error capturing snapshot for slot ${slot.name}:`, slotError.message);
            }
        }

        if (snapshots.length > 0) {
            console.log(`✅ Captured ${snapshots.length} occupancy snapshots at ${new Date().toLocaleTimeString()}`);
        }
        return snapshots;
    } catch (error) {
        console.error('⚠️  Error in crowd tracking (will retry):', error.message);
        return [];
    }
};

/*
 * This function returns the latest crowd status.
 * It can return data for a single slot or all slots.
 */
const getCurrentCrowdLevel = async (slotId = null, forceCalculate = false) => {
    try {
        if (slotId) {
            // Get latest snapshot for the given slot
            const latestSnapshot = await CrowdData.findOne({ slotId })
                .sort({ timestamp: -1 })
                .populate('slotId', 'name startTime endTime');

            if (!latestSnapshot || forceCalculate) {
                // If no snapshot exists OR forced to calculate fresh, calculate values immediately
                const slot = await Slot.findById(slotId);
                if (!slot) throw new Error('Slot not found');

                const activeBookings = await Booking.countDocuments({
                    slotId,
                    status: { $in: ['pending', 'serving'] },
                });

                const occupancyRate = slot.capacity > 0
                    ? Math.round((activeBookings / slot.capacity) * 100)
                    : 0;

                let finalActiveBookings = activeBookings;
                let finalOccupancyRate = occupancyRate;
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                // If a specific slot is requested but it's not currently active, zero its stats.
                if (currentTime > slot.endTime) {
                    finalActiveBookings = 0;
                    finalOccupancyRate = 0;
                }

                return {
                    slotId: slot._id,
                    slotName: slot.name,
                    activeBookings: finalActiveBookings,
                    totalCapacity: slot.capacity,
                    occupancyRate: finalOccupancyRate,
                    crowdLevel: determineCrowdLevel(finalOccupancyRate),
                    avgWaitTime: await calculateAvgWaitTime(slotId),
                    timestamp: now,
                };
            }

            let finalActiveBookings = latestSnapshot.activeBookings;
            let finalOccupancyRate = latestSnapshot.occupancyRate;
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            if (currentTime > latestSnapshot.slotId.endTime) {
                finalActiveBookings = 0;
                finalOccupancyRate = 0;
            }

            return {
                slotId: latestSnapshot.slotId._id,
                slotName: latestSnapshot.slotId.name,
                activeBookings: finalActiveBookings,
                totalCapacity: latestSnapshot.totalCapacity,
                occupancyRate: finalOccupancyRate,
                crowdLevel: determineCrowdLevel(finalOccupancyRate),
                avgWaitTime: latestSnapshot.avgWaitTime,
                timestamp: latestSnapshot.timestamp,
            };
        } else {
            // Get latest status for ALL today's slots
            const slots = await getOrCreateTodaySlots();
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const crowdLevels = [];

            for (const slot of slots) {
                let snapshotData = null;

                if (!forceCalculate) {
                    snapshotData = await CrowdData.findOne({ slotId: slot._id })
                        .sort({ timestamp: -1 });
                }

                if (!snapshotData) {
                    // Create stats on the fly if needed or forced
                    const activeBookings = await Booking.countDocuments({
                        slotId: slot._id,
                        status: { $in: ['pending', 'serving'] },
                    });

                    const occupancyRate = slot.capacity > 0
                        ? Math.round((activeBookings / slot.capacity) * 100)
                        : 0;

                    const isActive = currentTime <= slot.endTime;

                    crowdLevels.push({
                        slotId: slot._id,
                        slotName: slot.name,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        activeBookings: isActive ? activeBookings : 0,
                        totalCapacity: slot.capacity,
                        occupancyRate: isActive ? occupancyRate : 0,
                        crowdLevel: determineCrowdLevel(isActive ? occupancyRate : 0),
                        avgWaitTime: isActive ? await calculateAvgWaitTime(slot._id) : 0,
                        timestamp: new Date(),
                        isActive: isActive, // Dynamically computed strictly
                    });
                } else {
                    const isActive = currentTime <= slot.endTime;

                    crowdLevels.push({
                        slotId: slot._id,
                        slotName: slot.name,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        activeBookings: isActive ? snapshotData.activeBookings : 0,
                        totalCapacity: snapshotData.totalCapacity,
                        occupancyRate: isActive ? snapshotData.occupancyRate : 0,
                        crowdLevel: determineCrowdLevel(isActive ? snapshotData.occupancyRate : 0),
                        avgWaitTime: isActive ? snapshotData.avgWaitTime : 0,
                        timestamp: snapshotData.timestamp,
                        isActive: isActive, // Dynamically computed strictly
                    });
                }
            }

            return crowdLevels;
        }
    } catch (error) {
        console.error('Error getting current crowd level:', error);
        throw error;
    }
};

/*
 * Starts periodic crowd tracking.
 * This runs automatically at fixed intervals once the server starts.
 */
let trackingInterval = null;
const startTracking = (intervalMinutes = 5) => {
    if (trackingInterval) {
        console.log('Tracking already started');
        return;
    }

    console.log(`Starting crowd tracking with ${intervalMinutes} minute intervals`);

    // Capture initial snapshot immediately
    captureOccupancySnapshot();

    // Set up periodic capture
    trackingInterval = setInterval(() => {
        captureOccupancySnapshot();
    }, intervalMinutes * 60 * 1000);
};

/*
 * Stops the background tracking interval.
 */
const stopTracking = () => {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
        console.log('Crowd tracking stopped');
    }
};

module.exports = {
    captureOccupancySnapshot,
    getCurrentCrowdLevel,
    startTracking,
    stopTracking,
    determineCrowdLevel,
    CROWD_THRESHOLDS,
};
