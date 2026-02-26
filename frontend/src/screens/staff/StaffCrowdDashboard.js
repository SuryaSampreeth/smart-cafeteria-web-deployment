import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Dimensions,
    Animated,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import CrowdLevelIndicator from '../../components/CrowdLevelIndicator';
import api from '../../services/api';

const { width } = Dimensions.get('window');

/*
 * StaffCrowdDashboard
 * -------------------
 * High-Impact Visualization for Real-Time Crowd Monitoring.
 */

const HoverCard = ({ children, baseStyle, hoverColor }) => {
    const [isHovered, setIsHovered] = useState(false);
    const translateY = useRef(new Animated.Value(0)).current;

    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.timing(translateY, {
            toValue: -8,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    return (
        <Pressable
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={{ marginBottom: baseStyle.marginBottom }}
        >
            <Animated.View style={[
                baseStyle,
                {
                    marginBottom: 0,
                    transform: [{ translateY }],
                    shadowColor: isHovered ? hoverColor : '#000',
                    shadowOpacity: isHovered ? 0.4 : 0.08, // Increased opacity on hover
                    shadowRadius: isHovered ? 12 : 10,
                    elevation: isHovered ? 8 : 3,
                    borderColor: isHovered ? hoverColor : 'transparent',
                    borderWidth: isHovered ? 1.5 : 0,
                    backgroundColor: '#FFFFFF', // Ensure background is white for the color tint to work if we added it, but shadow is main effect
                }
            ]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

const StaffCrowdDashboard = () => {
    // State for dashboard metrics
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);

    const AUTO_REFRESH_INTERVAL = 20000;

    const fetchDashboardData = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError(null);
            const response = await api.getStaffCrowdDashboard();
            if (response.data && response.data.success) {
                setDashboardData(response.data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => {
            fetchDashboardData(false);
        }, AUTO_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    const formatLastUpdated = () => {
        if (!lastUpdated) return '';
        const now = new Date();
        const diffSeconds = Math.floor((now - lastUpdated) / 1000);
        if (diffSeconds < 10) return 'Just now';
        return `${Math.floor(diffSeconds / 60)}m ago`;
    };

    if (loading && !dashboardData) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5E3023" />
                <Text style={styles.loadingText}>Loading Dashboard...</Text>
            </View>
        );
    }

    const summary = dashboardData?.summary || {};
    const slots = dashboardData?.slots || [];
    const activeAlerts = dashboardData?.activeAlerts || [];

    return (
        <View style={styles.container}>
            {/* 1. High-Impact Header with Pattern Overlay Effect */}
            <LinearGradient
                colors={['#2D1B16', '#5E3023']} // Deep rich brown gradient
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
                            <Text style={styles.title}>CROWD ANALYTICS</Text>
                            <View style={styles.liveTagContainer}>
                                <View style={styles.liveDotPulsing} />
                                <Text style={styles.subtitle}>LIVE MONITORING</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={onRefresh}
                        disabled={refreshing}
                    >
                        <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
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
                {/* 2. Key Metrics - Glassmorphic Cards with Gradients */}
                <View style={styles.metricsRow}>
                    {/* Active Tokens Card */}
                    <LinearGradient
                        colors={['#FFFFFF', '#F0F9FF']}
                        style={styles.metricCard}
                    >
                        <LinearGradient
                            colors={['#0EA5E9', '#0284C7']}
                            style={styles.iconCircle}
                        >
                            <MaterialCommunityIcons name="account-group" size={24} color="#FFF" />
                        </LinearGradient>
                        <View style={styles.metricTextContainer}>
                            <Text style={styles.metricValue}>{summary.totalActiveBookings || 0}</Text>
                            <Text style={styles.metricLabel}>ACTIVE TOKENS</Text>
                        </View>
                    </LinearGradient>

                    {/* Occupancy Card */}
                    <LinearGradient
                        colors={['#FFFFFF', '#F0FDF4']}
                        style={styles.metricCard}
                    >
                        <LinearGradient
                            colors={['#22C55E', '#16A34A']}
                            style={styles.iconCircle}
                        >
                            <MaterialCommunityIcons name="chart-pie" size={24} color="#FFF" />
                        </LinearGradient>
                        <View style={styles.metricTextContainer}>
                            <Text style={styles.metricValue}>{summary.averageOccupancy || 0}%</Text>
                            <Text style={styles.metricLabel}>OCCUPANCY</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* 3. Alerts Section with Glow Effect */}
                {activeAlerts.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeaderRow}>
                            <MaterialCommunityIcons name="alert-octagon" size={20} color="#DC2626" />
                            <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>CRITICAL ALERTS</Text>
                        </View>
                        {activeAlerts.map((alert, index) => (
                            <View key={index} style={styles.alertCardGlow}>
                                <LinearGradient
                                    colors={['#FEF2F2', '#FFF']}
                                    style={styles.alertCardInner}
                                >
                                    <View style={styles.alertIconBar} />
                                    <View style={styles.alertContent}>
                                        <Text style={styles.alertSlotName}>{alert.slotName}</Text>
                                        <Text style={styles.alertMsg}>{alert.message}</Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        ))}
                    </View>
                )}

                {/* 4. Insights Section - Tech/Data Feel */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#D97706" />
                        <Text style={[styles.sectionTitle, { color: '#D97706' }]}>AI RECOMMENDATIONS</Text>
                    </View>
                    {slots.map((slot, index) => {
                        if (slot.isActive === false) return null; // Skip inactive slots for recommendations

                        let recommendation = '';
                        let accentColor = '#10B981';
                        if (slot.occupancyRate >= 90) {
                            accentColor = '#DC2626';
                            recommendation = '⚠️ Overload: Open additional counters immediately.';
                        } else if (slot.occupancyRate >= 70) {
                            accentColor = '#F59E0B';
                            recommendation = '⚡ High Traffic: Optimize queue flow.';
                        } else {
                            recommendation = '✅ Optimal Flow: Maintain current pace.';
                        }

                        return (
                            <HoverCard key={index} baseStyle={styles.insightCard} hoverColor={accentColor}>
                                <View style={[styles.insightAccent, { backgroundColor: accentColor }]} />
                                <View style={styles.insightContent}>
                                    <Text style={styles.insightSlot}>{slot.slotName}</Text>
                                    <Text style={styles.insightText}>{recommendation}</Text>
                                </View>
                            </HoverCard>
                        );
                    })}
                </View>

                {/* 5. Live Slots - Advanced Cards */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionMainTitle}>LIVE SLOT STATUS</Text>
                    {slots.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No active slots available</Text>
                        </View>
                    ) : (

                        slots.map((slot, index) => {
                            // Handle Inactive Slots
                            if (slot.isActive === false) {
                                return (
                                    <View key={index} style={[styles.slotCardAdvanced, styles.inactiveCard]}>
                                        <View style={styles.slotCardGradient}>
                                            <View style={styles.slotHeader}>
                                                <Text style={[styles.slotNameLarge, styles.inactiveText]}>{slot.slotName}</Text>
                                                <View style={styles.inactiveBadge}>
                                                    <Text style={styles.inactiveBadgeText}>NOT ACTIVE</Text>
                                                </View>
                                            </View>
                                            <View style={styles.statsGrid}>
                                                <View style={styles.statBox}>
                                                    <Text style={styles.statLabel}>STATUS</Text>
                                                    <Text style={styles.statValueInactive}>Closed</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            }

                            let hoverColor = '#10B981'; // Default Green
                            if (slot.occupancyRate >= 90) hoverColor = '#DC2626'; // Red
                            else if (slot.occupancyRate >= 70) hoverColor = '#F59E0B'; // Orange

                            return (
                                <HoverCard key={index} baseStyle={styles.slotCardAdvanced} hoverColor={hoverColor}>
                                    <LinearGradient
                                        colors={['#FFFFFF', '#F9FAFB']}
                                        style={styles.slotCardGradient}
                                    >
                                        <View style={styles.slotHeader}>
                                            <Text style={styles.slotNameLarge}>{slot.slotName}</Text>
                                            <View style={styles.capacityBadge}>
                                                <MaterialCommunityIcons name="human-queue" size={14} color="#6B7280" />
                                                <Text style={styles.capacityText}>{slot.activeBookings}/{slot.totalCapacity}</Text>
                                            </View>
                                        </View>

                                        <CrowdLevelIndicator
                                            level={slot.crowdLevel}
                                            occupancyRate={slot.occupancyRate}
                                            slotName={slot.slotName}
                                            size="medium"
                                        />

                                        <View style={styles.statsGrid}>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statLabel}>WAIT TIME</Text>
                                                <Text style={styles.statValue}>{slot.avgWaitTime} min</Text>
                                            </View>
                                            <View style={styles.verticalDivider} />
                                            <View style={styles.statBox}>
                                                <Text style={styles.statLabel}>STATUS</Text>
                                                <Text style={[styles.statValue, {
                                                    color: slot.occupancyRate > 80 ? '#DC2626' : '#059669'
                                                }]}>
                                                    {slot.occupancyRate > 80 ? 'Heavy' : 'Normal'}
                                                </Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </HoverCard>
                            );
                        })
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    centerContainer: {
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
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    },
    liveTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    liveDotPulsing: {
        width: 8,
        height: 8,
        backgroundColor: '#EF4444',
        borderRadius: 4,
        marginRight: 6,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    subtitle: {
        color: '#E5E7EB',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    refreshButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 12,
    },
    logoContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scrollView: {
        flex: 1,
        marginTop: -10, // Slight overlap for design
    },
    scrollContent: {
        paddingTop: 20,
        paddingHorizontal: 16,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    metricCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        alignItems: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    metricTextContainer: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionMainTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#374151',
        marginBottom: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    alertCardGlow: {
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    alertCardInner: {
        flexDirection: 'row',
        borderRadius: 16,
        overflow: 'hidden',
    },
    alertIconBar: {
        width: 6,
        backgroundColor: '#DC2626',
    },
    alertContent: {
        flex: 1,
        padding: 16,
    },
    alertSlotName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#991B1B',
        marginBottom: 4,
    },
    alertMsg: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
        lineHeight: 18,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    insightAccent: {
        width: 6,
    },
    insightContent: {
        flex: 1,
        padding: 14,
    },
    insightSlot: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    insightText: {
        fontSize: 13,
        color: '#4B5563',
    },
    slotCardAdvanced: {
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        backgroundColor: '#fff',
    },
    slotCardGradient: {
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    slotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    slotNameLarge: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    capacityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    capacityText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    statsGrid: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#9CA3AF',
        fontWeight: '600',
    },
    inactiveCard: {
        backgroundColor: '#F3F4F6',
        opacity: 0.8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inactiveText: {
        color: '#9CA3AF',
    },
    inactiveBadge: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    inactiveBadgeText: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statValueInactive: {
        fontSize: 16,
        fontWeight: '800',
        color: '#9CA3AF',
    },
});

export default StaffCrowdDashboard;