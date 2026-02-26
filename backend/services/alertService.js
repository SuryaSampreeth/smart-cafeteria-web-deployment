const AlertLog = require('../models/AlertLog');
const User = require('../models/User');
const { getCurrentCrowdLevel } = require('./crowdTrackingService');

// Constants defining when to trigger alerts
const ALERT_THRESHOLDS = {
    OVERCROWDING: 90,      // Critical alert (Red)
    WARNING: 80,           // Warning alert (Orange)
    SPIKE_INCREASE: 30,    // Rapid increase alert
};

/*
 * This function checks current crowd levels for all slots.
 * It creates alerts when crowd thresholds are crossed.
 * Usually called using a scheduled job (cron).
 */
const detectOvercrowding = async () => {
    try {
        // Get live crowd details for all active slots (FORCE CALCULATION)
        const crowdLevels = await getCurrentCrowdLevel(null, true);
        const alerts = [];

        for (const level of crowdLevels) {
            const { slotId, occupancyRate, activeBookings, totalCapacity, slotName } = level;

            // Avoid creating repeated alerts within a short time
            // Check if an unresolved alert already exists in last 30 minutes
            const existingAlert = await AlertLog.findOne({
                slotId,
                resolved: false,
                timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
            });

            if (existingAlert) {
                continue; // Skip creating a new alert
            }

            let shouldAlert = false;
            let alertType = 'overcrowding';
            let severity = 'medium';
            let message = '';

            // Check for critical overcrowding
            if (occupancyRate >= ALERT_THRESHOLDS.OVERCROWDING) {
                shouldAlert = true;
                alertType = 'overcrowding';
                severity = 'critical';
                message = `Critical: ${slotName} is at ${occupancyRate}% capacity (${activeBookings}/${totalCapacity}). Immediate action required!`;
            }
            // Check for warning level crowd
            else if (occupancyRate >= ALERT_THRESHOLDS.WARNING) {
                shouldAlert = true;
                alertType = 'capacity_warning';
                severity = 'high';
                message = `Warning: ${slotName} is at ${occupancyRate}% capacity (${activeBookings}/${totalCapacity}). Approaching full capacity.`;
            }

            if (shouldAlert) {
                // Find all staff and admins to notify
                const usersToNotify = await User.find({
                    role: { $in: ['staff', 'admin'] },
                }).select('_id role');

                const notifiedUsers = usersToNotify.map(user => ({
                    userId: user._id,
                    role: user.role,
                    notifiedAt: new Date(),
                }));

                // Save the alert to the database
                const alert = await AlertLog.create({
                    slotId,
                    occupancyRate,
                    activeBookings,
                    totalCapacity,
                    alertType,
                    severity,
                    message,
                    notifiedUsers,
                });

                alerts.push(alert);
                console.log(` Alert created: ${message}`);
            }
        }

        return alerts;
    } catch (error) {
        console.error('Error detecting overcrowding:', error);
        throw error;
    }
};

/*
 * This function detects sudden crowd spikes.
 * It compares the latest crowd data with the previous snapshot.
 */
const detectCrowdSpike = async (slotId) => {
    try {
        const CrowdData = require('../models/CrowdData');

        // Get the latest two crowd records for comparison
        const snapshots = await CrowdData.find({ slotId })
            .sort({ timestamp: -1 })
            .limit(2);

        if (snapshots.length < 2) return null;

        const [current, previous] = snapshots;
        const increase = current.occupancyRate - previous.occupancyRate;

        // Trigger alert if crowd increases suddenly beyond threshold
        if (increase >= ALERT_THRESHOLDS.SPIKE_INCREASE) {

            // Avoid duplicate spike alerts within 15 minutes
            const existingAlert = await AlertLog.findOne({
                slotId,
                alertType: 'spike_detected',
                resolved: false,
                timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
            });

            if (existingAlert) return null;

            const slot = await require('../models/Slot').findById(slotId);
            if (!slot) return null; // Handle case where slot is deleted

            const usersToNotify = await User.find({
                role: { $in: ['staff', 'admin'] },
            }).select('_id role');

            const notifiedUsers = usersToNotify.map(user => ({
                userId: user._id,
                role: user.role,
                notifiedAt: new Date(),
            }));

            // Create 'spike detected' alert
            const alert = await AlertLog.create({
                slotId,
                occupancyRate: current.occupancyRate,
                activeBookings: current.activeBookings,
                totalCapacity: current.totalCapacity,
                alertType: 'spike_detected',
                severity: 'high',
                message: `Crowd spike detected in ${slot.name}: Occupancy jumped from ${previous.occupancyRate}% to ${current.occupancyRate}% (${increase}% increase)`,
                notifiedUsers,
            });

            console.log(` Spike alert: ${alert.message}`);
            return alert;
        }

        return null;
    } catch (error) {
        console.error('Error detecting crowd spike:', error);
        return null;
    }
};

