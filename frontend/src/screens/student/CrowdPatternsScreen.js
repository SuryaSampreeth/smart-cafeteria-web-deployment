import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Animated,
    Pressable,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../styles/colors';
import CrowdPatternChart from '../../components/CrowdPatternChart';
import api from '../../services/api';

/**
 * CrowdPatternsScreen Component
 * 
 * Analyzes and displays historical crowd data to help students plan their meals.
 * Features:
 * 1. Historical crowd trends chart.
 * 2. Peak hour analysis (identifies busiest times).
 * 3. Average occupancy statistics.
 * 4. Filtering by Slot and Time Range (7, 14, 30 days).
 */
// Reusable Hoverable Card Component
const HoverableCard = ({ children, style, initialBorderColor = 'rgba(0,0,0,0.05)' }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isHovered, setIsHovered] = useState(false);

    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.spring(scaleAnim, {
            toValue: 1.05, // Pop up slightly
            useNativeDriver: Platform.OS !== 'web', // Native driver doesn't support layout props on web sometimes, but scale is fine. Safe to use false for web compat if needed, but scale works.
        }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    return (
        <Pressable
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={{ flex: 1 }} // Ensure it takes space like a View
        >
            <Animated.View
                style={[
                    style,
                    {
                        transform: [{ scale: scaleAnim }],
                        borderColor: isHovered ? colors.brownie : initialBorderColor,
                        borderWidth: isHovered ? 2 : (style.borderWidth || 0), // Full border on hover
                        borderLeftWidth: 4, // Keep the left border always
                        borderLeftColor: colors.brownie, // Keep left border color
                        // If hovered, key is that we want the REST of the borders to be brownie too. 
                        // borderLeftWidth overrides borderWidth usually if defined after or specific.
                        // We want specific look: Left edge thick, rest thin or thick brownie on hover.
                        // Actually "complete brownie outline" implies uniform or at least visible on all sides.
                        borderTopWidth: isHovered ? 2 : 0,
                        borderRightWidth: isHovered ? 2 : 0,
                        borderBottomWidth: isHovered ? 2 : 0,
                        zIndex: isHovered ? 1 : 0, // Bring to front
                    }
                ]}
            >
                {children}
            </Animated.View>
        </Pressable>
    );
};

const CrowdPatternsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [patterns, setPatterns] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const dateRange = 7; // Fixed to last 7 days (matches seeded data)
    const [error, setError] = useState(null);

    // Initial load: Fetch available slots
    useEffect(() => {
        fetchSlots();
    }, []);

    // Fetch patterns whenever selected slot changes
    useEffect(() => {
        if (selectedSlot) {
            fetchHistoricalPatterns();
        }
    }, [selectedSlot]);

    /**
     * Fetches all available meal slots to populate the dropdown.
     */
    const fetchSlots = async () => {
        try {
            const response = await api.getSlots();
            if (response.data) {
                setSlots(response.data);
                // Default to the first slot if available
                if (response.data.length > 0) {
                    setSelectedSlot(response.data[0]._id);
                }
            }
        } catch (err) {
            console.error('Error fetching slots:', err);
            setError('Failed to load slots');
        }
    };

    /**
     * Fetches historical crowd data for the selected slot and date range.
     */
    const fetchHistoricalPatterns = async () => {
        try {
            setLoading(true);
            setError(null);

            const endDate = new Date('2099-12-31');   // far future — include everything
            const startDate = new Date(0);              // epoch — include all records ever seeded

            const response = await api.getHistoricalPatterns(
                selectedSlot,
                startDate.toISOString(),
                endDate.toISOString()
            );

            if (response.data && response.data.success) {
                setPatterns(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching patterns:', err);
            setError(err.response?.data?.message || 'Failed to load historical data');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Analyzes pattern data to identify the top 3 busiest hours.
     * Returns an array of objects: { hour, frequency }.
     */
    const getPeakHoursSummary = () => {
        if (patterns.length === 0) return null;

        // Aggregate peak hours across all days
        const peakHoursMap = {};

        patterns.forEach(pattern => {
            pattern.peakHours.forEach(hour => {
                peakHoursMap[hour] = (peakHoursMap[hour] || 0) + 1;
            });
        });

        // Sort by frequency (descending)
        const sortedPeakHours = Object.entries(peakHoursMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3); // Top 3 peak hours

        return sortedPeakHours.map(([hour, count]) => ({
            hour: parseInt(hour),
            frequency: Math.round((count / patterns.length) * 100),
        }));
    };

    /**
     * Formats hour integer to AM/PM string (e.g., 13 -> "1:00 PM").
     */
    const formatHour = (hour) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    /**
     * Calculates the average occupancy percentage across the selected date range.
     */
    const getAverageOccupancy = () => {
        if (patterns.length === 0) return 0;
        const sum = patterns.reduce((acc, p) => acc + p.averageOccupancy, 0);
        return Math.round(sum / patterns.length);
    };

    const peakHours = getPeakHoursSummary();
    const avgOccupancy = getAverageOccupancy();
    const selectedSlotName = slots.find(s => s._id === selectedSlot)?.name || '';

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[colors.brownieDark, colors.brownie]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <Text style={styles.headerTitle}>Historical Patterns</Text>
                <Text style={styles.headerSubtitle}>Analyze peak hours and trends</Text>
            </LinearGradient>

            {/* Filters Section */}
            <View style={styles.filtersContainer}>
                {/* Slot Picker */}
                <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Select Slot</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedSlot}
                            onValueChange={(value) => setSelectedSlot(value)}
                            style={styles.picker}
                        >
                            {slots.map(slot => (
                                <Picker.Item
                                    key={slot._id}
                                    label={`${slot.name} (${slot.startTime} - ${slot.endTime})`}
                                    value={slot._id}
                                />
                            ))}
                        </Picker>
                    </View>
                </View>
                <Text style={styles.periodLabel}>Showing data for the last 7 days</Text>
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={20}
                        color={colors.error}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Scrollable Content Area */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.brownie} />
                        <Text style={styles.loadingText}>Loading patterns...</Text>
                    </View>
                ) : patterns.length === 0 ? (
                    // Empty State
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons
                            name="chart-line-variant"
                            size={64}
                            color={colors.gray}
                        />
                        <Text style={styles.emptyText}>No historical data available</Text>
                        <Text style={styles.emptySubtext}>
                            Patterns will appear after the system collects data over time
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Stats Cards */}
                        <View style={styles.summarySection}>
                            <Text style={styles.sectionTitle}>Summary</Text>
                            <View style={styles.summaryGrid}>
                                <HoverableCard style={styles.summaryCard}>
                                    <MaterialCommunityIcons
                                        name="chart-areaspline"
                                        size={32}
                                        color={colors.brownie}
                                    />
                                    <Text style={styles.summaryValue}>{avgOccupancy}%</Text>
                                    <Text style={styles.summaryLabel}>Avg Occupancy</Text>
                                </HoverableCard>
                                <HoverableCard style={styles.summaryCard}>
                                    <MaterialCommunityIcons
                                        name="calendar-clock"
                                        size={32}
                                        color={colors.brownie}
                                    />
                                    <Text style={styles.summaryValue}>{patterns.length}</Text>
                                    <Text style={styles.summaryLabel}>Days Analyzed</Text>
                                </HoverableCard>
                            </View>
                        </View>

                        {/* Peak Hours Section */}
                        {peakHours && peakHours.length > 0 && (
                            <View style={styles.peakHoursSection}>
                                <Text style={styles.sectionTitle}>Most Common Peak Hours</Text>
                                {peakHours.map((peak, index) => (
                                    <View key={index} style={styles.peakHourCard}>
                                        <View style={styles.peakHourRank}>
                                            <Text style={styles.peakHourRankText}>#{index + 1}</Text>
                                        </View>
                                        <View style={styles.peakHourInfo}>
                                            <Text style={styles.peakHourTime}>
                                                {formatHour(peak.hour)}
                                            </Text>
                                            <Text style={styles.peakHourFreq}>
                                                Peak {peak.frequency}% of the time
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons
                                            name="fire"
                                            size={24}
                                            color={colors.error}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Crowd Pattern Chart Component */}
                        <CrowdPatternChart
                            historicalData={patterns}
                            slotName={selectedSlotName}
                            title="Hourly Crowd Pattern"
                            height={200}
                        />

                        <View style={{ height: 20 }} />
                    </>
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 40, // Reduced from standard to be more compact
        paddingBottom: 15,
        backgroundColor: colors.brownie, // Brownie background
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.white, // White text
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.cream, // Cream/White text
        marginTop: 2,
        opacity: 0.9,
    },
    filtersContainer: {
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    filterGroup: {
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.brownie,
        marginBottom: 8,
    },
    periodLabel: {
        fontSize: 12,
        color: colors.gray,
        marginTop: 8,
        fontStyle: 'italic',
    },
    // Updated Picker Container for "Classy/Professional" look
    pickerContainer: {
        backgroundColor: colors.cream, // Changed from white to cream for more color
        borderWidth: 1,
        borderColor: colors.brownie,
        borderRadius: 12, // More rounded
        overflow: 'hidden',
        height: 55, // Slightly taller
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    picker: {
        height: 50,
        width: '100%',
        color: colors.brownie,
        backgroundColor: 'transparent',
        borderWidth: 0, // Ensure no default border
        ...Platform.select({
            web: {
                outlineStyle: 'none', // Remove web focus ring/outline
            },
        }),
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 8,
    },
    errorText: {
        fontSize: 13,
        color: colors.error,
        marginLeft: 8,
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.gray,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.gray,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.gray,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    summarySection: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.brownie,
        marginBottom: 12,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        // Left outline as requested
        borderLeftWidth: 4,
        borderLeftColor: colors.brownie,
        // Soft shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.brownie,
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.gray,
        marginTop: 4,
        textAlign: 'center',
    },
    peakHoursSection: {
        marginTop: 24,
        marginBottom: 16,
    },
    peakHourCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 10,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    peakHourRank: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.brownie,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    peakHourRankText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    peakHourInfo: {
        flex: 1,
    },
    peakHourTime: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.brownie,
    },
    peakHourFreq: {
        fontSize: 13,
        color: colors.gray,
        marginTop: 2,
    },
});

export default CrowdPatternsScreen;
