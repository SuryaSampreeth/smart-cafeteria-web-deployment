/**
 * Utility - Format Time
 * ---------------------
 * Converts a given time value into a user-friendly 12-hour format.
 * Example output: "01:30 PM"
 *
 * This utility is mainly used to display slot timings,
 * booking times, and token serving times in the UI.
 */
export const formatTime = (timeString) => {
    // If no value is provided, return empty string
    if (!timeString) return '';

    /*
     * If the input already contains ":" (HH:MM),
     * assume it is already formatted (e.g., from time picker)
     * and return it directly.
     */
    if (timeString.includes(':')) {
        return timeString;
    }

    /*
     * Otherwise, convert the value into a Date object
     * and format it using locale-based time formatting.
     */
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Utility - Format Date
 * ---------------------
 * Converts a date value into a readable short date format.
 * Example output: "Jan 1, 2024"
 *
 * Used for displaying booking dates, alert timestamps,
 * and historical crowd data.
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Utility - Format Date & Time
 * ----------------------------
 * Combines both date and time into a single readable string.
 * Example output: "Jan 1, 2024 01:30 PM"
 *
 * Reuses formatDate() and formatTime() for consistency
 * across the application.
 */
export const formatDateTime = (dateString) => {
    // Reuses the individual helper functions for consistency
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
};
