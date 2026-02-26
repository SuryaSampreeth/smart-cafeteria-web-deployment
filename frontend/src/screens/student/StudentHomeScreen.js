import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ImageBackground, Pressable, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

/**
 * StudentHomeScreen Component
 * 
 * This is the main dashboard for students. It provides:
 * 1. A welcome message with the user's name.
 * 2. Key statistics: Number of active tokens and total bookings.
 * 3. Quick navigation buttons to Book Meal, My Tokens, and Booking History.
 * 4. A brief "How it works" guide.
 * 
 * It serves as the central hub for all student-related activities in the app.
 */

const HoverableGradientStatCard = ({ value, label }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isHovered, setIsHovered] = useState(false);

    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.spring(scaleAnim, {
            toValue: 1.05,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    return (
        <Pressable
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={{ flex: 1, marginHorizontal: 4 }}
        >
            <Animated.View
                style={[
                    styles.statCardContainer,
                    {
                        transform: [{ scale: scaleAnim }],
                        borderColor: isHovered ? colors.brownie : 'rgba(122, 74, 58, 0.2)', // Brownie border on hover
                        borderWidth: isHovered ? 2 : 1,
                        elevation: isHovered ? 8 : 3,
                        shadowOpacity: isHovered ? 0.3 : 0.1,
                    }
                ]}
            >
                <LinearGradient
                    // Gradient from Cream (#F3E9DC) to a visibly warmer/darker Brownie tint (#C9A897)
                    // This creates a strong "Coffee Cream" gradient as requested.
                    colors={[colors.cream, '#C9A897']}
                    style={styles.statCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.statNumber}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
};

const StudentHomeScreen = () => {
    // Access auth context for logout and user details
    const { logout, user } = useAuth();
    const navigation = useNavigation();

    // State for pull-to-refresh functionality
    const [refreshing, setRefreshing] = useState(false);

    // State for dashboard statistics
    const [stats, setStats] = useState({ activeTokens: 0, totalBookings: 0 });

    // Fetch stats on component mount
    useEffect(() => {
        fetchStats();
    }, []);

    /**
     * Fetches booking statistics from the backend.
     * Calculates active tokens (not served or cancelled) and total bookings.
     */
    const fetchStats = async () => {
        try {
            // Get all bookings for the current user
            const response = await bookingAPI.getMyBookings();
            const bookings = response.data;

            // Filter for active bookings (Pending or Serving)
            const active = bookings.filter(b => b.status === 'pending' || b.status === 'serving').length;

            // Update state
            setStats({ activeTokens: active, totalBookings: bookings.length });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * Handles pull-to-refresh action.
     */
    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    /**
     * QuickActionCard Component
     * Renders a card with a background image, gradient overlay, and hover effect.
     */
    const QuickActionCard = ({ title, description, emoji, onPress, imageSource }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <Pressable
                style={[
                    styles.actionCard,
                    isHovered && {
                        transform: [{ scale: 1.05 }, { translateY: -5 }], // Pop up and float
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8
                    }
                ]}
                onPress={onPress}
                onHoverIn={() => setIsHovered(true)}
                onHoverOut={() => setIsHovered(false)}
            >
                <ImageBackground
                    source={imageSource}
                    style={styles.cardBackground}
                    imageStyle={styles.cardBackgroundStyle}
                >
                    <LinearGradient
                        // Gradient: Static transparent -> Black/Brown at bottom
                        // No color shift on hover, just scale
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                        locations={[0, 0.5, 1]}
                        style={styles.gradientOverlay}
                    >

                        <Text style={styles.actionTitle}>{title}</Text>
                        <Text style={styles.actionDescription}>{description}</Text>
                    </LinearGradient>
                </ImageBackground>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            {/* Standard Header with Logout button */}
            <Header title="Student Dashboard" onLogout={logout} showLogout={true} />

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brownie]} />
                }
            >
                <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
                <Text style={styles.subtitle}>Manage your cafeteria bookings</Text>

                {/* Dashboard Statistics Cards */}
                <View style={styles.statsContainer}>
                    {/* Active Tokens Card */}
                    <HoverableGradientStatCard
                        value={stats.activeTokens}
                        label="Active Tokens"
                    />

                    {/* Total Bookings Card */}
                    <HoverableGradientStatCard
                        value={stats.totalBookings}
                        label="Total Bookings"
                    />
                </View>

                {/* Quick Action Buttons */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.quickActionsContainer}>
                    {/* Book Meal */}
                    <QuickActionCard
                        title="Book Meal"
                        description="Order now"
                        emoji="🍽️"
                        onPress={() => navigation.navigate('Book Meal')}
                        // Use a local image or a placeholder URL from Unsplash
                        imageSource={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
                    />

                    {/* My Tokens */}
                    <QuickActionCard
                        title="My Tokens"
                        description="View active"
                        emoji="🎫"
                        onPress={() => navigation.navigate('My Tokens')}
                        imageSource={{ uri: 'https://images.unsplash.com/photo-1645777572334-1256aa490fdb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dG9rZW5zJTIwd2l0aCUyMG51bWJlcnxlbnwwfHwwfHx8MA%3D%3D' }} // Ticket/Queue concept
                    />

                    {/* Start Booking History (Profile) */}
                    <QuickActionCard
                        title="History"
                        description="Past orders"
                        emoji="📜"
                        onPress={() => navigation.navigate('Profile')}
                        imageSource={{ uri: 'https://plus.unsplash.com/premium_photo-1683872921964-25348002a392?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }} // Receipt/List concept
                    />
                </View>

                {/* Removed "How it works" section as requested */}
            </ScrollView>
        </View>
    );
};

// Styles...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    welcome: {
        ...typography.h2,
        color: colors.brownie,
        marginBottom: 4,
    },
    subtitle: {
        ...typography.body,
        color: colors.gray,
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCardContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden', // Ensure gradient respects border radius
        backgroundColor: colors.cream, // Fallback
        shadowColor: colors.brownie,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    statCardGradient: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    statNumber: {
        ...typography.h1,
        color: colors.brownie,
        fontWeight: 'bold',
    },
    statLabel: {
        ...typography.caption,
        color: colors.gray,
        marginTop: 4,
        textAlign: 'center',
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.brownie,
        marginBottom: 12,
        marginTop: 10,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionCard: {
        width: '31%', // Fits 3 in a row
        aspectRatio: 0.8, // Slightly taller than wide
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.brownieLight + '30',
        shadowColor: colors.brownie,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    cardBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cardBackgroundStyle: {
        borderRadius: 12,
    },
    gradientOverlay: {
        height: '100%',
        justifyContent: 'flex-end',
        padding: 10,
    },
    actionIconContainer: {
        marginBottom: 8,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: 8,
    },
    actionEmoji: {
        fontSize: 24,
    },
    actionTitle: {
        ...typography.caption,
        color: colors.white,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 12,
    },
    actionDescription: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
});

export default StudentHomeScreen;