/*
 * This function sends notifications to staff and admins.
 * Currently implemented as console logs (can be extended later).
 */
const notifyStaffAndAdmin = async (alert) => {
    try {
        console.log(` Notification sent for alert: ${alert.message}`);
        console.log(`   Notified ${alert.notifiedUsers.length} users (staff + admin)`);

        return true;
    } catch (error) {
        console.error('Error notifying users:', error);
        return false;
    }
};

/*
 * This function returns all active (unresolved) alerts.
 * Optional filters can be applied.
 */
const getActiveAlerts = async (filters = {}) => {
    try {
        const query = { resolved: false };

        if (filters.slotId) query.slotId = filters.slotId;
        if (filters.severity) query.severity = filters.severity;
        if (filters.alertType) query.alertType = filters.alertType;

        const alerts = await AlertLog.find(query)
            .populate('slotId', 'name startTime endTime')
            .sort({ timestamp: -1 });

        // Filter out alerts where slotId is null (deleted slots)
        return alerts.filter(alert => alert.slotId !== null);
    } catch (error) {
        console.error('Error getting active alerts:', error);
        throw error;
    }
};

/*
 * This function fetches past alert records.
 * Used for viewing alert history and reports.
 */
const getAlertHistory = async (filters = {}) => {
    try {
        const query = {};

        if (filters.slotId) query.slotId = filters.slotId;
        if (filters.resolved !== undefined) query.resolved = filters.resolved;

        // Apply date range filter if provided
        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
        }

        const alerts = await AlertLog.find(query)
            .populate('slotId', 'name startTime endTime')
            .populate('resolvedBy', 'name email role')
            .sort({ timestamp: -1 })
            .limit(100);

        // Filter out alerts with null slotId
        return alerts.filter(alert => alert.slotId !== null);
    } catch (error) {
        console.error('Error getting alert history:', error);
        throw error;
    }
};

/*
 * This function marks an alert as resolved.
 * It records who resolved it and any resolution notes.
 */
const resolveAlert = async (alertId, userId, notes = '') => {
    try {
        const alert = await AlertLog.findById(alertId);

        if (!alert) {
            throw new Error('Alert not found');
        }

        if (alert.resolved) {
            throw new Error('Alert already resolved');
        }

        alert.resolved = true;
        alert.resolvedAt = new Date();
        alert.resolvedBy = userId;
        alert.resolvedNotes = notes;

        await alert.save();

        console.log(` Alert resolved: ${alert.message}`);

        return alert;
    } catch (error) {
        console.error('Error resolving alert:', error);
        throw error;
    }
};

/*
 * Main function that runs all alert checks.
 * Acts as the entry point for background jobs.
 */
const performAlertCheck = async () => {
    try {
        const alerts = await detectOvercrowding();

        // Send notifications for any newly generated alerts
        for (const alert of alerts) {
            await notifyStaffAndAdmin(alert);
        }

        return alerts;
    } catch (error) {
        console.error('Error performing alert check:', error);
        return [];
    }
};

module.exports = {
    detectOvercrowding,
    detectCrowdSpike,
    notifyStaffAndAdmin,
    getActiveAlerts,
    getAlertHistory,
    resolveAlert,
    performAlertCheck,
    ALERT_THRESHOLDS,
};
