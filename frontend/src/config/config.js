import Constants from 'expo-constants';
import { Platform } from 'react-native';

/*
 * App Configuration File
 * ----------------------
 * This file stores global configuration values used across the app.
 *
 * API_URL:
 * - On Web: uses localhost since both the browser and backend are on the same machine.
 * - On Mobile (Android/iOS): uses the LAN IP from EXPO_PUBLIC_API_URL in .env,
 *   so the physical device can reach the backend over Wi-Fi.
 */
const getApiUrl = () => {
    // On web, the browser and backend are on the same machine, so localhost works directly.
    // Using the LAN IP on web causes firewall/timeout issues.
    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    }
    // On mobile, we need the LAN IP so the physical device can reach the backend over Wi-Fi.
    return process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

export default {
    API_URL,
};
