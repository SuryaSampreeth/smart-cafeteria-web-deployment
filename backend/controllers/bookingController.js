const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { getTodayDateString, getOrCreateTodaySlots } = require('../utils/slotManager');
const { generateTokenNumber } = require('../utils/tokenGenerator');
const { getNextQueuePosition, updateQueuePositions } = require('../utils/queueManager');
const { predictWaitTime } = require('../services/crowdPredictionService');
const { performAlertCheck } = require('../services/alertService');

/*
 * This function is used to create a new booking for a student.
 * It checks slot availability, assigns a token number,
 * and calculates the estimated waiting time.
 */
const createBooking = async (req, res) => {
    try {
        const { slotId, items } = req.body;

        // Ensure today's slots are initialized before booking
        await getOrCreateTodaySlots();

        // Check availability of the selected slot
        const slot = await Slot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Validate that the slot is for today
        const today = getTodayDateString();
        if (slot.date !== today) {
            return res.status(400).json({ message: 'Cannot book slots for a different day' });
        }

        // Validate that the slot hasn't ended already
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (currentTime >= slot.endTime) {
            return res.status(400).json({ message: 'Slot time has already ended' });
        }

        // Check if the slot has reached its maximum capacity
        if (slot.currentBookings >= slot.capacity) {
            return res.status(400).json({ message: 'Slot is full' });
        }

        // Generate a unique token number for the booking
        const tokenNumber = await generateTokenNumber(slotId, slot.name);

        // Get the next position in the queue
        const queuePosition = await getNextQueuePosition(slotId);

        // Predict the waiting time based on current crowd
        const prediction = await predictWaitTime(slotId, queuePosition);
        const estimatedWaitTime = prediction.predictedWaitTime;

        // Create the booking record in the database
        const booking = await Booking.create({
            studentId: req.user._id,
            slotId,
            tokenNumber,
            items,
            queuePosition,
            estimatedWaitTime,
        });

        // Increment the booking count for the slot
        slot.currentBookings += 1;
        await slot.save();

        // fetch booking detials with slot and menu item details
        const populatedBooking = await Booking.findById(booking._id)
            .populate('slotId', 'name startTime endTime')
            .populate('items.menuItemId', 'name price imageUrl');

        // Asynchronously check for overcrowding
        performAlertCheck().catch(err => console.error('Error in post-booking alert check:', err));

        res.status(201).json(populatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function returns all active tokens for the logged-in student.
 * Active tokens include pending and serving bookings only.
 */

const getMyTokens = async (req, res) => {
    try {
        const bookings = await Booking.find({
            studentId: req.user._id,
            status: { $in: ['pending', 'serving'] }, // Only active bookings
        })
            .populate('slotId', 'name startTime endTime')
            .populate('items.menuItemId', 'name price imageUrl')
            .sort({ bookedAt: -1 }); // Sort by newest first

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function fetches details of a specific booking using booking ID.
 * It also checks whether the booking belongs to the logged-in student.
 */

const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('slotId', 'name startTime endTime')
            .populate('items.menuItemId', 'name price imageUrl category');
        //check if booking exists
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify that the booking belongs to the current user
        if (booking.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function allows students to modify items in a booking.
 * Modification is allowed only if the booking is still pending.
 */

const modifyBooking = async (req, res) => {
    try {
        const { items } = req.body;

        const booking = await Booking.findById(req.params.id);
        //check if booking exists
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if booking belongs to the student
        if (booking.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Prevent modification if booking is already served or cancelled
        if (booking.status !== 'pending') {
            return res.status(400).json({
                message: 'Cannot modify booking. Status: ' + booking.status
            });
        }

        // Record changes in history before updating
        const oldItems = JSON.stringify(booking.items);
        booking.items = items;
        booking.modificationHistory.push({
            modifiedAt: new Date(),
            changes: `Items changed from ${oldItems} to ${JSON.stringify(items)}`,
        });

        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('slotId', 'name startTime endTime')
            .populate('items.menuItemId', 'name price imageUrl');

        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function is used to cancel a booking.
 * It frees up the slot and updates queue positions for others.
 */

const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if booking belongs to the student
        if (booking.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Only allow cancellation for pending bookings
        if (booking.status !== 'pending') {
            return res.status(400).json({
                message: 'Cannot cancel booking. Status: ' + booking.status
            });
        }

        // Mark booking as cancelled
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        await booking.save();

        // Release the slot capacity
        const slot = await Slot.findById(booking.slotId);
        if (slot) {
            // Decrease booking count, ensure it doesn't go below 0
            slot.currentBookings = Math.max(0, slot.currentBookings - 1);
            await slot.save();
        }

        // Adjust queue positions for other bookings in the same slot
        await updateQueuePositions(booking.slotId, booking.queuePosition);

        // Asynchronously check for crowd updates
        performAlertCheck().catch(err => console.error('Error in post-cancellation alert check:', err));

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function returns all bookings of the student,
 * including past, cancelled, and completed bookings.
 */
const getAllMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            studentId: req.user._id,
        })
            .populate('slotId', 'name startTime endTime')
            .populate('items.menuItemId', 'name price imageUrl')
            .sort({ bookedAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    getMyTokens,
    getBooking,
    modifyBooking,
    cancelBooking,
    getAllMyBookings,
};
