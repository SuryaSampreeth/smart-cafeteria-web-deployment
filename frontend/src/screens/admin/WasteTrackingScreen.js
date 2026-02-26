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
    Animated,
    Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';

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
            style={style}
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
                    backgroundColor: isHovered ? '#FAFAFA' : '#FFFFFF',
                }
            ]}>
                <View style={[styles.sideLighting, { backgroundColor: hoverColor }]} />
                <View style={styles.cardContent}>
                    {children}
                </View>
            </Animated.View>
        </Pressable>
    );
};

const WasteTrackingScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setError('');
            const res = await adminAPI.getWasteTracking();
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load waste tracking data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5E3023" />
                <Text style={styles.loadingText}>Loading Waste Metrics...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#2D1B16', '#5E3023']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.logoContainer}>
                            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#5E3023" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>WASTE TRACKING MONITOR</Text>
                            <Text style={styles.welcomeText}>Today's Waste Metrics</Text>
                        </View>
                    </View>
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
                {error ? (
                    <View style={styles.errorBanner}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <Text style={styles.sectionHeader}>WASTE OVERVIEW</Text>
                <View style={styles.statsGrid}>
                    <HoverCard style={styles.statCardWrapper} hoverColor="#DC2626">
                        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                            <MaterialCommunityIcons name="food-off" size={24} color="#DC2626" />
                        </View>
                        <Text style={styles.statValue}>{data?.totalTokensWasted || 0}</Text>
                        <Text style={styles.statLabel}>Tokens Wasted</Text>
                    </HoverCard>

                    <HoverCard style={styles.statCardWrapper} hoverColor="#D97706">
                        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="currency-inr" size={24} color="#D97706" />
                        </View>
                        <Text style={styles.statValue}>₹{data?.totalWasteValue || 0}</Text>
                        <Text style={styles.statLabel}>Est. Revenue Loss</Text>
                    </HoverCard>
                </View>

                <View style={styles.timelineSection}>
                    <View style={styles.sectionHeaderRow}>
                        <MaterialCommunityIcons name="list-status" size={20} color="#5E3023" />
                        <Text style={styles.sectionHeader}>WASTED ITEMS BREAKDOWN</Text>
                    </View>

                    {data?.wastedItems && data.wastedItems.length > 0 ? (
                        data.wastedItems.map((item, index) => (
                            <View key={index} style={styles.timelineItem}>
                                <View style={styles.timelineContent}>
                                    <View style={styles.timelineCard}>
                                        <View style={styles.timelineHeader}>
                                            <Text style={styles.slotTitle}>{item.name}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2' }]}>
                                                <Text style={[styles.statusText, { color: '#DC2626' }]}>High Waste</Text>
                                            </View>
                                        </View>
                                        <View style={styles.timelineStatsRow}>
                                            <Text style={styles.timelineStat}>
                                                <Text style={{ fontWeight: '700' }}>{item.quantity}</Text> Qty Wasted
                                            </Text>
                                            <Text style={styles.timelineStat}>
                                                <Text style={{ fontWeight: '700', color: '#D97706' }}>₹{item.value}</Text> Lost
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No waste recorded for today. Great job!</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    loadingText: { marginTop: 10, color: '#6B7280', fontWeight: '600' },
    headerGradient: { paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 24, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    logoContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    headerTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4 },
    welcomeText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
    scrollView: { flex: 1, marginTop: -10 },
    scrollContent: { paddingTop: 24, paddingHorizontal: 16 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FECACA' },
    errorText: { color: '#991B1B', marginLeft: 8, fontSize: 13, fontWeight: '600', flex: 1 },
    sectionHeader: { fontSize: 13, fontWeight: '900', color: '#9CA3AF', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCardWrapper: { width: '48%' },
    hoverCardInner: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', flexDirection: 'row' },
    sideLighting: { width: 6, height: '100%' },
    cardContent: { flex: 1, padding: 16, alignItems: 'flex-start' },
    iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    timelineSection: { paddingBottom: 20 },
    timelineItem: { flexDirection: 'row', marginBottom: 20 },
    timelineContent: { flex: 1 },
    timelineCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    slotTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700' },
    timelineStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    timelineStat: { fontSize: 12, color: '#6B7280' },
    emptyState: { padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
    emptyStateText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' }
});

export default WasteTrackingScreen;
