const Booking = require('../models/Booking');
const { recalculateQueueAfterServing } = require('../utils/queueManager');

/*
 * This function returns the current queue for a given slot.
 * It shows all tokens that are pending or currently being served.
 */
const getQueueForSlot = async (req, res) => {
    try {
        const { slotId } = req.params;

        // Fetch bookings that are either pending or serving
        const bookings = await Booking.find({
            slotId,
            status: { $in: ['pending', 'serving'] },
        })
            .populate('studentId', 'name email registrationNumber')
            .populate('items.menuItemId', 'name category')
            .sort({ queuePosition: 1 }); // Sort by queue position to show correct order

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function is used to call the next token in the queue.
 * It selects the next pending booking and marks it as serving.
 */
const callNextToken = async (req, res) => {
    try {
        const { slotId } = req.params;

        // Find the first pending booking in the queue
        const nextBooking = await Booking.findOne({
            slotId,
            status: 'pending',
        })
            .sort({ queuePosition: 1 }) // Get the one with lowest queue position
            .populate('studentId', 'name email')
            .populate('items.menuItemId', 'name');

        //if no pending booking is found
        if (!nextBooking) {
            return res.status(404).json({ message: 'No pending tokens in queue' });
        }

        // Update status to serving
        nextBooking.status = 'serving';
        await nextBooking.save();

        res.json(nextBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function allows staff to manually mark a token as serving.
 * It is useful when serving tokens out of queue order.
 */
const markAsServing = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // only pending bookings can be marked as serving
        if (booking.status !== 'pending') {
            return res.status(400).json({
                message: 'Can only mark pending bookings as serving'
            });
        }

        booking.status = 'serving';
        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('studentId', 'name email')
            .populate('items.menuItemId', 'name');

        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function marks a serving token as served.
 * Once served, the token is removed from the active queue.
 */
const markAsServed = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Ensure only serving bookings are marked as served
        if (booking.status !== 'serving') {
            return res.status(400).json({
                message: 'Can only mark serving bookings as served'
            });
        }

        // Update booking status and mark serving completion time
        booking.status = 'served';
        booking.servedAt = new Date();
        await booking.save();

        // Recalculate queue positions for remaining pending tokens
        // This moves everyone else up in the queue
        await recalculateQueueAfterServing(booking.slotId);

        res.json({ message: 'Token marked as served', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getQueueForSlot,
    callNextToken,
    markAsServing,
    markAsServed,
};
