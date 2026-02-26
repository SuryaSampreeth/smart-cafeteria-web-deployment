import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

/*
 * This component displays a single crowd alert.
 * It shows alert severity, message, slot details, and time.
 * Staff/Admin can also resolve the alert if allowed.
 */
const AlertCard = ({ alert, onResolve, showResolveButton = false }) => {
    /*
     * This helper function decides the UI style for the alert
     * based on its severity level (critical, high, medium, low).
     * It returns the color, icon, and background color.
     */

    // Decide color, icon, and background based on alert severity
    const getSeverityConfig = () => {
        switch (alert.severity) {
            case 'critical':
                return {
                    color: colors.error,
                    icon: 'alert-circle',
                    bgColor: '#FFEBEE', // Light Red
                };
            case 'high':
                return {
                    color: '#FF6F00',
                    icon: 'alert',
                    bgColor: '#FFF3E0', // Light Orange
                };
            case 'medium':
                return {
                    color: colors.warning,
                    icon: 'alert-outline',
                    bgColor: '#FFFDE7', // Light Yellow
                };
            case 'low':
                return {
                    color: colors.info,
                    icon: 'information',
                    bgColor: '#E3F2FD', // Light Blue
                };
            default:
                return {
                    color: colors.gray,
                    icon: 'bell-outline',
                    bgColor: colors.lightGray,
                };
        }
    };
    // Get UI configuration based on alert severity
    const config = getSeverityConfig();

    //Convert timestamp into readable format (e.g., 5 mins ago)
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    return (
        /*
         * Main container for the alert card.
         * Border color and background change based on severity.
         */
        <View style={[styles.container, { backgroundColor: config.bgColor, borderLeftColor: config.color }]}>
            <View style={styles.header}>
                <MaterialCommunityIcons
                    name={config.icon}
                    size={24}
                    color={config.color}
                />
                <View style={styles.headerText}>
                    <Text style={[styles.severityText, { color: config.color }]}>
                        {alert.severity.toUpperCase()}
                    </Text>
                    <Text style={styles.timestamp}>
                        {formatTimestamp(alert.timestamp)}
                    </Text>
                </View>
            </View>

            <Text style={styles.message}>{alert.message}</Text>

            <View style={styles.details}>
                {alert.slotId && alert.slotId.name && (
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={16}
                            color={colors.gray}
                        />
                        <Text style={styles.detailText}>{alert.slotId.name}</Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                        name="percent-outline"
                        size={16}
                        color={colors.gray}
                    />
                    <Text style={styles.detailText}>
                        {alert.occupancyRate}% occupancy ({alert.activeBookings}/{alert.totalCapacity})
                    </Text>
                </View>
            </View>

            {/* Show 'Mark as Resolved' button if applicable */}
            {showResolveButton && !alert.resolved && onResolve && (
                <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => onResolve(alert._id)}
                >
                    <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={20}
                        color={colors.white}
                    />
                    <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                </TouchableOpacity>
            )}

            {/* Show Resolved Badge if already resolved */}
            {alert.resolved && (
                <View style={styles.resolvedBadge}>
                    <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color={colors.success}
                    />
                    <Text style={styles.resolvedText}>
                        Resolved {alert.resolvedAt && formatTimestamp(alert.resolvedAt)}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Main card styling
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
    },
    // Header layout
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    // Header text wrapper
    headerText: {
        marginLeft: 12,
        flex: 1,
    },
    severityText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    // Timestamp text
    timestamp: {
        fontSize: 12,
        color: colors.gray,
    },
    message: {
        fontSize: 15,
        color: colors.brownie,
        marginBottom: 12,
        lineHeight: 22,
    },
    details: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 13,
        color: colors.gray,
        marginLeft: 8,
    },
    // Resolve button styling
    resolveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.brownie,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    resolveButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    resolvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 8,
    },
    resolvedText: {
        fontSize: 13,
        color: colors.success,
        marginLeft: 8,
        fontWeight: '600',
    },
});

export default AlertCard;
