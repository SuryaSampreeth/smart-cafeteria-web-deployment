/*
 * IST (India Standard Time) Utility
 *
 * Render servers run on UTC. IST = UTC + 5 hours 30 minutes.
 * All time-sensitive operations (slot filtering, expiry checks, snapshots)
 * must use getNowIST() instead of new Date() to work correctly in production.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Returns a Date object representing the current moment in IST.
 * getHours(), getMinutes(), getDate(), etc. will all reflect IST values.
 */
const getNowIST = () => {
    const utcNow = new Date();
    return new Date(utcNow.getTime() + IST_OFFSET_MS);
};

/**
 * Returns today's date string in YYYY-MM-DD format using IST.
 */
const getTodayStringIST = () => {
    const now = getNowIST();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

/**
 * Returns the current time as "HH:MM" string in IST.
 */
const getCurrentTimeStringIST = () => {
    const now = getNowIST();
    return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
};

module.exports = { getNowIST, getTodayStringIST, getCurrentTimeStringIST };
