const express = require('express');
const router = express.Router();
const {
    registerStaff,
    getAllStaff,
    deleteStaff,
    getAnalytics,
    getSlotWiseData,
    getStaffPerformance,
    getWasteTracking,
    getSustainabilityReport,
    triggerDataBackup
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// These routes are for admin and can be accessed only by admin

// 1. protect: Checks if the user is logged in.
// 2. checkRole('admin'): Ensures the user is an administrator.
router.use(protect);
router.use(checkRole('admin'));

// Route to register a new staff member
router.post('/staff', registerStaff);

// Route to get a list of all staff members
router.get('/staff', getAllStaff);

// Route to delete a staff member by their ID
router.delete('/staff/:id', deleteStaff);

// Route to fetch general analytics data
router.get('/analytics', getAnalytics);

// Route to get slot-wise data
router.get('/analytics/slot-wise', getSlotWiseData);

// Route to view the performance metrics of staff members
router.get('/analytics/staff-performance', getStaffPerformance);

// Route for waste tracking monitor (cancelled tokens/items)
router.get('/features/waste-tracking', getWasteTracking);

// Route for sustainability reports
router.get('/features/sustainability', getSustainabilityReport);

// Route to trigger data backup snapshot
router.post('/features/data-backup', triggerDataBackup);

module.exports = router;
