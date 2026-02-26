const { getCurrentCrowdLevel } = require('../services/crowdTrackingService');
const {
    getHistoricalPatterns,
    getPeakHours,
    predictWaitTime
} = require('../services/crowdPredictionService');
const {
    getActiveAlerts,
    getAlertHistory,
    resolveAlert,
    performAlertCheck,
} = require('../services/alertService');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const CrowdData = require('../models/CrowdData');
const { getOrCreateTodaySlots } = require('../utils/slotManager');

// ==================== STUDENT ENDPOINTS ====================

/*
 * This function returns the current crowd level for all active slots.
 * It is mainly used by students to see real-time crowd status.
 */
const getCurrentCrowdLevels = async (req, res) => {
    try {
        const crowdLevels = await getCurrentCrowdLevel();

        res.json({
            success: true,
            timestamp: new Date(),
            data: crowdLevels,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
 * This function estimates the waiting time for a specific booking.
 * The estimation is based on the student’s queue position and crowd data.
 */
const getWaitingTimeEstimate = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate('slotId', 'name startTime endTime');

        // Check if the booking exists
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Verify that the booking belongs to the logged in student
        if (booking.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // waiting time is calcualted only for the actice bookings
        if (!['pending', 'serving'].includes(booking.status)) {
            return res.json({
                success: true,
                message: `Booking is ${booking.status}`,
                data: {
                    tokenNumber: booking.tokenNumber,
                    status: booking.status,
                    queuePosition: booking.queuePosition,
                    estimatedWaitTime: 0,
                },
            });
        }

        // Get the wait time prediction
        const prediction = await predictWaitTime(
            booking.slotId._id,
            booking.queuePosition
        );

        res.json({
            success: true,
            data: {
                tokenNumber: booking.tokenNumber,
                slotName: booking.slotId.name,
                queuePosition: prediction.queuePosition,
                estimatedWaitTime: prediction.predictedWaitTime,
                avgWaitTimePerToken: prediction.avgWaitTimePerToken,
                confidence: prediction.confidence,
                status: booking.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
 * This function returns historical crowd data.
 * It helps students understand how crowded a slot usually is.
 */
const getHistoricalCrowdPatterns = async (req, res) => {
    try {
        const { slotId, startDate, endDate } = req.query;

        // If dates are not provided, use last 7 days as default
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const patterns = await getHistoricalPatterns({
            slotId: slotId || null,
            startDate: start,
            endDate: end,
        });

        res.json({
            success: true,
            data: patterns,
            dateRange: {
                start,
                end,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
 * This function finds peak hours for a given slot.
 * Peak hours are identified using past crowd data.
 */
const getSlotPeakHours = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { days } = req.query;

        const peakHours = await getPeakHours(slotId, days ? parseInt(days) : 7);

        res.json({
            success: true,
            data: peakHours,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== STAFF ENDPOINTS ====================

/*
 * This function provides crowd-related dashboard data for staff.
 * It includes current crowd levels and active alerts.
 */
const getStaffCrowdDashboard = async (req, res) => {
    try {
        const crowdLevels = await getCurrentCrowdLevel();

        // fetch all active alerts
        const activeAlerts = await getActiveAlerts();

        // Calculate summary statistics for the dashboard
        const totalActive = crowdLevels.reduce((sum, level) => sum + level.activeBookings, 0);
        const highCrowdSlots = crowdLevels.filter(level => level.crowdLevel === 'high');
        const avgOccupancy = Math.round(
            crowdLevels.reduce((sum, level) => sum + level.occupancyRate, 0) / crowdLevels.length
        );

        res.json({
            success: true,
            timestamp: new Date(),
            summary: {
                totalActiveBookings: totalActive,
                highCrowdSlotCount: highCrowdSlots.length,
                averageOccupancy: avgOccupancy,
                activeAlertCount: activeAlerts.length,
            },
            slots: crowdLevels,
            activeAlerts: activeAlerts
                .filter(alert => alert.slotId) // Filter out orphan alerts
                .map(alert => ({
                    _id: alert._id,
                    slotName: alert.slotId ? alert.slotId.name : 'Unknown Slot',
                    message: alert.message,
                    severity: alert.severity,
                    timestamp: alert.timestamp,
                })),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== ADMIN ENDPOINTS ====================

/*
 * This function gives detailed crowd analytics for admin users.
 * It includes real-time data, historical trends, peak hours, and alerts.
 */
const getAdminCrowdAnalytics = async (req, res) => {
    try {
        const { days } = req.query;
        const analyzeDays = days ? parseInt(days) : 7;

        // Get real-time crowd levels
        const currentLevels = await getCurrentCrowdLevel();

        // Calculate peak hours for all active slots dynamically
        const allSlots = await getOrCreateTodaySlots();
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const slots = allSlots.filter(s => currentTime < s.endTime);
        const peakHoursData = [];

        for (const slot of slots) {
            const peakHours = await getPeakHours(slot._id, analyzeDays);
            peakHoursData.push({
                ...peakHours,
                slotId: {
                    _id: slot._id,
                    name: slot.name,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                },
            });
        }

        // Get historical crowd patterns
        const startDate = new Date(Date.now() - analyzeDays * 24 * 60 * 60 * 1000);
        const patterns = await getHistoricalPatterns({
            startDate,
            endDate: new Date(),
        });

        // Get alert-based  statistics
        const totalAlerts = await getAlertHistory({
            startDate,
            endDate: new Date()
        });
        const activeAlerts = await getActiveAlerts();

        // Calculate today's average occupancy
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySnapshots = await CrowdData.find({
            timestamp: { $gte: today },
        });

        const avgOccupancyToday = todaySnapshots.length > 0
            ? Math.round(todaySnapshots.reduce((sum, s) => sum + s.occupancyRate, 0) / todaySnapshots.length)
            : 0;

        res.json({
            success: true,
            analyzedPeriod: {
                days: analyzeDays,
                startDate,
                endDate: new Date(),
            },
            currentStatus: {
                slots: currentLevels,
                timestamp: new Date(),
            },
            peakHours: peakHoursData,
            historicalPatterns: patterns,
            alerts: {
                total: totalAlerts.length,
                active: activeAlerts.length,
                resolved: totalAlerts.filter(a => a.resolved).length,
                bySeverity: {
                    critical: totalAlerts.filter(a => a.severity === 'critical' && a.slotId).length,
                    high: totalAlerts.filter(a => a.severity === 'high' && a.slotId).length,
                    medium: totalAlerts.filter(a => a.severity === 'medium' && a.slotId).length,
                    low: totalAlerts.filter(a => a.severity === 'low' && a.slotId).length,
                },
            },
            trends: {
                averageOccupancyToday: avgOccupancyToday,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
 * This function returns alert history based on filters.
 * Admins can use it to review past and resolved alerts.
 */
const getAlerts = async (req, res) => {
    try {
        const { slotId, resolved, startDate, endDate } = req.query;

        const filters = {};
        if (slotId) filters.slotId = slotId;
        if (resolved !== undefined) filters.resolved = resolved === 'true';
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const alerts = await getAlertHistory(filters);

        res.json({
            success: true,
            count: alerts.length,
            data: alerts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
 * This function allows admins to mark an alert as resolved.
 * Optional notes can be added while resolving.
 */
const resolveAlertById = async (req, res) => {
    try {
        const { notes } = req.body;

        const alert = await resolveAlert(
            req.params.id,
            req.user._id,
            notes || 'Resolved by admin'
        );

        res.json({
            success: true,
            message: 'Alert resolved successfully',
            data: alert,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/*
 * This function exports crowd data in CSV format.
 * It is mainly used for reports and analysis.
 */
const exportCrowdData = async (req, res) => {
    try {
        const { startDate, endDate, slotId } = req.query;

        const query = {};
        if (slotId) query.slotId = slotId;

        // Apply date filter if provided
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        } else {
            // Default to last 30 days
            query.timestamp = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        }

        const data = await CrowdData.find(query)
            .populate('slotId', 'name startTime endTime')
            .sort({ timestamp: -1 })
            .limit(10000); // Limit to prevent memory issues

        // Generate CSV content
        const csvHeader = 'Timestamp,Slot Name,Slot Time,Active Bookings,Total Capacity,Occupancy Rate (%),Active Tokens,Avg Wait Time (min),Crowd Level\n';

        const csvRows = data.map(row => {
            const slotTime = `${row.slotId.startTime}-${row.slotId.endTime}`;
            return `${row.timestamp.toISOString()},${row.slotId.name},"${slotTime}",${row.activeBookings},${row.totalCapacity},${row.occupancyRate},${row.activeTokenCount},${row.avgWaitTime},${row.crowdLevel}`;
        }).join('\n');

        const csv = csvHeader + csvRows;

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=crowd-data-export-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
 * This function manually triggers alert checking.
 * Mainly used for testing and debugging.
 */
const triggerAlertCheck = async (req, res) => {
    try {
        const alerts = await performAlertCheck();

        res.json({
            success: true,
            message: `Alert check completed. ${alerts.length} new alerts created.`,
            alerts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    // Student endpoints
    getCurrentCrowdLevels,
    getWaitingTimeEstimate,
    getHistoricalCrowdPatterns,
    getSlotPeakHours,

    // Staff endpoints
    getStaffCrowdDashboard,

    // Admin endpoints
    getAdminCrowdAnalytics,
    getAlerts,
    resolveAlertById,
    exportCrowdData,
    triggerAlertCheck,
};
