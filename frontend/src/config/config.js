import Constants from 'expo-constants';
import { Platform } from 'react-native';

/*
 * App Configuration File
 * ----------------------
 * This file stores global configuration values used across the app.
 *
 * API_URL:
 * - Uses EXPO_PUBLIC_API_URL from .env for both Web and Mobile.
 * - Falls back to localhost:5000 for local development if env var is not set.
 */
const getApiUrl = () => {
    // Use env variable for all platforms so production (Render) URL works on both web and mobile.
    // Falls back to localhost only when EXPO_PUBLIC_API_URL is not defined (local dev).
    return process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

export default {
    API_URL,
};
