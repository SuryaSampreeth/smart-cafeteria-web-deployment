const express = require('express');
const router = express.Router();
const {
    getQueueForSlot,
    callNextToken,
    markAsServing,
    markAsServed,
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

/*
 * Routes for staff members to manage the order queue.
 */

// 1. protect: Checks if the user is logged in.
// 2. checkRole('staff'): Ensures the user is a staff.
router.use(protect);
router.use(checkRole('staff'));

// Route to get the current list of queue for a specific slot
router.get('/queue/:slotId', getQueueForSlot);

// Route to call the next token in the queue
router.post('/call-next/:slotId', callNextToken);

// Route to manually mark a specific order as Serving
router.put('/mark-serving/:bookingId', markAsServing);

// Route to mark an order as Served
router.put('/mark-served/:bookingId', markAsServed);

module.exports = router;
