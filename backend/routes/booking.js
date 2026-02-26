const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyTokens,
    getBooking,
    modifyBooking,
    cancelBooking,
    getAllMyBookings,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

/*
 * Routes for managing student bookings. Accessible only for the student roles
 */


// 1. protect: Checks if the student is logged in.
// 2. checkRole('student'): Ensures only students can access these routes.
router.use(protect);
router.use(checkRole('student'));

// Route to create a new booking
router.post('/', createBooking);

// Route to get active tokens for the student
router.get('/my-tokens', getMyTokens);

// Route to get all past and current bookings
router.get('/all', getAllMyBookings);

// Route to get details of a specific booking by ID
router.get('/:id', getBooking);

// Route to modify an existing booking
router.put('/:id', modifyBooking);

// Route to cancel a booking
router.delete('/:id', cancelBooking);

module.exports = router;
