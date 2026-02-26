import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import config from '../config/config';

// Base API URL from configuration
const API_URL = config.API_URL;

/*
 * getToken()
 * ----------
 * Retrieves the authentication token stored on the device.
 * Platform-specific handling:
 * - Web: Uses browser localStorage
 * - Mobile (Android/iOS): Uses Expo SecureStore for encrypted storage
 *
 * This token is later attached to API requests for authentication.
 */
const getToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('token');
    }
    return await SecureStore.getItemAsync('token');
};

/*
 * Axios Instance
 * --------------
 * Creates a centralized axios instance with:
 * - Base URL
 * - Default JSON headers
 *
 * This avoids repeating configuration for every API call.
 */
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/*
 * Axios Request Interceptor
 * -------------------------
 * Runs before every outgoing API request.
 * - Fetches JWT token from storage
 * - Automatically attaches token in Authorization header
 *
 * Header format:
 * Authorization: Bearer <token>
 */
api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================

/*
 * Authentication API
 * ------------------
 * Handles user login, registration, and profile fetching.
 */
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/update-profile', data),
};

// ==================== BOOKING API ====================

/*
 * Booking API
 * -----------
 * Handles meal booking operations for students.
 */
export const bookingAPI = {
    create: (data) => api.post('/bookings', data),
    getMyTokens: () => api.get('/bookings/my-tokens'),
    getAllMyBookings: () => api.get('/bookings/all'),
    getMyBookings: () => api.get('/bookings/all'), // Alias for getAllMyBookings
    getBooking: (id) => api.get(`/bookings/${id}`),
    modify: (id, data) => api.put(`/bookings/${id}`, data),
    cancel: (id) => api.delete(`/bookings/${id}`),
};

// ==================== STAFF API ====================

/*
 * Staff API
 * ---------
 * Used by cafeteria staff for queue and token management.
 */
export const staffAPI = {
    getQueue: (slotId) => api.get(`/staff/queue/${slotId}`),
    callNext: (slotId) => api.post(`/staff/call-next/${slotId}`),
    markServing: (bookingId) => api.put(`/staff/mark-serving/${bookingId}`),
    markServed: (bookingId) => api.put(`/staff/mark-served/${bookingId}`),
};

// ==================== ADMIN API ====================

/*
 * Admin API
 * ---------
 * Used for administrative tasks like staff management
 * and analytics dashboards.
 */
export const adminAPI = {
    registerStaff: (data) => api.post('/admin/staff', data),
    getAllStaff: () => api.get('/admin/staff'),
    deleteStaff: (id) => api.delete(`/admin/staff/${id}`),
    getAnalytics: () => api.get('/admin/analytics'),
    getSlotWiseData: () => api.get('/admin/analytics/slot-wise'),
    getStaffPerformance: () => api.get('/admin/analytics/staff-performance'),
    getWasteTracking: () => api.get('/admin/features/waste-tracking'),
    getSustainabilityReport: () => api.get('/admin/features/sustainability'),
    triggerDataBackup: () => api.post('/admin/features/data-backup'),
};

/**
 * Menu & Slot API Service
 * Manages cafeteria slots and menu items.
 */
export const menuAPI = {
    getAllSlots: () => api.get('/menu/slots'),
    createSlot: (data) => api.post('/menu/slots', data),
    updateSlot: (id, data) => api.put(`/menu/slots/${id}`, data),
    getAllMenuItems: () => api.get('/menu/items'),
    addMenuItem: (data) => api.post('/menu/items', data),
    updateMenuItem: (id, data) => api.put(`/menu/items/${id}`, data),
    deleteMenuItem: (id) => api.delete(`/menu/items/${id}`),
    getMenuForSlot: (slotId) => api.get(`/menu/slot/${slotId}`),
    getMenuBySlot: (slotId) => api.get(`/menu/slot/${slotId}`), // Alias for getMenuForSlot
    assignMenuToSlot: (slotId, data) => api.post(`/menu/slot/${slotId}`, data),
};

// ==================== CROWD MONITORING API ====================

/*
 * Crowd API
 * ---------
 * Handles real-time and historical crowd monitoring features.
 */
