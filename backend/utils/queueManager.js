const Booking = require('../models/Booking');

/*
 * This function finds the next queue position for a slot.
 * It checks the current highest position and assigns the next number.
 * If no bookings exist, the queue starts from position 1.
 */
const getNextQueuePosition = async (slotId) => {
    const maxPosition = await Booking.findOne({
        slotId,
        status: { $in: ['pending', 'serving'] },
    })
        .sort({ queuePosition: -1 })
        .select('queuePosition');

    return maxPosition ? maxPosition.queuePosition + 1 : 1;
};

/*
 * This function updates queue positions when a booking is cancelled.
 * All bookings behind the cancelled one move up by one position.
 */
const updateQueuePositions = async (slotId, cancelledPosition) => {
    await Booking.updateMany(
        {
            slotId,
            queuePosition: { $gt: cancelledPosition },
            status: { $in: ['pending', 'serving'] },
        },
        {
            $inc: { queuePosition: -1 },
        }
    );
};

/*
 * This function reorders the queue after a token is served.
 * It makes sure pending bookings are numbered sequentially
 * without any gaps (1, 2, 3, ...).
 */
const recalculateQueueAfterServing = async (slotId) => {
    const pendingBookings = await Booking.find({
        slotId,
        status: 'pending',
    }).sort({ queuePosition: 1 });

    for (let i = 0; i < pendingBookings.length; i++) {
        pendingBookings[i].queuePosition = i + 1;
        await pendingBookings[i].save();
    }
};

module.exports = {
    getNextQueuePosition,
    updateQueuePositions,
    recalculateQueueAfterServing,
};
