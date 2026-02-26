import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Platform,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import { bookingAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { BOOKING_STATUS } from '../../utils/constants';

/**
 * MyTokensScreen Component
 * 
 * Redesigned with a "Digital Ticket" or "Boarding Pass" aesthetic.
 * Maintains all original functionality:
 * 1. Real-time updates via auto-refresh.
 * 2. Status logic.
 * 3. Queue position display.
 */
const MyTokensScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTokens();
        const interval = setInterval(fetchTokens, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchTokens = async () => {
        try {
            setError('');
            const response = await bookingAPI.getMyBookings();
            // The user wants to see all tokens in MyTokensScreen, so we likely shouldn't filter them out completely
            // or maybe the previous code filtered SERVED/CANCELLED? 
            // The previous code was:
            // const activeTokens = response.data.filter(
            //    (booking) => booking.status !== BOOKING_STATUS.SERVED && booking.status !== BOOKING_STATUS.CANCELLED
            // );
            // setTokens(activeTokens);

            // Wait, the user said "in the mytokens screen the expired bookings should also be shown".
            // So I should probably setTokens(response.data) but maybe sort/categorize them.
            // But to "revert", I should put back what was there roughly, but maybe allow expired?
            // Actually, if I just use getMyBookings(), it returns everything.
            // Let's look at the previous code again. 
            // It filtered out SERVED and CANCELLED. 
            // "expired bookings should also be shown" -> so I should NOT filter expired? 
            // The previous code `booking.status !== BOOKING_STATUS.SERVED && booking.status !== BOOKING_STATUS.CANCELLED` 
            // would INCLUDE 'expired' if 'expired' is a status.

            // Reverting to the logic that includes 'expired' but might exclude processed ones if that's what "My Tokens" means (active stuff). 
            // BUT user said "in the mytokens screen the expired bookings should also be shown". 
            // So basically, show PREVIOUS state.

            const activeTokens = response.data.filter(
                (booking) => booking.status !== BOOKING_STATUS.SERVED && booking.status !== BOOKING_STATUS.CANCELLED
            );
            setTokens(activeTokens);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load tokens');
            console.error('Error fetching tokens:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTokens();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATUS.PENDING: return colors.warning;
            case BOOKING_STATUS.SERVING: return colors.info;
            case BOOKING_STATUS.SERVED: return colors.success;
            default: return colors.gray;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case BOOKING_STATUS.PENDING: return "PENDING";
            case BOOKING_STATUS.SERVING: return "SERVING";
            default: return status.toUpperCase();
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brownie} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[colors.brownieDark, colors.brownie]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <Text style={styles.headerTitle}>My Digital Tokens</Text>
                <Text style={styles.headerSubtitle}>Active Orders & Status</Text>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brownie]} />
                }
            >
                {/* Error Message */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : null}

                {/* Token List */}
                {tokens.length > 0 ? (
                    tokens.map((token) => (
                        <View key={token._id} style={styles.ticketContainer}>
                            {/* Ticket Header (Top Part) */}
                            <View style={styles.ticketHeader}>
                                <View style={styles.rowBetween}>
                                    <View>
                                        <Text style={styles.ticketLabel}>TOKEN NUMBER</Text>
                                        <Text style={styles.ticketNumber}>#{token.tokenNumber}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(token.status) }]}>
                                        <Text style={styles.statusText}>{getStatusLabel(token.status)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Ticket Body (Middle Part) */}
                            <View style={styles.ticketBody}>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoBlock}>
                                        <Text style={styles.infoLabel}>SLOT</Text>
                                        <Text style={styles.infoValue}>{token.slotId?.name || 'Slot Unavailable'}</Text>
                                        <Text style={styles.infoSubValue}>
                                            {token.slotId?.startTime || '--:--'} - {token.slotId?.endTime || '--:--'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoBlockRight}>
                                        <Text style={styles.infoLabel}>QUEUE POS</Text>
                                        <Text style={styles.queueValue}>#{token.queuePosition}</Text>
                                    </View>
                                </View>

                                {token.estimatedWaitTime > 0 && (
                                    <View style={styles.waitContainer}>
                                        <Text style={styles.waitLabel}>Est. Wait Time</Text>
                                        <Text style={styles.waitValue}>{token.estimatedWaitTime} mins</Text>
                                    </View>
                                )}

                                {/* Perforation Line */}
                                <View style={styles.perforationLine}>
                                    {[...Array(20)].map((_, i) => (
                                        <View key={i} style={styles.dash} />
                                    ))}
                                </View>

                                {/* Order Summary */}
                                <View style={styles.orderSummary}>
                                    <Text style={styles.sectionHeader}>ORDER DETAILS</Text>
                                    {token.items.map((item, index) => (
                                        <View key={index} style={styles.orderItem}>
                                            <Text style={styles.orderItemText}>
                                                {item.quantity} x {item.menuItemId?.name || 'Unknown Item'}
                                            </Text>
                                            <Text style={styles.orderItemPrice}>
                                                ₹{(item.menuItemId?.price || 0) * item.quantity}
                                            </Text>
                                        </View>
                                    ))}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                                        <Text style={styles.totalValue}>
                                            ₹{token.items.reduce((sum, item) => sum + (item.menuItemId?.price || 0) * item.quantity, 0)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Decorative Cuts for Ticket Look */}
                            <View style={styles.circleCutLeft} />
                            <View style={styles.circleCutRight} />

                            {/* Serving Alert Overlay */}
                            {token.status === BOOKING_STATUS.SERVING && (
                                <View style={styles.servingBanner}>
                                    <Text style={styles.servingText}>🔔 YOUR ORDER IS READY!</Text>
                                </View>
                            )}
                        </View>
                    ))
                ) : (
                    // Empty State
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🎫</Text>
                        <Text style={styles.emptyTitle}>No Active Tokens</Text>
                        <Text style={styles.emptySubtitle}>
                            Your active meal bookings will appear here as digital tickets.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Reverted to original background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: colors.brownieDark, // Header stays dark as requested
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        ...typography.h1,
        color: colors.cream, // Cream text
        fontSize: 28,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(243, 233, 220, 0.6)', // Faded cream
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    errorContainer: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    errorText: {
        color: '#FF8A80',
        fontSize: 14,
        textAlign: 'center',
    },
    ticketContainer: {
        backgroundColor: colors.cream,
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden', // Important for perforation visual
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, // Reduced shadow opacity for light bg
        shadowRadius: 8,
        elevation: 6,
        borderLeftWidth: 8, // Added brown outline
        borderLeftColor: colors.brownie,
    },
    ticketHeader: {
        backgroundColor: colors.brownie,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.brownieLight,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ticketLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4,
    },
    ticketNumber: {
        color: colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Monospace for ticket number feel
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    ticketBody: {
        padding: 20,
        paddingTop: 24, // Space for circle cuts
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoBlock: {
        flex: 2,
    },
    infoBlockRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    infoLabel: {
        color: colors.brownieLight,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    infoValue: {
        color: colors.brownie,
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoSubValue: {
        color: colors.brownie,
        fontSize: 14,
        opacity: 0.7,
    },
    queueValue: {
        color: colors.brownie,
        fontSize: 28,
        fontWeight: 'bold',
    },
    waitContainer: {
        backgroundColor: 'rgba(94, 48, 35, 0.05)',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    waitLabel: {
        color: colors.brownie,
        fontSize: 12,
        fontWeight: '600',
    },
    waitValue: {
        color: colors.brownie,
        fontSize: 14,
        fontWeight: 'bold',
    },
    perforationLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
        marginVertical: 16,
        opacity: 0.3,
    },
    dash: {
        width: 8,
        height: 1,
        backgroundColor: colors.brownie,
        marginHorizontal: 2,
    },
    orderSummary: {
        marginTop: 8,
    },
    sectionHeader: {
        color: colors.brownieLight,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderItemText: {
        color: colors.brownie,
        fontSize: 14,
    },
    orderItemPrice: {
        color: colors.brownie,
        fontSize: 14,
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(94, 48, 35, 0.1)',
    },
    totalLabel: {
        color: colors.brownie,
        fontSize: 12,
        fontWeight: 'bold',
    },
    totalValue: {
        color: colors.brownie,
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Ticket Decoration: Circle Cuts - Updated to match new background
    circleCutLeft: {
        position: 'absolute',
        top: 86, // Adjust based on header height
        left: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.background, // Match container bg (changed from brownieDark)
    },
    circleCutRight: {
        position: 'absolute',
        top: 86, // Adjust based on header height
        right: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.background, // Match container bg (changed from brownieDark)
    },
    servingBanner: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.success,
        padding: 12,
        alignItems: 'center',
    },
    servingText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        opacity: 0.7,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        color: colors.brownie, // Changed to brownie to be visible on light bg
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: colors.gray, // Changed to gray to be visible on light bg
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 240,
    },
});

export default MyTokensScreen;