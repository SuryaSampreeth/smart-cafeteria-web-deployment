import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../styles/colors';

/*
 * CrowdPatternChart Component
 * ---------------------------
 * This component displays a line graph representing how crowd occupancy
 * changes over time for a particular cafeteria slot.
 *
 * It helps students and staff understand:
 * - Busy hours
 * - Peak crowd times
 * - Safer (low crowd) periods
 *
 * Props:
 * - historicalData: Array containing historical crowd prediction data
 * - slotName: Name of the slot (e.g., "Lunch", "Breakfast")
 * - title: Optional title for the chart
 */
const CrowdPatternChart = ({ historicalData, slotName, title = 'Crowd Pattern', height = 220 }) => {

    /*
     * 1. DATA VALIDATION
     * ------------------
     * If no historical data is available, we return a friendly
     * message instead of rendering an empty or broken chart.
     */
    if (!historicalData || historicalData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No historical data available</Text>
            </View>
        );
    }

    /*
     * 2. DATA PREPARATION FUNCTION
     * ----------------------------
     * This function converts backend data into a format
     * required by `react-native-chart-kit`.
     *
     * Steps:
     * - Pick the latest day’s data
     * - Sort hourly records in ascending order
     * - Extract labels (time) and values (occupancy %)
     * - Reduce label clutter for small screens
     */
    const prepareChartData = () => {
        // Get the most recent day's data
        const latestDay = historicalData[0];

        //extra safety check
        if (!latestDay || !latestDay.hourlyData || latestDay.hourlyData.length === 0) {
            return null;
        }

        // Sort by hour and extract occupancy rates
        const sortedData = [...latestDay.hourlyData].sort((a, b) => a.hour - b.hour);

        const labels = sortedData.map(item => `${item.hour}:00`);
        const data = sortedData.map(item => item.avgOccupancy);

        /*
         * Label Optimization:
         * -------------------
         * To avoid overlapping labels on small screens,
         * we display labels at intervals.
         */
        const labelInterval = sortedData.length > 12 ? 3 : 2;
        const formattedLabels = labels.map((label, index) =>
            index % labelInterval === 0 ? label : ''
        );

        return {
            labels: formattedLabels,
            datasets: [{
                data: data,
                color: (opacity = 1) => `rgba(94, 48, 35, ${opacity})`, // brownie color
                strokeWidth: 3,
            }],
        };
    };

    const chartData = prepareChartData();
    /*
     * If preparation fails (unexpected data issue),
     * show a fallback UI instead of crashing.
     */

    if (!chartData) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No chart data available</Text>
            </View>
        );
    }

    /*
     * 3. RESPONSIVE WIDTH CALCULATION
     * --------------------------------
     * Chart width is adjusted dynamically
     * based on device screen width.
     */
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 40; // Account for padding

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {slotName && <Text style={styles.slotName}>{slotName}</Text>}
            </View>

            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={chartWidth}
                    height={height}
                    getDotColor={(dataPoint, dataPointIndex) => {
                        if (dataPoint >= 70) return colors.error;
                        if (dataPoint >= 40) return colors.warning;
                        return colors.success;
                    }}
                    chartConfig={{
                        backgroundColor: colors.background,
                        backgroundGradientFrom: colors.cream,
                        backgroundGradientTo: colors.cream,
                        decimalPlaces: 0, // No decimals in Y-axis
                        // Make line/shading colorful (Red -> Green gradient)
                        color: (opacity = 1) => `rgba(93, 64, 55, ${opacity})`, // Keep line Brownie for contrast
                        fillShadowGradientFrom: colors.error, // Red at top (High crowd)
                        fillShadowGradientTo: colors.success, // Green at bottom (Low crowd)
                        fillShadowGradientOpacity: 0.7, // High opacity to make colors visible
                        labelColor: (opacity = 1) => `rgba(93, 64, 55, ${opacity})`,
                        style: {
                            borderRadius: 16,
                        },
                        propsForDots: {
                            r: '5',
                            strokeWidth: '2',
                            stroke: colors.white, // White stroke to make colors pop
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: '', // Solid background lines
                            stroke: colors.lightGray,
                            strokeWidth: 1,
                        },
                    }}
                    bezier // Smooth curved lines
                    style={styles.chart}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    fromZero={true} // Start Y-axis at 0
                    segments={4}
                />
            </View>

            { /*
             * 4. LEGEND SECTION
             * ------------------
             * Helps users understand crowd severity ranges
             * even though the chart uses a single line color.
             */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Low (&lt;40%)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                    <Text style={styles.legendText}>Medium (40-70%)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                    <Text style={styles.legendText}>High (&gt;70%)</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        borderRadius: 12,
        // Left outline as requested
        borderLeftWidth: 4,
        borderLeftColor: colors.brownie,
        padding: 12, // Reduced from 16
        marginVertical: 8, // Reduced from 12
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.brownie,
        marginBottom: 4,
    },
    slotName: {
        fontSize: 14,
        color: colors.gray,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    chart: {
        borderRadius: 12,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.lightGray,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: colors.gray,
    },
    emptyContainer: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
    },
    emptyText: {
        fontSize: 14,
        color: colors.gray,
    },
});

export default CrowdPatternChart;