import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
 * isWeb
 * -----
 * Helper flag to apply platform-specific styles for web vs. native.
 * Web needs extra padding adjustments since SafeArea behaves differently.
 */
const isWeb = Platform.OS === 'web';

/*
 * Common Tab Configuration
 * ------------------------
 * Returns shared styling for all bottom tab navigators.
 * Icons use Ionicons from @expo/vector-icons (included with Expo).
 * Platform-aware height and padding ensures correct rendering on
 * both web browsers and native devices.
 */
const getTabScreenOptions = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: '#ffffff',
    tabBarInactiveTintColor: colors.gray,
    tabBarActiveBackgroundColor: colors.brownie,
    tabBarStyle: {
        backgroundColor: colors.cream,
        borderTopColor: colors.brownieLight,
        borderTopWidth: 1,
        height: isWeb ? 64 : 70,
        paddingBottom: isWeb ? 6 : 10,
        paddingTop: isWeb ? 6 : 8,
    },
    tabBarItemStyle: {
        marginVertical: 4,
        marginHorizontal: 2,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBarLabelStyle: {
        fontSize: isWeb ? 10 : 11,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 2,
    },
});

/*
 * Student Tabs
 * ------------
 * Screens accessible only to STUDENT users.
 * Each tab has a matching Ionicons icon (outline = inactive, filled = active).
 */
const StudentTabs = () => (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
        <Tab.Screen
            name="Home"
            component={StudentHomeScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Book Meal"
            component={BookingScreen}
            options={{
                tabBarLabel: 'Book',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="My Tokens"
            component={MyTokensScreen}
            options={{
                tabBarLabel: 'Tokens',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'ticket' : 'ticket-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Crowd Monitor"
            component={CrowdMonitorScreen}
            options={{
                tabBarLabel: 'Crowd',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Patterns"
            component={CrowdPatternsScreen}
            options={{
                tabBarLabel: 'Trends',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
                ),
            }}
        />
    </Tab.Navigator>
);

/*
 * Staff Tabs
 * ----------
 * Screens accessible only to STAFF users.
 */
const StaffTabs = () => (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
        <Tab.Screen
            name="Dashboard"
            component={StaffHomeScreen}
            options={{
                tabBarLabel: 'Home',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Queue"
            component={QueueManagementScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Crowd"
            component={StaffCrowdDashboard}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
                ),
            }}
        />
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
 * Uses short, clear labels (≤7 chars) so nothing truncates on small screens.
 */
const AdminTabs = () => (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
        <Tab.Screen
            name="Dashboard"
            component={AdminHomeStack}
            options={{
                tabBarLabel: 'Home',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Manage Staff"
            component={ManageStaffScreen}
            options={{
                tabBarLabel: 'Staff',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Manage Menu"
            component={ManageMenuScreen}
            options={{
                tabBarLabel: 'Menu',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'fast-food' : 'fast-food-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Analytics"
            component={AdminCrowdAnalytics}
            options={{
                tabBarLabel: 'Stats',
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Forecast"
            component={DemandForecastScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={size} color={color} />
                ),
            }}
        />
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
