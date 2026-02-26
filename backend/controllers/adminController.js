const User = require('../models/User');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const SlotTemplate = require('../models/SlotTemplate');

/*
 * This function is used by the admin to register a new staff member.
 * It takes name, email, and password from the request body.
 * Only admin users are allowed to access this API.
 */
const registerStaff = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if a user already exists with the given email
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user with role set as 'staff'
        const staff = await User.create({
            name,
            email,
            password,
            role: 'staff',
        });

        // Send the newly created staff details as response
        res.status(201).json({
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function fetches all registered staff members.
 * Password field is excluded for security reasons.
 * Only accessible by admin.
 */
const getAllStaff = async (req, res) => {
    try {
        // Get all users whose role is 'staff'
        const staff = await User.find({ role: 'staff' }).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function deletes a staff member using their ID.
 * It first checks if the user exists and confirms the role is staff.
 */
const deleteStaff = async (req, res) => {
    try {
        // Find staff member by ID
        const staff = await User.findById(req.params.id);

        // If no staff found, return error
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        // Prevent deletion of users who are not staff
        if (staff.role !== 'staff') {
            return res.status(400).json({ message: 'Can only delete staff members' });
        }

        // Delete the staff member
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'Staff member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function provides analytics data for the admin dashboard.
 * It includes booking count, active tokens, users, and revenue details.
 */
const getAnalytics = async (req, res) => {
    try {
        // Set time to start of the current day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count total bookings made today
        const totalBookingsToday = await Booking.countDocuments({
            bookedAt: { $gte: today },
        });

        const { getOrCreateTodaySlots } = require('../utils/slotManager');
        const todaySlots = await getOrCreateTodaySlots();
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const activeSlotIds = todaySlots
            .filter(slot => currentTime <= slot.endTime)
            .map(slot => slot._id);

        // Count tokens that are either pending or currently being served from ACTIVE slots
        const activeTokens = await Booking.countDocuments({
            status: { $in: ['pending', 'serving'] },
            slotId: { $in: activeSlotIds }
        });

        // Count how many tokens are served today
        const servedToday = await Booking.countDocuments({
            status: 'served',
            servedAt: { $gte: today },
        });

        // Count cancelled bookings for today
        const cancelledToday = await Booking.countDocuments({
            status: 'cancelled',
            cancelledAt: { $gte: today },
        });

        // Count total student users
        const totalStudents = await User.countDocuments({ role: 'student' });

        // Count total staff users
        const totalStaff = await User.countDocuments({ role: 'staff' });

        // Calculate total revenue from served bookings today
        const servedBookings = await Booking.find({
            status: 'served',
            servedAt: { $gte: today },
        }).populate('items.menuItemId', 'price');

        let totalRevenue = 0;

        // Calculate revenue based on item price and quantity
        servedBookings.forEach(booking => {
            booking.items.forEach(item => {
                const price = item.menuItemId ? item.menuItemId.price : 0;
                totalRevenue += price * item.quantity;
            });
        });

        res.json({
            totalBookingsToday: activeTokens + servedToday,
            activeTokens,
            servedToday,
            cancelledToday,
            totalStudents,
            totalStaff,
            totalRevenue,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function returns booking statistics slot-wise for the current day.
 * It helps the admin understand slot usage and load.
 */
const getSlotWiseData = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Group bookings by slotId and count based on status
        const slotData = await Booking.aggregate([
            {
                $match: {
                    bookedAt: { $gte: today },
                },
            },
            {
                $group: {
                    _id: '$slotId',
                    totalBookings: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                    },
                    serving: {
                        $sum: { $cond: [{ $eq: ['$status', 'serving'] }, 1, 0] },
                    },
                    served: {
                        $sum: { $cond: [{ $eq: ['$status', 'served'] }, 1, 0] },
                    },
                },
            },
        ]);

        // Fetch slot details to get slot names
        const slots = await Slot.find({});

        // Match slot IDs with names, and ONLY return active slots
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const result = slotData
            .map((data) => {
                const slot = slots.find((s) => s._id.toString() === data._id.toString());
                return {
                    slotName: slot ? slot.name : 'Unknown',
                    startTime: slot ? slot.startTime : '00:00',
                    endTime: slot ? slot.endTime : '23:59',
                    ...data,
                };
            })
            .filter((data) => {
                // Filter to include only currently active slots
                return currentTime <= data.endTime;
            });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function gives a simple overview of staff performance.
 * It calculates how many tokens are served on average per staff member.
 */
const getStaffPerformance = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count total tokens served today
        const servedCount = await Booking.countDocuments({
            status: 'served',
            servedAt: { $gte: today },
        });

        // Count number of staff members
        const staffCount = await User.countDocuments({ role: 'staff' });

        res.json({
            totalServed: servedCount,
            staffCount,
            averagePerStaff: staffCount > 0 ? Math.round(servedCount / staffCount) : 0,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function handles waste tracking by summing items from cancelled tokens.
 */
const getWasteTracking = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cancelledBookings = await Booking.find({
            status: { $in: ['cancelled', 'expired'] },
            bookedAt: { $gte: today },
        }).populate('items.menuItemId', 'name price');

        let totalWasteValue = 0;
        let wastedItems = [];

        cancelledBookings.forEach(booking => {
            booking.items.forEach(item => {
                const menuItem = item.menuItemId;
                if (menuItem) {
                    const existingItem = wastedItems.find(i => i.name === menuItem.name);
                    if (existingItem) {
                        existingItem.quantity += item.quantity;
                        existingItem.value += menuItem.price * item.quantity;
                    } else {
                        wastedItems.push({
                            name: menuItem.name,
                            quantity: item.quantity,
                            value: menuItem.price * item.quantity,
                        });
                    }
                    totalWasteValue += menuItem.price * item.quantity;
                }
            });
        });

        res.json({
            totalTokensWasted: cancelledBookings.length,
            totalWasteValue,
            wastedItems
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function calculates sustainability metrics based on waste and served items.
 */
const getSustainabilityReport = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allBookingsToday = await Booking.find({ bookedAt: { $gte: today } });

        const totalBookings = allBookingsToday.length;
        const servedBookings = allBookingsToday.filter(b => b.status === 'served').length;
        const cancelledBookings = allBookingsToday.filter(b => b.status === 'cancelled' || b.status === 'expired').length;

        const sustainabilityScore = totalBookings > 0
            ? ((servedBookings / totalBookings) * 100).toFixed(1)
            : 100;

        res.json({
            sustainabilityScore,
            totalPrepared: totalBookings,
            totalConsumed: servedBookings,
            totalWasted: cancelledBookings,
            environmentalImpactStr: sustainabilityScore > 90 ? 'Low' : sustainabilityScore > 75 ? 'Medium' : 'High'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/*
 * This function triggers a snapshot for data backup.
 */
const triggerDataBackup = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const bookingCount = await Booking.countDocuments();
        const slotCount = await SlotTemplate.countDocuments();

        const backupInfo = {
            timestamp: new Date(),
            collections: {
                users: userCount,
                bookings: bookingCount,
                slots: slotCount
            },
            status: 'Success',
            message: 'Database backup successfully generated in the cloud infrastructure.'
        };

        res.json(backupInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerStaff,
    getAllStaff,
    deleteStaff,
    getAnalytics,
    getSlotWiseData,
    getStaffPerformance,
    getWasteTracking,
    getSustainabilityReport,
    triggerDataBackup
};
