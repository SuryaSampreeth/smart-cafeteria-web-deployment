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
    TextInput,
    Modal,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import api, { bookingAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { BOOKING_STATUS } from '../../utils/constants';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

/**
 * ProfileScreen Component
 * 
 * Displays user profile information and a comprehensive booking history.
 * Features:
 * 1. User details display (Name, Email, Reg Number).
 * 2. Edit Profile capability (Name & Registration Number).
 * 3. Booking List with Filter Tabs (All, Active, Completed).
 * 4. Actions for Active Bookings: Cancel or Modify.
 * 5. Status badges for easy identification of booking state.
 */
const ProfileScreen = () => {
    const { user, updateUser } = useAuth(); // updateUser used to update context
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState('all'); // all, active, completed
    const [error, setError] = useState('');

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editRegNum, setEditRegNum] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    // Initialize edit state when user data is available or editing starts
    useEffect(() => {
        if (user) {
            setEditName(user.name || '');
            setEditRegNum(user.registrationNumber || '');
        }
    }, [user, isEditing]);

    /**
     * Fetches all bookings for the current user.
     * Sorts them by date descending (Newest first).
     */
    const fetchBookings = async () => {
        try {
            setError('');
            const response = await bookingAPI.getMyBookings();
            // Sort by date descending
            const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setBookings(sorted);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load bookings');
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Pull-to-refresh handler.
     */
    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    /**
     * Handles updating the user profile.
     */
    const handleUpdateProfile = async () => {
        if (!editName.trim() || !editRegNum.trim()) {
            Alert.alert('Error', 'Name and Registration Number cannot be empty.');
            return;
        }

        setSavingProfile(true);
        try {
            const response = await api.updateProfile({
                name: editName,
                registrationNumber: editRegNum,
            });

            // Update local user context if possible, or just alert success
            // Assuming the API returns the updated user object with a new token
            // We might need to manually update the context or re-login silently
            // For now, we'll just update the local state and rely on the context to refresh eventually
            // or if the `login` function from useAuth allows updating user data directly.

            // Since useAuth logic might be simple, we can try to re-login with the new token/data if supported
            // deeper integration depends on AuthContext implementation. 
            // A simple page reload or alert is a safe fallback.

            // Update local user context
            const { token, ...userData } = response.data;
            if (updateUser) {
                await updateUser(userData, token);
            }

            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');

        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    /**
     * Handles booking cancellation.
     */
    const handleCancelBooking = async (bookingId, tokenNumber) => {
        const confirmMessage = `Are you sure you want to cancel token ${tokenNumber}?`;

        if (Platform.OS === 'web') {
            if (window.confirm(confirmMessage)) {
                try {
                    await bookingAPI.cancel(bookingId);
                    window.alert('Success! Booking cancelled successfully');
                    fetchBookings();
                } catch (err) {
                    window.alert('Error: ' + (err.response?.data?.message || 'Failed to cancel booking'));
                }
            }
        } else {
            Alert.alert(
                'Cancel Booking',
                confirmMessage,
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes, Cancel',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await bookingAPI.cancel(bookingId);
                                Alert.alert('Success', 'Booking cancelled successfully');
                                fetchBookings();
                            } catch (err) {
                                Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking');
                            }
                        },
                    },
                ]
            );
        }
    };

    /**
     * Navigates to the booking screen in 'Modify' mode.
     */
    const handleModifyBooking = (booking) => {
        navigation.navigate('Book Meal', {
            modifyMode: true,
            bookingId: booking._id,
            existingSlot: booking.slotId,
            existingItems: booking.items,
            tokenNumber: booking.tokenNumber,
        });
    };

    /**
     * Filters the bookings list based on the selected tab (All, Active, Completed).
     */
    const getFilteredBookings = () => {
        switch (filter) {
            case 'active':
                return bookings.filter(
                    (b) => b.status !== BOOKING_STATUS.SERVED && b.status !== BOOKING_STATUS.CANCELLED
                );
            case 'completed':
                return bookings.filter(
                    (b) => b.status === BOOKING_STATUS.SERVED || b.status === BOOKING_STATUS.CANCELLED
                );
            default:
                return bookings;
        }
    };

    /**
     * Returns the color code corresponding to a booking status.
     */
    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATUS.PENDING:
                return colors.warning;
            case BOOKING_STATUS.SERVING:
                return colors.info;
            case BOOKING_STATUS.SERVED:
                return colors.success;
            case BOOKING_STATUS.CANCELLED:
                return colors.error;
            default:
                return colors.gray;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brownie} />
            </View>
        );
    }

    const filteredBookings = getFilteredBookings();

    return (
        <View style={styles.container}>
            {/* Header: Profile Info */}
            <LinearGradient
                colors={[colors.brownieDark, colors.brownie]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={[styles.headerContent, !isLargeScreen && { flexDirection: 'column', alignItems: 'center' }]}>
                    <View style={!isLargeScreen && { alignItems: 'center', marginBottom: 16 }}>
                        <Text style={[styles.headerTitle, !isLargeScreen && { textAlign: 'center' }]}>Student Profile</Text>
                        <Text style={[styles.headerSubtitle, !isLargeScreen && { textAlign: 'center' }]}>ACCOUNT & HISTORY</Text>
                    </View>

                    {/* User Info / Edit Form */}
                    <View style={[styles.userInfoContainer, !isLargeScreen && { marginLeft: 0, alignItems: 'center' }]}>
                        {isEditing ? (
                            <View style={[styles.editForm, !isLargeScreen && { alignItems: 'center' }]}>
                                <TextInput
                                    style={[styles.editInput, !isLargeScreen && { textAlign: 'center' }]}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Name"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                                <TextInput
                                    style={[styles.editInput, !isLargeScreen && { textAlign: 'center' }]}
                                    value={editRegNum}
                                    onChangeText={setEditRegNum}
                                    placeholder="Reg. Number"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleUpdateProfile}
                                        disabled={savingProfile}
                                    >
                                        {savingProfile ? (
                                            <ActivityIndicator size="small" color={colors.brownie} />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelEditButton}
                                        onPress={() => setIsEditing(false)}
                                        disabled={savingProfile}
                                    >
                                        <Text style={styles.cancelEditText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={[styles.userInfo, !isLargeScreen && { flexDirection: 'column' }]}>
                                <View style={[styles.userDetails, !isLargeScreen && { alignItems: 'center', marginRight: 0, marginBottom: 8 }]}>
                                    <Text style={[styles.userName, !isLargeScreen && { textAlign: 'center' }]}>{user?.name}</Text>
                                    <Text style={[styles.userEmail, !isLargeScreen && { textAlign: 'center' }]}>{user?.email}</Text>
                                    {user?.registrationNumber && (
                                        <View style={[styles.regTag, !isLargeScreen && { alignSelf: 'center' }]}>
                                            <Text style={styles.regText}>{user.registrationNumber}</Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.editIconBtn}
                                    onPress={() => setIsEditing(true)}
                                >
                                    <Text style={styles.editIconText}>EDIT</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {['all', 'active', 'completed'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.filterTab, filter === tab && styles.filterTabActive]}
                        onPress={() => setFilter(tab)}
                    >
                        <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'all' && ` (${bookings.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bookings List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brownie]} />
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : null}

                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                        // Token/Ticket Style Card
                        <View key={booking._id} style={styles.ticketContainer}>
                            {/* Ticket Header */}
                            <View style={styles.ticketHeader}>
                                <View style={styles.rowBetween}>
                                    <View>
                                        <Text style={styles.ticketLabel}>TOKEN NUMBER</Text>
                                        <Text style={styles.ticketNumber}>#{booking.tokenNumber}</Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(booking.status) },
                                        ]}
                                    >
                                        <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Ticket Body */}
                            <View style={styles.ticketBody}>
                                <View style={styles.infoRow}>
                                    <View>
                                        <Text style={styles.infoLabel}>DATE & TIME</Text>
                                        <Text style={styles.infoValue}>
                                            {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                        <Text style={styles.infoSubValue}>
                                            {new Date(booking.createdAt).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.infoLabel}>SLOT</Text>
                                        <Text style={styles.infoValue}>{booking.slotId.name}</Text>
                                    </View>
                                </View>

                                {/* Perforation Line */}
                                <View style={styles.perforationLine}>
                                    {[...Array(20)].map((_, i) => (
                                        <View key={i} style={styles.dash} />
                                    ))}
                                </View>

                                {/* Order Items */}
                                <View style={styles.orderSummary}>
                                    {booking.items.map((item, index) => (
                                        <View key={index} style={styles.orderItem}>
                                            <Text style={styles.orderItemText}>
                                                {item.quantity} x {item.menuItemId.name}
                                            </Text>
                                            <Text style={styles.orderItemPrice}>
                                                ₹{item.menuItemId.price * item.quantity}
                                            </Text>
                                        </View>
                                    ))}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>TOTAL PAID</Text>
                                        <Text style={styles.totalValue}>
                                            ₹
                                            {booking.items.reduce(
                                                (sum, item) => sum + item.menuItemId.price * item.quantity,
                                                0
                                            )}
                                        </Text>
                                    </View>
                                </View>

                                {/* Action Buttons for Pending */}
                                {booking.status === BOOKING_STATUS.PENDING && (
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={styles.modifyButton}
                                            onPress={() => handleModifyBooking(booking)}
                                        >
                                            <Text style={styles.modifyButtonText}>Modify</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => handleCancelBooking(booking._id, booking.tokenNumber)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Circle Cuts */}
                            <View style={styles.circleCutLeft} />
                            <View style={styles.circleCutRight} />
                        </View>
                    ))
                ) : (
                    // Empty State
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📂</Text>
                        <Text style={styles.emptyTitle}>
                            {filter === 'all' && 'No bookings yet'}
                            {filter === 'active' && 'No active bookings'}
                            {filter === 'completed' && 'No completed bookings'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Your booking history will appear here.
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
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.brownieDark, // Dark Header
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        zIndex: 1,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: isLargeScreen ? 'flex-start' : 'center',
    },
    headerTitle: {
        ...typography.h1,
        color: colors.cream,
        fontSize: 28,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(243, 233, 220, 0.6)',
        marginTop: 4,
        letterSpacing: 1,
    },
    userInfoContainer: {
        flex: isLargeScreen ? 1 : undefined,
        width: isLargeScreen ? undefined : '100%',
        alignItems: isLargeScreen ? 'flex-end' : 'center',
        marginLeft: isLargeScreen ? 16 : 0,
        marginTop: isLargeScreen ? 0 : 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center', // Align items vertically center
    },
    userDetails: {
        alignItems: 'flex-end',
        marginRight: 8,
    },
    userName: {
        color: colors.cream,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
        textAlign: 'right',
    },
    userEmail: {
        color: 'rgba(243, 233, 220, 0.7)',
        fontSize: 12,
        marginBottom: 6,
        textAlign: isLargeScreen ? 'right' : 'center',
    },
    regTag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-end',
    },
    regText: {
        color: colors.cream,
        fontSize: 10,
        fontWeight: 'bold',
    },
    editIconBtn: {
        marginLeft: isLargeScreen ? 12 : 0,
        marginTop: isLargeScreen ? 0 : 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignSelf: 'center', // Center vertically in the row
    },
    editIconText: {
        color: colors.cream,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Edit Form Styles
    editForm: {
        width: '100%',
        maxWidth: 200,
        alignItems: 'flex-end',
    },
    editInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: colors.cream,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 14,
        marginBottom: 8,
        width: '100%',
        textAlign: 'right',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    editActions: {
        flexDirection: 'row',
        gap: 8,
    },
    saveButton: {
        backgroundColor: colors.cream,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    saveButtonText: {
        color: colors.brownie,
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelEditButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    cancelEditText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },

    filterContainer: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    filterTab: {
        marginRight: 24,
        paddingVertical: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    filterTabActive: {
        borderBottomColor: colors.brownie,
    },
    filterText: {
        fontSize: 14,
        color: colors.gray,
        fontWeight: '600',
    },
    filterTextActive: {
        color: colors.brownie,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
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
    // Ticket Styles
    ticketContainer: {
        backgroundColor: colors.cream,
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 6,
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
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    ticketBody: {
        padding: 16,
        paddingTop: 24, // Space for circle cuts
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    infoLabel: {
        color: colors.brownieLight,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    infoValue: {
        color: colors.brownie,
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoSubValue: {
        color: colors.brownie,
        fontSize: 12,
        opacity: 0.7,
    },
    perforationLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
        marginVertical: 12,
        opacity: 0.3,
    },
    dash: {
        width: 8,
        height: 1,
        backgroundColor: colors.brownie,
        marginHorizontal: 2,
    },
    orderSummary: {
        marginBottom: 12,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
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
        marginTop: 8,
        paddingTop: 8,
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
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    modifyButton: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: colors.brownie,
        borderRadius: 6,
        alignItems: 'center',
    },
    modifyButtonText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.error,
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.error,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    // Ticket Decoration: Circle Cuts
    circleCutLeft: {
        position: 'absolute',
        top: 82, // Matched to styles.ticketHeader height approx
        left: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.background,
    },
    circleCutRight: {
        position: 'absolute',
        top: 82,
        right: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.background,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        opacity: 0.6,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        color: colors.brownie,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    emptySubtitle: {
        color: colors.gray,
        fontSize: 14,
        textAlign: 'center',
    },
});

export default ProfileScreen;