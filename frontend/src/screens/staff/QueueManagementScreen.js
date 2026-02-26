import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { staffAPI, menuAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { BOOKING_STATUS } from '../../utils/constants';

/*
 * QueueManagementScreen
 * ---------------------
 * The operational hub for staff members.
 * 
 * Core Functions:
 * 1. View live queue for a specific slot (filtered by selector).
 * 2. Call Next: Auto-assigns the next pending token to the staff member.
 * 3. Mark Served: Completes the order workflow.
 * 
 * Note: Handles platform differences for Alerts (Web vs Native).
 */
const QueueManagementScreen = () => {
    // Component State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data State
    const [slots, setSlots] = useState([]);          // List of available slots
    const [selectedSlot, setSelectedSlot] = useState(''); // Currently viewed slot ID
    const [queue, setQueue] = useState([]);          // List of booking objects (tokens) in the queue

    // UI Feedback
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // Track which specific action is loading (ID or 'callNext')

    /**
     * Load slots on mount
     */
    useEffect(() => {
        fetchSlots();
    }, []);

    /**
     * Reload queue whenever the selected slot changes
     */
    useEffect(() => {
        if (selectedSlot) {
            fetchQueue();
        }
    }, [selectedSlot]);

    const fetchSlots = async () => {
        try {
            const response = await menuAPI.getAllSlots();
            setSlots(response.data);
            // Auto-select the first slot if none selected
            if (response.data.length > 0 && !selectedSlot) {
                setSelectedSlot(response.data[0]._id);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load slots');
            console.error('Error fetching slots:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchQueue = async () => {
        if (!selectedSlot) return;

        try {
            setError('');
            const response = await staffAPI.getQueue(selectedSlot);
            setQueue(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load queue');
            console.error('Error fetching queue:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchQueue();
    };

    /**
     * Calls the next student in the FIFO queue.
     * Updates the booking status from PENDING -> SERVING.
     */
    const handleCallNext = async () => {
        if (!selectedSlot) return;

        // Set actionLoading to 'callNext' to show spinner on the big button
        setActionLoading('callNext');
        try {
            const response = await staffAPI.callNext(selectedSlot);
            const message = `Token ${response.data.tokenNumber} for ${response.data.studentId.name} is now being served.`;

            // Platform-specific alert handling
            if (Platform.OS === 'web') {
                window.alert('Token Called\n\n' + message);
            } else {
                Alert.alert('Token Called', message, [{ text: 'OK' }]);
            }
            fetchQueue(); // Refresh list to show new status
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to call next token';
            if (Platform.OS === 'web') {
                window.alert('Error: ' + errorMsg);
            } else {
                Alert.alert('Error', errorMsg);
            }
        } finally {
            setActionLoading(null);
        }
    };

    /**
     * Marks a specific token as completed.
     * Updates status from SERVING -> SERVED.
     */
    const handleMarkServed = async (bookingId, tokenNumber) => {
        const confirmMessage = `Mark token ${tokenNumber} as completed?`;

        // Wrapper function to execute the API call
        const executeMarkServed = async () => {
            setActionLoading(bookingId); // Show spinner only on this specific button
            try {
                await staffAPI.markServed(bookingId);
                // Success feedback
                const msg = `Success! Token ${tokenNumber} marked as completed`;
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Success', msg);
                fetchQueue();
            } catch (err) {
                const msg = 'Error: ' + (err.response?.data?.message || 'Failed to mark as completed');
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
            } finally {
                setActionLoading(null);
            }
        };

        // Confirmation Dialog
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMessage)) {
                executeMarkServed();
            }
        } else {
            Alert.alert(
                'Confirm',
                confirmMessage,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Mark Completed', onPress: executeMarkServed },
                ]
            );
        }
    };

    /**
     * Helper: Maps booking status to UI colors
     */
    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATUS.PENDING: return colors.warning; // Yellow/Orange
            case BOOKING_STATUS.SERVING: return colors.info;    // Blue
            case BOOKING_STATUS.SERVED: return colors.success;  // Green
            default: return colors.gray;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brownie} />
            </View>
        );
    }

    // Client-side calculation of queue stats
    const pendingCount = queue.filter((t) => t.status === BOOKING_STATUS.PENDING).length;
    const servingCount = queue.filter((t) => t.status === BOOKING_STATUS.SERVING).length;

    // Filter lists for display
    const currentServing = queue.filter((t) => t.status === BOOKING_STATUS.SERVING);
    const waitingQueue = queue.filter((t) => t.status === BOOKING_STATUS.PENDING);

    return (
        <View style={styles.container}>
            {/* Enhanced Gradient Header */}
            <LinearGradient
                colors={['#5E3023', '#3D1F17']} // Brownie to Dark Brownie
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.title}>Queue Management</Text>
                            <Text style={styles.subtitle}>Real-time token tracking</Text>
                        </View>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    </View>

                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerLabelRow}>
                            <MaterialCommunityIcons name="calendar-clock" size={18} color="#6B7280" />
                            <Text style={styles.pickerLabel}>Active Meal Slot</Text>
                        </View>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedSlot}
                                onValueChange={(itemValue) => setSelectedSlot(itemValue)}
                                style={styles.picker}
                            >
                                {slots.map((slot) => (
                                    <Picker.Item
                                        key={slot._id}
                                        label={`${slot.name} (${slot.startTime} - ${slot.endTime})`}
                                        value={slot._id}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Enhanced Stats Pills with Icons */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statPill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
                            <View>
                                <Text style={[styles.statNumber, { color: '#D97706' }]}>{pendingCount}</Text>
                                <Text style={[styles.statLabel, { color: '#B45309' }]}>Waiting</Text>
                            </View>
                        </View>
                        <View style={[styles.statPill, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
                            <MaterialCommunityIcons name="account-clock" size={20} color="#2563EB" />
                            <View>
                                <Text style={[styles.statNumber, { color: '#2563EB' }]}>{servingCount}</Text>
                                <Text style={[styles.statLabel, { color: '#1E40AF' }]}>Serving</Text>
                            </View>
                        </View>
                        <View style={[styles.statPill, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                            <MaterialCommunityIcons name="account-group" size={20} color="#059669" />
                            <View>
                                <Text style={[styles.statNumber, { color: '#059669' }]}>{queue.length}</Text>
                                <Text style={[styles.statLabel, { color: '#047857' }]}>Total</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brownie]} />
                }
            >
                {error ? (
                    <Card style={styles.errorCard}>
                        <Text style={styles.errorText}>{error}</Text>
                    </Card>
                ) : null}

                {/* NOW SERVING HERO SECTION */}
                {currentServing.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>NOW SERVING</Text>
                        {currentServing.map((token) => (
                            <View key={token._id} style={styles.heroCard}>
                                <View style={styles.heroHeader}>
                                    <Text style={styles.heroTokenNumber}>{token.tokenNumber}</Text>
                                    <View style={styles.heroStatusBadge}>
                                        <Text style={styles.heroStatusText}>IN PROGRESS</Text>
                                    </View>
                                </View>
                                <Text style={styles.heroName}>{token.studentId.name}</Text>
                                <Text style={styles.heroDetails}>
                                    {token.items.map((item) => `${item.quantity}x ${item.menuItemId.name}`).join(', ')}
                                </Text>

                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => handleMarkServed(token._id, token.tokenNumber)}
                                    disabled={actionLoading === token._id}
                                >
                                    {actionLoading === token._id ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                    ) : (
                                        <Text style={styles.completeButtonText}>✓ Mark Completed</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* UP NEXT LIST */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>UP NEXT</Text>
                        {pendingCount > 0 && actionLoading !== 'callNext' && (
                            <TouchableOpacity style={styles.callNextButton} onPress={handleCallNext} disabled={actionLoading === 'callNext'}>
                                <Text style={styles.callNextButtonText}>Call Next Student</Text>
                                <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
                            </TouchableOpacity>
                        )}
                        {actionLoading === 'callNext' && <ActivityIndicator size="small" color="#5E3023" />}
                    </View>

                    {waitingQueue.length > 0 ? (
                        waitingQueue.map((token) => (
                            <View key={token._id} style={styles.queueItem}>
                                <View style={styles.queueItemLeft}>
                                    <View style={styles.queueTokenBadge}>
                                        <Text style={styles.queueTokenNumber}>{token.tokenNumber}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.queueName}>{token.studentId.name}</Text>
                                        <Text style={styles.queueWaitTime}>Est. wait: {token.estimatedWaitTime} min</Text>
                                    </View>
                                </View>
                                <View style={styles.queueItemRight}>
                                    <Text style={styles.queuePosition}>Pos: #{token.queuePosition}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyQueue}>
                            <Text style={styles.emptyQueueText}>No students waiting in line.</Text>
                        </View>
                    )}
                </View>

                {/* Big FAB if list is long and people are waiting
                {pendingCount > 0 && waitingQueue.length > 3 && (
                     <Button
                         title="📢 Call Next"
                         onPress={handleCallNext}
                         loading={actionLoading === 'callNext'}
                         style={styles.floatingButton}
                     />
                )} */}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Brighter, cleaner background
    },
    headerGradient: {
        borderBottomWidth: 1,
        borderBottomColor: '#3D1F17',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2, // Slightly stronger shadow for compact feel
        shadowRadius: 6,
        elevation: 4,
        paddingBottom: 16, // Reduced padding
    },
    header: {
        padding: 16, // Reduced overall padding
        paddingBottom: 4,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Align center for compact layout
        marginBottom: 12, // Tighter spacing
    },
    title: {
        fontSize: 20, // Reduced from 28
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
        marginBottom: 0,
    },
    subtitle: {
        fontSize: 12, // Reduced from 14
        color: '#E5E7EB',
        fontWeight: '500',
        opacity: 0.8,
        marginTop: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 8, // Thinner pill
        paddingVertical: 4,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    liveDot: {
        width: 6, // Smaller dot
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    liveText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    pickerContainer: {
        marginBottom: 12, // Much tighter spacing
    },
    pickerLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    pickerLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#D1D5DB',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pickerWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    picker: {
        width: '100%',
        height: 50,
        backgroundColor: 'transparent',
        color: '#111827',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8, // Tighter gap
    },
    statPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8, // Reduced vertical padding
        paddingHorizontal: 8,
        borderRadius: 12,
        gap: 8,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 18, // Reduced from 22
        fontWeight: '800',
        lineHeight: 20,
    },
    statLabel: {
        fontSize: 9, // Reduced from 10
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    callNextButton: {
        backgroundColor: '#5E3023',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#5E3023',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    callNextButtonText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
    },

    heroCard: {
        backgroundColor: '#FFFFFF', // Clean white background
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#2563EB', // Blue glow
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25, // Soft glow
        shadowRadius: 16, // Wide radius
        elevation: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE', // Light blue border
        borderLeftWidth: 6,
        borderLeftColor: '#2563EB', // Strong left accent
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    heroTokenNumber: {
        fontSize: 42, // Reduced slightly but still huge
        fontWeight: '900',
        color: '#4B2618', // Darker brown for contrast
        letterSpacing: -1,
    },
    heroStatusBadge: {
        backgroundColor: '#FFFFFF', // White badge on cream bg
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    heroStatusText: {
        color: '#0284C7',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    heroName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    heroDetails: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 20,
        fontWeight: '500',
    },
    completeButton: {
        backgroundColor: '#10B981',
        paddingVertical: 12, // Compact button
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#059669', // Darker green shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, // Subtle glow
        shadowRadius: 8,
        elevation: 4,
    },
    completeButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 14, // Compact padding
        borderRadius: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    queueItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    queueTokenBadge: {
        backgroundColor: '#F3F4F6', // Light gray bg for tokens
        width: 48, // Smaller badge
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    queueTokenNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4B5563', // Dark gray text
    },
    queueName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 2,
    },
    queueWaitTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    queueItemRight: {
        alignItems: 'flex-end',
    },
    queuePosition: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D1D5DB',
    },
    emptyQueue: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    emptyQueueText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
    errorCard: {
        backgroundColor: '#FEF2F2',
        borderLeftColor: '#EF4444',
        borderLeftWidth: 4,
        marginBottom: 12,
        borderRadius: 8,
        padding: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    errorText: {
        color: '#991B1B',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default QueueManagementScreen;