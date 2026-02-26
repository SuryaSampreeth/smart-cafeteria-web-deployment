const SlotTemplate = require('../models/SlotTemplate');
const Slot = require('../models/Slot');
const { getOrCreateTodaySlots } = require('../utils/slotManager');
const MenuItem = require('../models/MenuItem');
const Menu = require('../models/Menu');

/*
 * This function fetches all today's time slots.
 * These slots are shown to both students and admin users.
 */
const getAllSlots = async (req, res) => {
    try {
        const slots = await getOrCreateTodaySlots();
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function is used to create a new slot template.
 * Admins use it to set meal timings like breakfast or lunch.
 */
const createSlot = async (req, res) => {
    try {
        const { name, startTime, endTime, capacity } = req.body;

        const slotTemplate = await SlotTemplate.create({
            name,
            startTime,
            endTime,
            capacity,
        });

        res.status(201).json(slotTemplate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function updates details of an existing slot template.
 * It can change the slot timing or capacity.
 */
const updateSlot = async (req, res) => {
    try {
        const dailySlot = await Slot.findById(req.params.id);
        if (!dailySlot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        const slotTemplate = await SlotTemplate.findByIdAndUpdate(
            dailySlot.templateId,
            req.body,
            { new: true, runValidators: true }
        );
        //if template is not found, return 404  
        if (!slotTemplate) {
            return res.status(404).json({ message: 'Slot Template not found' });
        }

        // Return updated template, formatted nicely since UI expects slot structure
        res.json({
            ...slotTemplate.toObject(),
            _id: dailySlot._id // keep daily ID
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function retrieves all available menu items.
 * Only items that are currently available are returned.
 */
const getAllMenuItems = async (req, res) => {
    try {
        const items = await MenuItem.find({ isAvailable: true });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function adds a new food item to the menu.
 * Admins provide item details such as name and price.
 */
const addMenuItem = async (req, res) => {
    try {
        const { name, description, category, price, imageUrl } = req.body;

        const menuItem = await MenuItem.create({
            name,
            description,
            category,
            price,
            imageUrl,
        });

        res.status(201).json(menuItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function updates an existing menu item.
 * It allows editing item details like price or availability.
 */
const updateMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        // If menu item is not found
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function deletes a menu item permanently.
 * It is used when an item is removed from the menu.
 */
const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json({ message: 'Menu item removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function returns the menu for a specific slot.
 * Example: fetching breakfast items for morning slot.
 */
const getMenuForSlot = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        const menu = await Menu.findOne({ slotTemplateId: slot.templateId })
            .populate('menuItems')
            .populate('slotTemplateId', 'name startTime endTime');
        // If no menu is assigned, return empty list
        if (!menu) {
            return res.json({ menuItems: [] });
        }

        // Return the menu, but swap slotTemplateId to be shaped like the slotId the client expects
        res.json({
            ...menu.toObject(),
            slotId: slot // give back the parsed daily slot dynamically
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * This function assigns menu items to a slot.
 * It creates a new menu or updates an existing one.
 */
const assignMenuToSlot = async (req, res) => {
    try {
        const { menuItems } = req.body;
        const { slotId } = req.params;

        const slot = await Slot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        const slotTemplateId = slot.templateId;

        // Check if a menu already exists for the template
        let menu = await Menu.findOne({ slotTemplateId });

        if (menu) {
            // Update  the existing menu items
            menu.menuItems = menuItems;
            await menu.save();
        } else {
            // Create new menu for the slot template
            menu = await Menu.create({
                slotTemplateId,
                menuItems,
            });
        }

        const populatedMenu = await Menu.findById(menu._id)
            .populate('menuItems')
            .populate('slotTemplateId', 'name');

        res.json({
            ...populatedMenu.toObject(),
            slotId: slot
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllSlots,
    createSlot,
    updateSlot,
    getAllMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuForSlot,
    assignMenuToSlot,
};
