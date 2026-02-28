const SlotTemplate = require('../models/SlotTemplate');
const Slot = require('../models/Slot');
const { getTodayStringIST } = require('./istTime');

/*
 * Returns the current date in YYYY-MM-DD format based on the server's local timezone.
 */
const getTodayDateString = () => {
    return getTodayStringIST();
};

/*
 * This function checks if daily slots exist for the current date.
 * If not, it fetches all SlotTemplates and generates the daily instances.
 * Finally, it returns today's actual Slot instances.
 */
const getOrCreateTodaySlots = async () => {
    try {
        const today = getTodayDateString();

        // Check if any slots exist for today
        let todaySlots = await Slot.find({ date: today }).sort({ startTime: 1 });

        if (todaySlots.length === 0) {
            console.log(`[SlotManager] No slots found for ${today}. Generating from templates...`);

            // Fetch all active templates
            const templates = await SlotTemplate.find({});

            if (templates.length === 0) {
                console.warn(`[SlotManager] No slot templates found in the database. Daily slots cannot be generated.`);
                return [];
            }

            // Map templates to daily instances
            const slotInstances = templates.map(template => ({
                templateId: template._id,
                date: today,
                name: template.name,
                startTime: template.startTime,
                endTime: template.endTime,
                capacity: template.capacity,
                currentBookings: 0
            }));

            // Insert into the database
            await Slot.insertMany(slotInstances);

            console.log(`[SlotManager] Successfully generated ${slotInstances.length} slots for ${today}.`);

            // Fetch newly created slots to return
            todaySlots = await Slot.find({ date: today }).sort({ startTime: 1 });
        }

        return todaySlots;
    } catch (error) {
        console.error('[SlotManager] Error generating daily slots:', error);
        throw error;
    }
};

module.exports = {
    getTodayDateString,
    getOrCreateTodaySlots
};
