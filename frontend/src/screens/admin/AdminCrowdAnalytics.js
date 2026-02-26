import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import AlertCard from '../../components/AlertCard';
import api from '../../services/api';

/**
 * AdminCrowdAnalytics Screen
 * --------------------------
 * This screen acts as the main dashboard for administrators to monitor crowd data.
 * It provides:
 * 1. High-level system overview (current status, alerts).
 * 2. Peak hour analysis to identify busy slots.
 * 3. Historical trends based on selected time periods (7, 14, 30 days).
 * 4. Data export functionality for offline processing.
 */
const AdminCrowdAnalytics = () => {
    // State to handle loading spinners and API status
    const [loading, setLoading] = useState(true);

    // Stores the main analytics data object from the backend
    const [analytics, setAnalytics] = useState(null);

    // Stores list of active crowd alerts (e.g., overcrowding events)
    const [alerts, setAlerts] = useState([]);

    // User selected filter: How many past days to analyze (default: 7)
    const [analyzeDays, setAnalyzeDays] = useState(7);

    // Error state to display friendly messages if API fails
    const [error, setError] = useState(null);

    // Loading state specifically for the CSV export process
    const [exportingData, setExportingData] = useState(false);

    /**
     * Effect Hook:
     * Triggered mainly when 'analyzeDays' changes.
     * This ensures the dashboard updates automatically when the admin changes the filter.
     */
    useEffect(() => {
        fetchAnalytics();
        fetchAlerts();
    }, [analyzeDays]);

    /**
     * Fetches comprehensive crowd statistics from the backend.
     * Uses the selected 'analyzeDays' to filter the dataset on the server.
     */
    const fetchAnalytics = async () => {
        try {
            setLoading(true); // Start loading spinner
            setError(null);   // Reset previous errors

            const response = await api.getAdminCrowdAnalytics(analyzeDays);

            if (response.data && response.data.success) {
                setAnalytics(response.data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            // Graceful error handling: show backend message or default text
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false); // Stop loading spinner regardless of success/failure
        }
    };

    /**
     * Fetches separate list of unresolved alerts.
     * We only want active issues here to keep the dashboard focused.
     */
    const fetchAlerts = async () => {
        try {
            const response = await api.getAlertHistory({ resolved: false });

            if (response.data && response.data.success) {
                setAlerts(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
            // Note: We don't block the whole UI if alerts fail, just log it.
        }
    };

    /**
     * Handles manual resolution of an alert by the admin.
     * @param {string} alertId - The unique ID of the alert to resolve.
     */
    /**
     * Handles manual resolution of an alert by the admin.
     * @param {string} alertId - The unique ID of the alert to resolve.
     */
    const handleResolveAlert = async (alertId) => {
        try {
            console.log('Attempting to resolve alert:', alertId);
            // Optimistic updates or waiting for completion: here we wait
            const response = await api.resolveAlert(alertId, 'Resolved by admin');
            console.log('Resolve alert response:', response.data);

            if (response.data && response.data.success) {
                // Refresh the list immediately to show updated status
                fetchAlerts();
                fetchAnalytics(); // Also refresh main analytics to update KPI cards

                if (Platform.OS === 'web') {
                    window.alert('Success: Alert resolved successfully');
                } else {
                    Alert.alert('Success', 'Alert resolved successfully');
                }
            } else {
                throw new Error(response.data?.message || 'Failed to resolve alert');
            }

        } catch (err) {
            console.error('Error resolving alert:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to resolve alert';
            if (Platform.OS === 'web') {
                window.alert('Error: ' + errorMessage);
            } else {
                Alert.alert('Error', errorMessage);
            }
        }
    };

    /**
     * Exports crowd data to a CSV file.
     * Steps:
     * 1. Calculate date range based on 'analyzeDays'.
     * 2. Request backend to generate CSV.
     * 3. Backend returns a temporary download URL.
     * 4. Open URL in mobile browser/system handler to download.
     */
    const handleExportData = async () => {
        try {
            setExportingData(true);

            // Calculate 'startDate' going back 'analyzeDays' from today
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - analyzeDays);

            const url = await api.exportCrowdData(
                startDate.toISOString(),
                endDate.toISOString()
            );

            // If we get a valid URL, open it (Deep linking)
            if (url) {
                Linking.openURL(url);
                Alert.alert('Success', 'Data export initiated. Check your downloads folder.');
            }
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to export data');
        } finally {
            setExportingData(false);
        }
    };

    // Full screen loader to prevent UI flickering during initial fetch
    // Full screen loader
    if (loading && !analytics) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5E3023" />
                <Text style={styles.loadingText}>Loading System Pulse...</Text>
            </View>
        );
    }

    const currentStatus = analytics?.currentStatus || {};
    const alertSummary = analytics?.alerts || {};
    const peakHours = analytics?.peakHours || [];
    const historicalPatterns = analytics?.historicalPatterns || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* 1. System Pulse Header with Integrated Filter */}
            {/* 1. System Pulse Header with Integrated Filter */}
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
                            <Text style={styles.headerTitle}>SYSTEM PULSE</Text>
                            <Text style={styles.headerSubtitle}>Crowd Intelligence</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <View style={styles.filterBadge}>
                            <MaterialCommunityIcons name="calendar-range" size={14} color="#FFF" style={{ marginRight: 6 }} />
                            {Platform.OS === 'web' ? (
                                <select
                                    value={analyzeDays}
                                    onChange={(e) => setAnalyzeDays(Number(e.target.value))}
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: '#FFF',
                                        border: 'none',
                                        fontSize: '12px',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="7" style={{ color: '#000' }}>Last 7 Days</option>
                                    <option value="14" style={{ color: '#000' }}>Last 14 Days</option>
                                    <option value="30" style={{ color: '#000' }}>Last 30 Days</option>
                                </select>
                            ) : (
                                <Picker
                                    selectedValue={analyzeDays}
                                    onValueChange={(value) => setAnalyzeDays(value)}
                                    style={styles.headerPicker}
                                    dropdownIconColor="#FFF"
                                    mode="dropdown"
                                >
                                    <Picker.Item label="Last 7 Days" value={7} style={{ fontSize: 12 }} />
                                    <Picker.Item label="Last 14 Days" value={14} style={{ fontSize: 12 }} />
                                    <Picker.Item label="Last 30 Days" value={30} style={{ fontSize: 12 }} />
                                </Picker>
                            )}
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Global Error Banner */}
            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#B91C1C" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* KPI Cards: Glassmorphism Style */}
                <View style={styles.kpiContainer}>
                    {/* Total Alerts - Red Gradient */}
                    <View style={[styles.kpiCard, { backgroundColor: '#FFF' }]}>
                        <LinearGradient colors={['#FECACA', '#FFF']} style={styles.kpiGradient}>
                            <View style={[styles.kpiIcon, { backgroundColor: '#FCA5A5' }]}>
                                <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#B91C1C" />
                            </View>
                            <View>
                                <Text style={[styles.kpiValue, { color: '#B91C1C' }]}>{alertSummary.total || 0}</Text>
                                <Text style={styles.kpiLabel}>Total Alerts</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Active Alerts - Yellow Gradient */}
                    <View style={[styles.kpiCard, { backgroundColor: '#FFF' }]}>
                        <LinearGradient colors={['#FDE68A', '#FFF']} style={styles.kpiGradient}>
                            <View style={[styles.kpiIcon, { backgroundColor: '#FCD34D' }]}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#B45309" />
                            </View>
                            <View>
                                <Text style={[styles.kpiValue, { color: '#B45309' }]}>{alertSummary.active || 0}</Text>
                                <Text style={styles.kpiLabel}>Active</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Resolved Alerts - Green Gradient */}
                    <View style={[styles.kpiCard, { backgroundColor: '#FFF' }]}>
                        <LinearGradient colors={['#BBF7D0', '#FFF']} style={styles.kpiGradient}>
                            <View style={[styles.kpiIcon, { backgroundColor: '#86EFAC' }]}>
                                <MaterialCommunityIcons name="check-circle-outline" size={24} color="#047857" />
                            </View>
                            <View>
                                <Text style={[styles.kpiValue, { color: '#047857' }]}>{alertSummary.resolved || 0}</Text>
                                <Text style={styles.kpiLabel}>Resolved</Text>
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                {/* Active Alerts List */}
                {alerts.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="bell-alert" size={18} color="#5E3023" />
                            <Text style={styles.sectionTitle}>Active Alerts</Text>
                        </View>
                        {alerts.map((alert) => (
                            <AlertCard
                                key={alert._id}
                                alert={alert}
                                onResolve={handleResolveAlert}
                                showResolveButton={true}
                            />
                        ))}
                    </View>
                )}

                {/* Occupancy Data Grid */}
                {peakHours.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="table-large" size={18} color="#5E3023" />
                            <Text style={styles.sectionTitle}>Slot Performance</Text>
                        </View>

                        <View style={styles.tableContainer}>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeadText, { flex: 2 }]}>SLOT NAME</Text>
                                <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>AVG %</Text>
                                <Text style={[styles.tableHeadText, { flex: 1.2, textAlign: 'right' }]}>STATUS</Text>
                            </View>

                            {/* Table Rows */}
                            {peakHours.map((slotData, index) => {
                                const occupancy = slotData.averageOccupancy || 0;
                                let statusText = 'Normal';
                                let statusColor = '#10B981';
                                let statusBg = '#DCFCE7';

                                if (occupancy >= 70) {
                                    statusText = 'Critical';
                                    statusColor = '#EF4444';
                                    statusBg = '#FEE2E2';
                                } else if (occupancy >= 40) {
                                    statusText = 'High';
                                    statusColor = '#F59E0B';
                                    statusBg = '#FEF3C7';
                                }

                                return (
                                    <View key={index} style={[styles.tableRow, index % 2 !== 0 && styles.tableRowAlt]}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.slotName}>{slotData.slotId?.name}</Text>
                                            <Text style={styles.slotTime}>{slotData.slotId?.startTime} - {slotData.slotId?.endTime}</Text>
                                        </View>
                                        <Text style={[styles.occupancyValue, { flex: 1, textAlign: 'center' }]}>
                                            {occupancy}%
                                        </Text>
                                        <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                                            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                                                <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                        <Text style={styles.footerNote}>
                            <MaterialCommunityIcons name="information-outline" size={12} /> Analysis based on last {analyzeDays} days
                        </Text>
                    </View>
                )}

            </ScrollView>

            {/* Floating Export Button */}
            {/* Floating Export Button - Commented out as per request
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fabButton, exportingData && styles.fabDisabled]}
                    onPress={handleExportData}
                    disabled={exportingData}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#5E3023', '#8B5E3C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.fabGradient}
                    >
                        {exportingData ? (
                            <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                        ) : (
                            <MaterialCommunityIcons name="file-download-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.fabText}>
                            {exportingData ? 'Generating Report...' : 'Export Analytics CSV'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 70 : 50, // Increased top padding for status bar
        paddingBottom: 25,
        paddingHorizontal: 20,
        // Removed border radius and shadow to fix spacing issue
        marginBottom: 0,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    headerSubtitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 36,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    headerPicker: {
        color: '#FFF',
        width: 130, // Fixed width for picker
        height: 36,
        transform: [{ scale: 0.9 }], // Scale down slightly to fit style
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECaca',
    },
    errorText: {
        fontSize: 13,
        color: '#B91C1C',
        marginLeft: 8,
        flex: 1,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    kpiContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 8,
    },
    kpiCard: {
        flex: 1,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        overflow: 'hidden',
    },
    kpiGradient: {
        padding: 16,
        alignItems: 'flex-start',
        height: 120,
        justifyContent: 'space-between',
    },
    kpiIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    kpiLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginLeft: 8,
        letterSpacing: 0.3,
    },
    tableContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableHeadText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    tableRowAlt: {
        backgroundColor: '#FAFAFA',
    },
    slotName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    slotTime: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        fontWeight: '500',
    },
    occupancyValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 12,
        fontStyle: 'italic',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    fabButton: {
        borderRadius: 100,
        shadowColor: '#5E3023',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
        maxWidth: 280,
    },
    fabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 100,
    },
    fabDisabled: {
        opacity: 0.8,
    },
    fabText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

export default AdminCrowdAnalytics;