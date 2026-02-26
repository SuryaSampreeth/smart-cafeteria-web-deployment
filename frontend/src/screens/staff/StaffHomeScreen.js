import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/AuthContext';
import { menuAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

/*
 * StaffHomeScreen
 * ---------------
 * Modern dashboard for cafeteria staff with visual capacity indicators
 */
const StaffHomeScreen = () => {
    const { logout, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [slots, setSlots] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            setError('');
            const response = await menuAPI.getAllSlots();
            setSlots(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load slots');
            console.error('Error fetching slots:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSlots();
    };

    const getCapacityColor = (current, capacity) => {
        const percentage = (current / capacity) * 100;
        if (percentage >= 90) return '#EF4444'; // Red
        if (percentage >= 70) return '#F59E0B'; // Amber
        return '#10B981'; // Green
    };

    const getCapacityPercentage = (current, capacity) => {
        return Math.min((current / capacity) * 100, 100);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Header title="Staff Dashboard" onLogout={logout} showLogout={true} />
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color={colors.brownie} />
                </View>
            </View>
        );
    }

    const getSlotImage = (slotName) => {
        const name = slotName.toLowerCase();
        if (name.includes('breakfast')) {
            return { uri: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };
        } else if (name.includes('lunch')) {
            return { uri: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };
        } else if (name.includes('snack')) {
            return { uri: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };
        } else if (name.includes('dinner')) {
            return { uri: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };
        }
        return { uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };
    };

    return (
        <View style={styles.container}>
            <Header title="Staff Dashboard" onLogout={logout} showLogout={true} />
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brownie]} />
                }
            >
                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
                    <Text style={styles.subtitle}>Manage token queues for each meal slot</Text>
                </View>

                {error ? (
                    <View style={styles.errorCard}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Slots Grid */}
                {slots.map((slot) => {
                    const capacityPercentage = getCapacityPercentage(slot.currentBookings, slot.capacity);
                    const capacityColor = getCapacityColor(slot.currentBookings, slot.capacity);

                    return (
                        <View key={slot._id} style={styles.slotCard}>
                            {/* Card Header with Image Background */}
                            <ImageBackground
                                source={getSlotImage(slot.name)}
                                style={styles.cardHeaderImage}
                                imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                            >
                                <View style={styles.cardHeaderOverlay}>
                                    <View style={styles.headerLeft}>
                                        <MaterialCommunityIcons name="food" size={24} color="#FFF" />
                                        <View style={styles.headerText}>
                                            <Text style={styles.slotName}>{slot.name}</Text>
                                            <Text style={styles.slotTime}>
                                                {slot.startTime} - {slot.endTime}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Status Badge */}
                                    <View style={[styles.statusBadge, { backgroundColor: slot.isActive ? '#10B981' : '#6B7280' }]}>
                                        <Text style={styles.statusText}>
                                            {slot.isActive ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                </View>
                            </ImageBackground>

                            {/* Card Body */}
                            <View style={styles.cardBody}>
                                {/* Stats Row */}
                                <View style={styles.statsRow}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statNumber}>{slot.currentBookings}</Text>
                                        <Text style={styles.statLabel}>Current</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statBox}>
                                        <Text style={styles.statNumber}>{slot.capacity}</Text>
                                        <Text style={styles.statLabel}>Capacity</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statBox}>
                                        <Text style={[styles.statNumber, { color: capacityColor }]}>
                                            {capacityPercentage.toFixed(0)}%
                                        </Text>
                                        <Text style={styles.statLabel}>Filled</Text>
                                    </View>
                                </View>

                                {/* Capacity Progress Bar */}
                                <View style={styles.progressSection}>
                                    <Text style={styles.progressLabel}>Capacity</Text>
                                    <View style={styles.progressBarContainer}>
                                        <View style={styles.progressBarBackground}>
                                            <LinearGradient
                                                colors={[capacityColor, capacityColor + 'CC']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[styles.progressBarFill, { width: `${capacityPercentage}%` }]}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Instructions Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <MaterialCommunityIcons name="information" size={24} color="#3B82F6" />
                        <Text style={styles.infoTitle}>Quick Guide</Text>
                    </View>
                    <View style={styles.infoContent}>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color="#10B981" />
                            <Text style={styles.infoText}>Go to "Queue" tab to manage tokens</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color="#10B981" />
                            <Text style={styles.infoText}>Select a slot to view pending tokens</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color="#10B981" />
                            <Text style={styles.infoText}>Call next token in FIFO order</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color="#10B981" />
                            <Text style={styles.infoText}>Mark tokens as served when complete</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    spinnerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    welcomeSection: {
        padding: 20,
        paddingBottom: 10,
    },
    welcome: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorText: {
        flex: 1,
        marginLeft: 12,
        color: '#991B1B',
        fontSize: 14,
    },
    slotCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardHeaderImage: {
        width: '100%',
        height: 120,
    },
    cardHeaderOverlay: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerText: {
        marginLeft: 12,
        flex: 1,
    },
    slotName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    slotTime: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cardBody: {
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    progressSection: {
        marginTop: 8,
    },
    progressLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '600',
    },
    progressBarContainer: {
        width: '100%',
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 10,
    },
    infoContent: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 10,
        flex: 1,
    },
});

export default StaffHomeScreen;
