import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

/*
 * Component to display booking details and estimated wait time.
 * shows:
 * - Token Number
 * - Slot Name
 * - Current Queue Position
 * - Estimated Wait Time (formatted)
 * - Status Badge (Pending, Serving, Served)
 */
const WaitingTimeCard = ({ tokenNumber, queuePosition, estimatedWaitTime, slotName, status }) => {

    // Helper to determine color based on booking status
    const getStatusColor = () => {
        switch (status) {
            case 'pending':
                return colors.warning;  // Orange/Yellow
            case 'serving':
                return colors.info;     // Blue indicating active service
            case 'served':
                return colors.success;  // Green indicating completion
            default:
                return colors.gray;
        }
    };

    // Helper to format raw minutes into readable text (e.g., "1h 15m")
    const formatWaitTime = (minutes) => {
        if (minutes < 1) return '< 1 min';
        if (minutes === 1) return '1 min';
        if (minutes < 60) return `${Math.round(minutes)} mins`;

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <View style={styles.container}>
            {/* Header: Token Number & Slot */}
            <View style={styles.header}>
                <View style={styles.tokenRow}>
                    <MaterialCommunityIcons
                        name="ticket-confirmation-outline"
                        size={24}
                        color={colors.brownie}
                    />
                    <Text style={styles.tokenNumber}>Token #{tokenNumber}</Text>
                </View>
                {slotName && (
                    <Text style={styles.slotName}>{slotName}</Text>
                )}
            </View>

            <View style={styles.divider} />

            {/* Info Grid: Queue Position & Wait Time */}
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <MaterialCommunityIcons
                        name="format-list-numbered"
                        size={20}
                        color={colors.brownieLight}
                    />
                    <Text style={styles.infoLabel}>Queue Position</Text>
                    <Text style={styles.infoValue}>{queuePosition}</Text>
                </View>

                <View style={styles.infoItem}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={20}
                        color={colors.brownieLight}
                    />
                    <Text style={styles.infoLabel}>Estimated Wait</Text>
                    {/* Dynamic color for wait time based on status */}
                    <Text style={[styles.infoValue, { color: getStatusColor() }]}>
                        {estimatedWaitTime > 0 ? formatWaitTime(estimatedWaitTime) : 'Ready'}
                    </Text>
                </View>
            </View>

            {/* Status Badge */}
            {status && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                    <Text style={styles.statusText}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: colors.brownie,
    },
    header: {
        marginBottom: 12,
    },
    tokenRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    tokenNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.brownie,
        marginLeft: 8,
    },
    slotName: {
        fontSize: 14,
        color: colors.gray,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.lightGray,
        marginVertical: 12,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    infoItem: {
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.gray,
        marginTop: 4,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.brownie,
    },
    statusBadge: {
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default WaitingTimeCard;
