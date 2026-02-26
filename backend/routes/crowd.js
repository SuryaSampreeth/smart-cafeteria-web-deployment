const express = require('express');
const router = express.Router();
const {
    getCurrentCrowdLevels,
    getWaitingTimeEstimate,
    getHistoricalCrowdPatterns,
    getSlotPeakHours,
    getStaffCrowdDashboard,
    getAdminCrowdAnalytics,
    getAlerts,
    resolveAlertById,
    exportCrowdData,
    triggerAlertCheck,
} = require('../controllers/crowdController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// ==================== STUDENT ROUTES ====================
// These routes can be accessed by students, staff, and admin users

// Get current crowd levels for all slots
// Used by students to check live cafeteria crowd status
router.get('/levels', protect, getCurrentCrowdLevels);

// Get estimated waiting time for a particular booking/token
// Helps students know how long they need to wait
router.get('/waiting-time/:bookingId', protect, getWaitingTimeEstimate);

// Get historical crowd data for analysis
// Shows crowd trends over past daysx
router.get('/patterns', protect, getHistoricalCrowdPatterns);

//Get peak crowd hours for a specific slot
// Useful to avoid busy time slots
router.get('/peak-hours/:slotId', protect, getSlotPeakHours);

// ==================== STAFF ROUTES ====================
// These routes are restricted to staff and admin users

// Get live crowd dashboard for staff
// Shows current crowd, alerts, and summary details
router.get(
    '/staff/dashboard',
    protect,
    checkRole('staff', 'admin'),
    getStaffCrowdDashboard
);

// ==================== ADMIN ROUTES ====================
// These routes are accessible only by admin users

// Get detailed crowd analytics
// Includes trends, peak hours, and alert statistics
router.get(
    '/admin/analytics',
    protect,
    checkRole('admin'),
    getAdminCrowdAnalytics
);

// Get list of all crowd alerts
// Admin can filter alerts by slot or status
router.get(
    '/admin/alerts',
    protect,
    checkRole('admin'),
    getAlerts
);

// Resolve a specific crowd alert
// Admin can mark alerts as resolved with notes
router.post(
    '/admin/alerts/:id/resolve',
    protect,
    checkRole('admin'),
    resolveAlertById
);

// Export crowd data as CSV file
// Used for reporting and analysis
router.get(
    '/admin/export',
    protect,
    checkRole('admin'),
    exportCrowdData
);

// Manually trigger alert checking
// Mainly used for testing and debugging
router.post(
    '/admin/check-alerts',
    protect,
    checkRole('admin'),
    triggerAlertCheck
);

module.exports = router;