export const crowdAPI = {
    // --- Student Endpoints ---
    getCrowdLevels: () => api.get('/crowd/levels'),
    getWaitingTime: (bookingId) => api.get(`/crowd/waiting-time/${bookingId}`),

    // Fetches historical crowd patterns with optional filters
    getHistoricalPatterns: (slotId, startDate, endDate) => {
        const params = {};
        if (slotId) params.slotId = slotId;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return api.get('/crowd/patterns', { params });
    },

    // Identifies peak hours for specific days
    getPeakHours: (slotId, days) => {
        const params = {};
        if (days) params.days = days;
        return api.get(`/crowd/peak-hours/${slotId}`, { params });
    },

    // --- Staff Endpoints ---
    getStaffDashboard: () => api.get('/crowd/staff/dashboard'),

    // --- Admin Endpoints ---
    getAdminAnalytics: (days) => {
        const params = {};
        if (days) params.days = days;
        return api.get('/crowd/admin/analytics', { params });
    },
    getAlerts: (filters) => api.get('/crowd/admin/alerts', { params: filters }),
    resolveAlert: (alertId, notes) => api.post(`/crowd/admin/alerts/${alertId}/resolve`, { notes }),

    // Exports crowd data as a file (blob)
    exportData: (startDate, endDate) => {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return api.get('/crowd/admin/export', { params, responseType: 'blob' });
    },
    triggerAlertCheck: () => api.post('/crowd/admin/check-alerts'),
};

// ==================== DEMAND FORECAST API ====================

/*
 * Demand Forecast API
 * -------------------
 * ML-based demand forecasting endpoints (admin only).
 */
export const demandForecastAPI = {
    getHealth: () => api.get('/demand-forecast/health'),
    getDailyForecast: (days) => api.get('/demand-forecast/daily', { params: { days } }),
    getWeeklyForecast: (weeks) => api.get('/demand-forecast/weekly', { params: { weeks } }),
    getMonthlyForecast: (months) => api.get('/demand-forecast/monthly', { params: { months } }),
    getAccuracy: () => api.get('/demand-forecast/accuracy'),
    getHistorical: () => api.get('/demand-forecast/historical'),
    triggerRetrain: () => api.post('/demand-forecast/retrain'),
};

/**
 * Default Export: Unified API Object
 * Combines the axios instance with all service modules for easy access.
 * Also includes convenience aliases for common methods.
 */
export default {
    ...api,

    // Auth Helpers
    register: (data) => authAPI.register(data),
    login: (data) => authAPI.login(data),
    updateProfile: (data) => authAPI.updateProfile(data),

    // Booking Helpers
    createBooking: (data) => bookingAPI.create(data),
    getMyTokens: () => bookingAPI.getMyTokens(),

    // Slot & Menu Helpers
    getSlots: () => menuAPI.getAllSlots(),
    getMenuItems: () => menuAPI.getAllMenuItems(),

    // Crowd Monitoring Helpers
    getCrowdLevels: () => crowdAPI.getCrowdLevels(),
    getWaitingTimeEstimate: (bookingId) => crowdAPI.getWaitingTime(bookingId),
    getHistoricalPatterns: (slotId, startDate, endDate) =>
        crowdAPI.getHistoricalPatterns(slotId, startDate, endDate),
    getPeakHours: (slotId, days) => crowdAPI.getPeakHours(slotId, days),
    getStaffCrowdDashboard: () => crowdAPI.getStaffDashboard(),
    getAdminCrowdAnalytics: (days) => crowdAPI.getAdminAnalytics(days),
    getAlertHistory: (filters) => crowdAPI.getAlerts(filters),
    resolveAlert: (alertId, notes) => crowdAPI.resolveAlert(alertId, notes),

    // Generates a direct URL for downloading the export file
    exportCrowdData: (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        return `${config.API_URL}/crowd/admin/export?${params.toString()}`;
    },

    // Demand Forecast Helpers
    getDailyForecast: (days) => demandForecastAPI.getDailyForecast(days),
    getWeeklyForecast: (weeks) => demandForecastAPI.getWeeklyForecast(weeks),
    getMonthlyForecast: (months) => demandForecastAPI.getMonthlyForecast(months),
    getForecastAccuracy: () => demandForecastAPI.getAccuracy(),
    getForecastHistorical: () => demandForecastAPI.getHistorical(),
    triggerModelRetrain: () => demandForecastAPI.triggerRetrain(),
};