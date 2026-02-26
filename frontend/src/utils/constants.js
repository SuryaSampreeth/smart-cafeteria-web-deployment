/**
 * Constants - Slot Names
 * ----------------------
 */
export const SLOT_NAMES = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    SNACKS: 'Snacks',
    DINNER: 'Dinner',
};

/**
 * Constants - Booking Status
 * --------------------------
 * Lifecycle states of a meal booking.
 * - PENDING: Booked, waiting in queue.
 * - SERVING: User has been called to the counter.
 * - SERVED: Meal has been collected.
 * - CANCELLED: User cancelled the booking.
 */
export const BOOKING_STATUS = {
    PENDING: 'pending',
    SERVING: 'serving',
    SERVED: 'served',
    CANCELLED: 'cancelled',
};

/**
 * Constants - User Roles
 * ----------------------
 * Authorization roles for the application.
 */
export const USER_ROLES = {
    STUDENT: 'student',
    STAFF: 'staff',
    ADMIN: 'admin',
};

/**
 * Constants - Menu Categories
 * ---------------------------
 * Classification for food items to help with filtering and display.
 */
export const MENU_CATEGORIES = {
    VEG: 'veg',
    NON_VEG: 'non-veg',
    BEVERAGE: 'beverage',
    DESSERT: 'dessert',
};
