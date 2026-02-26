const express = require('express');
const router = express.Router();
const {
    getAllSlots,
    createSlot,
    updateSlot,
    getAllMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuForSlot,
    assignMenuToSlot,
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

/*
 * Routes for managing the cafe menu and time slots.
 */

// ==================== PUBLIC ROUTES ====================
// Accessible to Students, staff, admin

// Get all available time slots
router.get('/slots', getAllSlots);

// Get all food items in the database
router.get('/items', getAllMenuItems);

// Get the specific menu for a time slot
router.get('/slot/:slotId', getMenuForSlot);

// ==================== ADMIN ROUTES ====================
// Accessible only by admin

// Create a new time slot
router.post('/slots', protect, checkRole('admin'), createSlot);

// Update an existing time slot
router.put('/slots/:id', protect, checkRole('admin'), updateSlot);

// Add a new food item to the database
router.post('/items', protect, checkRole('admin'), addMenuItem);

// Update an existing food item
router.put('/items/:id', protect, checkRole('admin'), updateMenuItem);

// Delete a food item
router.delete('/items/:id', protect, checkRole('admin'), deleteMenuItem);

// Assign specific food items to a time slot
router.post('/slot/:slotId', protect, checkRole('admin'), assignMenuToSlot);

module.exports = router;
