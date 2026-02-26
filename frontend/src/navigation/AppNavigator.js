import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Student Screens
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import BookingScreen from '../screens/student/BookingScreen';
import MyTokensScreen from '../screens/student/MyTokensScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import CrowdMonitorScreen from '../screens/student/CrowdMonitorScreen';
import CrowdPatternsScreen from '../screens/student/CrowdPatternsScreen';

// Staff Screens
import StaffHomeScreen from '../screens/staff/StaffHomeScreen';
import QueueManagementScreen from '../screens/staff/QueueManagementScreen';
import StaffCrowdDashboard from '../screens/staff/StaffCrowdDashboard';

// Admin Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import ManageStaffScreen from '../screens/admin/ManageStaffScreen';
import ManageMenuScreen from '../screens/admin/ManageMenuScreen';
import AdminCrowdAnalytics from '../screens/admin/AdminCrowdAnalytics';
import DemandForecastScreen from '../screens/admin/DemandForecastScreen';
import WasteTrackingScreen from '../screens/admin/WasteTrackingScreen';
import SustainabilityScreen from '../screens/admin/SustainabilityScreen';
import DataBackupScreen from '../screens/admin/DataBackupScreen';

import { colors } from '../styles/colors';
import { USER_ROLES } from '../utils/constants';

/*
 * Navigation Architecture
 * -----------------------
 * This file controls the entire app navigation flow.
 *
 * Navigation Types Used:
 * 1. Stack Navigator:
 *    - Used for authentication flow (Login -> Register)
 *    - Screens are stacked on top of each other
 *
 * 2. Bottom Tab Navigator:
 *    - Used for main app navigation
 *    - Different tabs are shown based on user role
 */
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/*
 * AuthStack
 * ---------
 * Contains screens accessible before login.
 * Header is hidden to allow custom UI.
 */
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

/*
 * Common Tab Configuration
 * ------------------------
 * Returns shared styling for all bottom tab navigators.
 * This avoids repeating the same styles for Student, Staff, and Admin tabs.
 */
const getTabScreenOptions = () => ({
    headerShown: false,
    tabBarActiveTintColor: colors.brownie,  // Active tab color
    tabBarInactiveTintColor: colors.gray,   // Inactive tab color
    tabBarStyle: {
        backgroundColor: colors.cream,
        borderTopColor: colors.brownieLight,
    },
});

/*
 * Student Tabs
 * ------------
 * Screens accessible only to STUDENT users.
 * Includes booking, tokens, crowd monitoring, and profile.
 */
const StudentTabs = () => (
    <Tab.Navigator screenOptions={getTabScreenOptions()}>
        <Tab.Screen name="Home" component={StudentHomeScreen} />
        <Tab.Screen name="Book Meal" component={BookingScreen} />
        <Tab.Screen name="My Tokens" component={MyTokensScreen} />
        <Tab.Screen name="Crowd Monitor" component={CrowdMonitorScreen} />
        <Tab.Screen name="Patterns" component={CrowdPatternsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);

/*
 * Staff Tabs
 * ----------
 * Screens accessible only to STAFF users.
 * Includes queue management and crowd monitoring.
 */
const StaffTabs = () => (
    <Tab.Navigator screenOptions={getTabScreenOptions()}>
        <Tab.Screen name="Dashboard" component={StaffHomeScreen} />
        <Tab.Screen name="Queue" component={QueueManagementScreen} />
        <Tab.Screen name="Crowd" component={StaffCrowdDashboard} />
    </Tab.Navigator>
);

/*
 * Admin Home Stack
 * ----------------
 * Houses the Admin Dashboard and its drill-down advanced feature screens.
 */
const AdminHomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminDashboardMain" component={AdminHomeScreen} />
        <Stack.Screen name="WasteTracking" component={WasteTrackingScreen} />
        <Stack.Screen name="Sustainability" component={SustainabilityScreen} />
        <Stack.Screen name="DataBackup" component={DataBackupScreen} />
    </Stack.Navigator>
);

/*
 * Admin Tabs
 * ----------
 * Screens accessible only to ADMIN users.
 * Includes staff management, menu management, and analytics.
 */
const AdminTabs = () => (
    <Tab.Navigator screenOptions={getTabScreenOptions()}>
        <Tab.Screen name="Dashboard" component={AdminHomeStack} />
        <Tab.Screen name="Manage Staff" component={ManageStaffScreen} />
        <Tab.Screen name="Manage Menu" component={ManageMenuScreen} />
        <Tab.Screen name="Analytics" component={AdminCrowdAnalytics} />
        <Tab.Screen name="Forecast" component={DemandForecastScreen} />
    </Tab.Navigator>
);

/*
 * Root Navigator
 * --------------
 * Determines which screen set to show based on authentication state.
 * - Loading: Shows specific Loader component.
 * - Unauthenticated: Shows Login/Register.
 * - Authenticated: Shows different tabs based on User Role.
 */
const AppNavigator = () => {
    const { user, loading } = useAuth();

    // 1. Show loader while checking local storage for token
    if (loading) {
        return <Loader />;
    }

    // 2. If no user, show Auth Stack
    if (!user) {
        return (
            <NavigationContainer>
                <AuthStack />
            </NavigationContainer>
        );
    }

    // 3. Route based on user role
    let MainComponent;
    switch (user.role) {
        case USER_ROLES.STUDENT:
            MainComponent = StudentTabs;
            break;
        case USER_ROLES.STAFF:
            MainComponent = StaffTabs;
            break;
        case USER_ROLES.ADMIN:
            MainComponent = AdminTabs;
            break;
        default:
            MainComponent = AuthStack; // Fallback to auth if role is invalid
    }

    return (
        <NavigationContainer>
            <MainComponent />
        </NavigationContainer>
    );
};

export default AppNavigator;
