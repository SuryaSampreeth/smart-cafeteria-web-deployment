import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

/*
 * AuthContext
 * -----------
 * This context is used to manage authentication globally in the app.
 * It stores user details, authentication status, and helper functions
 * like login, register, and logout.
 */
const AuthContext = createContext();

/*
 * AuthContext
 * -----------
 * This context is used to manage authentication globally in the app.
 * It stores user details, authentication status, and helper functions
 * like login, register, and logout.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/*
 * Platform-based storage abstraction
 * ----------------------------------
 * - On Web: Uses browser localStorage
 * - On Mobile (Android/iOS): Uses Expo SecureStore
 *
 * This ensures:
 * - Tokens are persisted across app restarts
 * - Sensitive data is stored securely on mobile devices
 */
const storage = {
    async getItem(key) {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    },
    async setItem(key, value) {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    async removeItem(key) {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },
};

/*
 * AuthProvider Component
 * ----------------------
 * Wraps the entire application and provides authentication state
 * and actions to all child components.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);       // Current user object
    const [loading, setLoading] = useState(true); // Loading state during init
    const [error, setError] = useState(null);     // Error messages (login/register)

    // Check for existing token on app start
    useEffect(() => {
        checkAuth();
    }, []);

    // Verify if a token is stored and fetch user details
    const checkAuth = async () => {
        try {
            const token = await storage.getItem('token');
            if (token) {
                const response = await authAPI.getMe();
                setUser(response.data);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            await storage.removeItem('token'); // Clear invalid token
        } finally {
            setLoading(false);
        }
    };

    // Handle User Login
    /*
     * Handles user login.
     * - Sends credentials to backend
     * - Stores JWT token securely
     * - Updates user state on success
     */
    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            const { token, ...userData } = response.data;

            await storage.setItem('token', token);
            setUser(userData);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Handle User Registration
    /*
     * Handles new user registration.
     * - Sends user details to backend
     * - Automatically logs in the user after registration
     */
    const register = async (name, email, password, registrationNumber) => {
        try {
            setError(null);
            const response = await authAPI.register({
                name,
                email,
                password,
                registrationNumber
            });
            const { token, ...userData } = response.data;

            await storage.setItem('token', token);
            setUser(userData);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Handle Logout
    /*
     * Handles user logout.
     * - Removes JWT token from storage
     * - Clears user state
     */
    const logout = async () => {
        try {
            await storage.removeItem('token');
            setUser(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    // Update User State (Helper for Profile Updates)
    const updateUser = async (userData, token) => {
        if (token) {
            await storage.setItem('token', token);
        }
        setUser(userData);
    };

    /*
     * Value object exposed to all components using AuthContext.
     * Includes authentication state and helper methods.
     */
    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser, // Exposed helper
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};