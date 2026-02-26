import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Platform,
    StatusBar,
    TouchableOpacity,
    Animated,
    Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

const HoverCard = ({ children, style, hoverColor = '#E5E7EB' }) => {
    const [isHovered, setIsHovered] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.spring(scale, {
            toValue: 1.02,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    return (
        <Pressable
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={style} // Pass external style (width, margin) to Pressable wrapper
        >
            <Animated.View style={[
                styles.hoverCardInner,
                {
                    transform: [{ scale }],
                    shadowColor: isHovered ? hoverColor : '#000',
                    shadowOpacity: isHovered ? 0.2 : 0.05,
                    shadowRadius: isHovered ? 12 : 8,
                    elevation: isHovered ? 6 : 3,
                    borderColor: isHovered ? hoverColor : 'transparent',
                    borderWidth: 1,
                    backgroundColor: isHovered ? '#FAFAFA' : '#FFFFFF', // Subtle background shift
                }
            ]}>
                {/* Side Lighting Effect */}
                <View style={[styles.sideLighting, { backgroundColor: hoverColor }]} />
                <View style={styles.cardContent}>
                    {children}
                </View>
            </Animated.View>
        </Pressable>
    );
};

/*
 * AdminHomeScreen
 * ---------------
 * The main page for administrators.
 * It provides a quick view of the cafeteria's current state:
 * - Daily booking operational metrics (Today's bookings, active tokens, revenue).
 * - Staff and Student counts.
 * - Detailed breakdown of bookings per time slot to monitor load.
 */
const AdminHomeScreen = ({ navigation }) => {
    const { logout, user } = useAuth(); // Auth context for user info and logout function

    // UI State Management
    const [loading, setLoading] = useState(true);        // Initial load spinner
    const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state

    // Data State
    const [analytics, setAnalytics] = useState(null);    // General stats (revenue, counts)
    const [slotWiseData, setSlotWiseData] = useState([]); // Array of slot performance data
    const [error, setError] = useState('');              // Error message holding

    /**
     * Initial Data Fetch
     */
    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Fetches all dashboard data in parallel.
     * We use Promise.all to ensure both analytics and slot data are ready
     * before rendering, preventing UI layout shifts.
     */
    const fetchData = async () => {
        try {
            setError('');
            // Parallel API calls for efficiency
            const [analyticsRes, slotWiseRes] = await Promise.all([
                adminAPI.getAnalytics(),
                adminAPI.getSlotWiseData(),
            ]);

            setAnalytics(analyticsRes.data);
            setSlotWiseData(slotWiseRes.data);
        } catch (err) {
            // Robust error handling needed for dashboard reliability
            setError(err.response?.data?.message || 'Failed to load analytics');
            console.error('Error fetching analytics:', err);
        } finally {
            // Stop all loading indicators
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Handles pull-to-refresh action.
     * Does NOT set 'loading' to true to avoid full screen spinner,
     * instead relies on scroll view's refresh control.
     */
    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5E3023" />
                <Text style={styles.loadingText}>Loading Dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* 1. Custom Gradient Header */}
            <LinearGradient
                colors={['#2D1B16', '#5E3023']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <MaterialCommunityIcons name="silverware-variant" size={24} color="#5E3023" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>ADMIN DASHBOARD</Text>
                            <Text style={styles.welcomeText}>Welcome back, {user?.name}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5E3023" />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Error Banner */}
                {error ? (
                    <View style={styles.errorBanner}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* 2. Key Metrics Grid */}
                <Text style={styles.sectionHeader}>OVERVIEW TODAY</Text>
                <View style={styles.statsGrid}>
                    {/* Bookings Card */}
                    <HoverCard style={styles.statCardWrapper} hoverColor="#0284C7">
                        <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                            <MaterialCommunityIcons name="calendar-check" size={24} color="#0284C7" />
                        </View>
                        <Text style={styles.statValue}>{analytics?.totalBookingsToday || 0}</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </HoverCard>

                    {/* Active Tokens Card */}
                    <HoverCard style={styles.statCardWrapper} hoverColor="#D97706">
                        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="ticket-confirmation" size={24} color="#D97706" />
                        </View>
                        <Text style={styles.statValue}>{analytics?.activeTokens || 0}</Text>
                        <Text style={styles.statLabel}>Active Tokens</Text>
                    </HoverCard>

                    {/* Served Card */}
                    <HoverCard style={styles.statCardWrapper} hoverColor="#16A34A">
                        <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                            <MaterialCommunityIcons name="account-check" size={24} color="#16A34A" />
                        </View>
                        <Text style={styles.statValue}>{analytics?.servedToday || 0}</Text>
                        <Text style={styles.statLabel}>Served</Text>
                    </HoverCard>

                    {/* Cancelled Card */}
                    <HoverCard style={styles.statCardWrapper} hoverColor="#DC2626">
                        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                            <MaterialCommunityIcons name="cancel" size={24} color="#DC2626" />
                        </View>
                        <Text style={styles.statValue}>{analytics?.cancelledToday || 0}</Text>
                        <Text style={styles.statLabel}>Cancelled</Text>
                    </HoverCard>
                </View>

                {/* 3. Premium Revenue Section */}
                <LinearGradient
                    colors={['#4B2C20', '#6F4E37']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.revenueCard}
                >
                    <View style={styles.revenueHeader}>
                        <View style={styles.revenueIconContainer}>
                            <MaterialCommunityIcons name="currency-inr" size={24} color="#FFD700" />
                        </View>
                        <Text style={styles.revenueTitle}>TOTAL REVENUE</Text>
                    </View>
                    <Text style={styles.revenueAmount}>₹{analytics?.totalRevenue || 0}</Text>
                    <Text style={styles.revenueSubtitle}>Generated from completed orders today</Text>
                </LinearGradient>

                {/* 4. Slot-wise Timeline */}
                <View style={styles.timelineSection}>
                    <View style={styles.sectionHeaderRow}>
                        <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="#5E3023" />
                        <Text style={styles.sectionHeader}>SLOT PERFORMANCE</Text>
                    </View>

                    {slotWiseData.length > 0 ? (
                        slotWiseData.map((slot, index) => {
                            const isLast = index === slotWiseData.length - 1;
                            const progress = slot.totalBookings > 0
                                ? (slot.served / slot.totalBookings) * 100
                                : 0;

                            return (
                                <View key={index} style={styles.timelineItem}>
                                    {/* Left Time Column */}
                                    <View style={styles.timeColumn}>
                                        <Text style={styles.timeText}>{slot.startTime}</Text>
                                        <View style={[styles.timelineLine, isLast && { backgroundColor: 'transparent' }]} />
                                    </View>

                                    {/* Right Content Card */}
                                    <View style={styles.timelineContent}>
                                        <View style={styles.timelineCard}>
                                            <View style={styles.timelineHeader}>
                                                <Text style={styles.slotTitle}>{slot.slotName}</Text>
                                                <View style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: slot.pending > 5 ? '#FEF2F2' : '#F0FDF4' }
                                                ]}>
                                                    <Text style={[
                                                        styles.statusText,
                                                        { color: slot.pending > 5 ? '#DC2626' : '#16A34A' }
                                                    ]}>
                                                        {slot.pending > 5 ? 'High Load' : 'Optimal'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.progressContainer}>
                                                <View style={styles.progressBarBg}>
                                                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                                                </View>
                                                <Text style={styles.progressText}>{Math.round(progress)}% Served</Text>
                                            </View>

                                            <View style={styles.timelineStatsRow}>
                                                <Text style={styles.timelineStat}>
                                                    <Text style={{ fontWeight: '700' }}>{slot.totalBookings}</Text> Total
                                                </Text>
                                                <Text style={styles.timelineStat}>
                                                    <Text style={{ fontWeight: '700', color: '#D97706' }}>{slot.pending}</Text> Pending
                                                </Text>
                                                <Text style={styles.timelineStat}>
                                                    <Text style={{ fontWeight: '700', color: '#16A34A' }}>{slot.served}</Text> Done
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No bookings scheduled for today.</Text>
                        </View>
                    )}
                </View>

                {/* 5. Advanced Features Navigation */}
                <Text style={[styles.sectionHeader, { marginTop: 8 }]}>ADVANCED FEATURES</Text>
                <View style={styles.featuresGrid}>
                    <HoverCard style={styles.featureCardWrapper} hoverColor="#16A34A">
                        <TouchableOpacity
                            style={styles.featureClickArea}
                            onPress={() => navigation.navigate('Sustainability')}
                        >
                            <View style={[styles.featureIconCircle, { backgroundColor: '#DCFCE7' }]}>
                                <MaterialCommunityIcons name="leaf" size={24} color="#16A34A" />
                            </View>
                            <Text style={styles.featureTitle}>Sustainability</Text>
                        </TouchableOpacity>
                    </HoverCard>

                    <HoverCard style={styles.featureCardWrapper} hoverColor="#DC2626">
                        <TouchableOpacity
                            style={styles.featureClickArea}
                            onPress={() => navigation.navigate('WasteTracking')}
                        >
                            <View style={[styles.featureIconCircle, { backgroundColor: '#FEE2E2' }]}>
                                <MaterialCommunityIcons name="trash-can-outline" size={24} color="#DC2626" />
                            </View>
                            <Text style={styles.featureTitle}>Waste Tracking</Text>
                        </TouchableOpacity>
                    </HoverCard>


                    <HoverCard style={styles.featureCardWrapper} hoverColor="#0F172A">
                        <TouchableOpacity
                            style={styles.featureClickArea}
                            onPress={() => navigation.navigate('DataBackup')}
                        >
                            <View style={[styles.featureIconCircle, { backgroundColor: '#E2E8F0' }]}>
                                <MaterialCommunityIcons name="database-sync" size={24} color="#0F172A" />
                            </View>
                            <Text style={styles.featureTitle}>Data Backup</Text>
                        </TouchableOpacity>
                    </HoverCard>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
        fontWeight: '600',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        // Removed border radius for cleaner look
        shadowColor: '#5E3023',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 12,
    },
    scrollView: {
        flex: 1,
        marginTop: -10,
    },
    scrollContent: {
        paddingTop: 24,
        paddingHorizontal: 16,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#991B1B',
        marginLeft: 8,
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '900',
        color: '#9CA3AF', // Gray for subheaders
        marginBottom: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCardWrapper: {
        width: '48%', // Approx half width
    },
    hoverCardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden', // Required for side lighting
        flexDirection: 'row', // Side lighting is row layout
    },
    sideLighting: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 16,
        alignItems: 'flex-start',
    },
    statCard: {
        // Deprecated - replaced by HoverCard styles above
        width: '48%',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    revenueCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
        shadowColor: '#4B2C20',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6,
    },
    revenueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    revenueIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 12,
        marginRight: 10,
    },
    revenueTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
    },
    revenueAmount: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    revenueSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
    },
    timelineSection: {
        paddingBottom: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20, // Spacing between timeline items
    },
    timeColumn: {
        width: 60,
        alignItems: 'center',
        paddingTop: 4,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#5E3023',
        marginBottom: 8,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        borderRadius: 1,
    },
    timelineContent: {
        flex: 1,
    },
    timelineCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    slotTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1F2937',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#6366F1', // Indigo bar
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        textAlign: 'right',
    },
    timelineStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    timelineStat: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    featureCardWrapper: {
        width: '48%',
    },
    featureClickArea: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
    },
    featureIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
    },
});

export default AdminHomeScreen;
