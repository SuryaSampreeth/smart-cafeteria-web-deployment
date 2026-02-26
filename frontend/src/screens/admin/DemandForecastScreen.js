import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import { demandForecastAPI } from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

/*
 * DemandForecastScreen
 * ---------------------
 * Admin dashboard for AI/ML-based demand forecasting.
 * Shows:
 * 1. Daily forecast line chart (next 7 days)
 * 2. Weekly forecast bar chart (next 4 weeks)
 * 3. Model accuracy metrics (RMSE, MAE, MAPE)
 * 4. Model comparison table
 * 5. Retrain model button
 */
const DemandForecastScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [retraining, setRetraining] = useState(false);
    const [activeTab, setActiveTab] = useState('daily');
    const [mlHealthy, setMlHealthy] = useState(false);

    // Data state
    const [dailyForecast, setDailyForecast] = useState(null);
    const [weeklyForecast, setWeeklyForecast] = useState(null);
    const [monthlyForecast, setMonthlyForecast] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Fetch all forecast data
    const fetchAllData = useCallback(async () => {
        try {
            setErrorMessage(null);

            // Check ML service health first
            try {
                const healthRes = await demandForecastAPI.getHealth();
                setMlHealthy(healthRes.data?.success && healthRes.data?.mlService?.model_loaded);
            } catch {
                setMlHealthy(false);
                setErrorMessage(
                    'ML Service is not running.\n\nTo start it:\n1. cd backend/ml_service\n2. python train.py\n3. python app.py'
                );
                return;
            }

            // Fetch forecasts in parallel
            const [dailyRes, weeklyRes, monthlyRes, accRes] = await Promise.allSettled([
                demandForecastAPI.getDailyForecast(7),
                demandForecastAPI.getWeeklyForecast(4),
                demandForecastAPI.getMonthlyForecast(3),
                demandForecastAPI.getAccuracy(),
            ]);

            if (dailyRes.status === 'fulfilled') {
                setDailyForecast(dailyRes.value.data);
            }
            if (weeklyRes.status === 'fulfilled') {
                setWeeklyForecast(weeklyRes.value.data);
            }
            if (monthlyRes.status === 'fulfilled') {
                setMonthlyForecast(monthlyRes.value.data);
            }
            if (accRes.status === 'fulfilled') {
                setAccuracy(accRes.value.data);
            }
        } catch (error) {
            console.error('Forecast fetch error:', error);
            setErrorMessage('Failed to load forecast data.');
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchAllData();
            setLoading(false);
        };
        load();
    }, [fetchAllData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    const handleRetrain = async () => {
        Alert.alert(
            'Retrain Model',
            'This will retrain all ML models. It may take a few minutes. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Retrain',
                    onPress: async () => {
                        try {
                            setRetraining(true);
                            await demandForecastAPI.triggerRetrain();
                            Alert.alert('Success', 'Models retrained successfully!');
                            await fetchAllData();
                        } catch (error) {
                            Alert.alert('Error', 'Retraining failed: ' + error.message);
                        } finally {
                            setRetraining(false);
                        }
                    },
                },
            ]
        );
    };

    // --- Chart configuration ---
    const chartConfig = {
        backgroundColor: colors.brownieDark,
        backgroundGradientFrom: colors.brownie,
        backgroundGradientTo: colors.brownieDark,
        decimalCount: 0,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: colors.warning,
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: 'rgba(255,255,255,0.1)',
        },
    };

    // --- Render helpers ---
    const renderHeader = () => (
        <LinearGradient
            colors={[colors.brownie, colors.brownieDark]}
            style={styles.header}
        >
            <Text style={styles.headerTitle}>📊 Demand Forecasting</Text>
            <Text style={styles.headerSubtitle}>AI/ML Powered Predictions</Text>
            <View style={styles.healthBadge}>
                <View style={[styles.healthDot, { backgroundColor: mlHealthy ? colors.success : colors.error }]} />
                <Text style={styles.healthText}>
                    ML Service: {mlHealthy ? 'Online' : 'Offline'}
                </Text>
            </View>
        </LinearGradient>
    );

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {['daily', 'weekly', 'monthly'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderDailyChart = () => {
        if (!dailyForecast?.data?.length) {
            return <Text style={styles.noDataText}>No daily forecast available</Text>;
        }

        const labels = dailyForecast.data.map(d => {
            const day = d.day_name || '';
            return day.substring(0, 3);
        });
        const values = dailyForecast.data.map(d => d.predicted_demand || 0);

        return (
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Daily Demand Forecast (Next 7 Days)</Text>
                <Text style={styles.chartSubtitle}>Model: {dailyForecast.modelUsed || dailyForecast.model_used}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart
                        data={{
                            labels: labels,
                            datasets: [{ data: values, strokeWidth: 3 }],
                        }}
                        width={Math.max(SCREEN_WIDTH - 40, labels.length * 60)}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        yAxisSuffix=""
                        fromZero
                    />
                </ScrollView>

                {/* Data table */}
                <View style={styles.dataTable}>
                    {dailyForecast.data.map((item, idx) => (
                        <View key={idx} style={styles.dataRow}>
                            <Text style={styles.dataLabel}>{item.day_name}</Text>
                            <Text style={styles.dataDate}>{item.date}</Text>
                            <Text style={styles.dataValue}>{Math.round(item.predicted_demand)}</Text>
                            <Text style={styles.dataConfidence}>
                                ({Math.round(item.confidence?.lower || 0)} - {Math.round(item.confidence?.upper || 0)})
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderWeeklyChart = () => {
        if (!weeklyForecast?.data?.length) {
            return <Text style={styles.noDataText}>No weekly forecast available</Text>;
        }

        const labels = weeklyForecast.data.map(d => `Week ${d.week_number}`);
        const values = weeklyForecast.data.map(d => d.total_predicted_demand || d.avg_daily_demand || 0);

        return (
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Weekly Demand Forecast (Next 4 Weeks)</Text>
                <Text style={styles.chartSubtitle}>Model: {weeklyForecast.modelUsed || weeklyForecast.model_used}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <BarChart
                        data={{
                            labels: labels,
                            datasets: [{ data: values }],
                        }}
                        width={Math.max(SCREEN_WIDTH - 40, labels.length * 80)}
                        height={220}
                        chartConfig={{
                            ...chartConfig,
                            barPercentage: 0.6,
                        }}
                        style={styles.chart}
                        yAxisSuffix=""
                        fromZero
                    />
                </ScrollView>

                {/* Data cards */}
                <View style={styles.weeklyCards}>
                    {weeklyForecast.data.map((item, idx) => (
                        <View key={idx} style={styles.weekCard}>
                            <Text style={styles.weekCardTitle}>Week {item.week_number}</Text>
                            <Text style={styles.weekCardDates}>{item.start_date} → {item.end_date}</Text>
                            <Text style={styles.weekCardTotal}>Total: {Math.round(item.total_predicted_demand)}</Text>
                            <Text style={styles.weekCardAvg}>Avg/Day: {Math.round(item.avg_daily_demand)}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderMonthlyChart = () => {
        if (!monthlyForecast?.data?.length) {
            return <Text style={styles.noDataText}>No monthly forecast available</Text>;
        }

        const labels = monthlyForecast.data.map(d => `Month ${d.month_number}`);
        const values = monthlyForecast.data.map(d => d.total_predicted_demand || 0);

        return (
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Monthly Demand Forecast (Next 3 Months)</Text>
                <Text style={styles.chartSubtitle}>Model: {monthlyForecast.modelUsed || monthlyForecast.model_used}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <BarChart
                        data={{
                            labels: labels,
                            datasets: [{ data: values }],
                        }}
                        width={Math.max(SCREEN_WIDTH - 40, labels.length * 100)}
                        height={220}
                        chartConfig={{
                            ...chartConfig,
                            barPercentage: 0.5,
                            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                        }}
                        style={styles.chart}
                        yAxisSuffix=""
                        fromZero
                    />
                </ScrollView>

                {weeklyForecast?.data && (
                    <View style={styles.weeklyCards}>
                        {monthlyForecast.data.map((item, idx) => (
                            <View key={idx} style={[styles.weekCard, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={styles.weekCardTitle}>Month {item.month_number}</Text>
                                <Text style={styles.weekCardDates}>{item.start_date} → {item.end_date}</Text>
                                <Text style={styles.weekCardTotal}>Total: {Math.round(item.total_predicted_demand)}</Text>
                                <Text style={styles.weekCardAvg}>Avg/Day: {Math.round(item.avg_daily_demand)}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderAccuracySection = () => {
        if (!accuracy) return null;

        const models = accuracy.models || {};
        const bestModel = accuracy.bestModel || accuracy.best_model;

        return (
            <View style={styles.accuracySection}>
                <Text style={styles.sectionTitle}>📈 Model Accuracy</Text>
                <Text style={styles.sectionSubtitle}>
                    Active Model: {accuracy.activeModel || accuracy.active_model || 'N/A'}
                </Text>

                {/* Metric cards */}
                <View style={styles.metricsRow}>
                    {Object.entries(models).map(([name, metrics]) => (
                        <View
                            key={name}
                            style={[
                                styles.metricCard,
                                name === bestModel && styles.bestMetricCard,
                            ]}
                        >
                            {name === bestModel && (
                                <Text style={styles.bestBadge}>⭐ BEST</Text>
                            )}
                            <Text style={styles.metricModelName}>{name}</Text>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>RMSE</Text>
                                <Text style={styles.metricValue}>{metrics.rmse?.toFixed(2)}</Text>
                            </View>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>MAE</Text>
                                <Text style={styles.metricValue}>{metrics.mae?.toFixed(2)}</Text>
                            </View>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>MAPE</Text>
                                <Text style={styles.metricValue}>{metrics.mape?.toFixed(1)}%</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {accuracy.trained_at && (
                    <Text style={styles.trainedAt}>
                        Last trained: {new Date(accuracy.trained_at).toLocaleString()}
                    </Text>
                )}
            </View>
        );
    };

    const renderRetrainButton = () => (
        <TouchableOpacity
            style={[styles.retrainButton, retraining && styles.retrainButtonDisabled]}
            onPress={handleRetrain}
            disabled={retraining || !mlHealthy}
        >
            {retraining ? (
                <>
                    <ActivityIndicator color={colors.white} size="small" />
                    <Text style={styles.retrainButtonText}>Retraining Models...</Text>
                </>
            ) : (
                <Text style={styles.retrainButtonText}>🔄 Retrain Models</Text>
            )}
        </TouchableOpacity>
    );

    // --- Main render ---
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brownie} />
                <Text style={styles.loadingText}>Loading forecasts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderHeader()}

                {errorMessage ? (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorTitle}>⚠️ ML Service Unavailable</Text>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                ) : (
                    <>
                        {renderTabs()}

                        {activeTab === 'daily' && renderDailyChart()}
                        {activeTab === 'weekly' && renderWeeklyChart()}
                        {activeTab === 'monthly' && renderMonthlyChart()}

                        {renderAccuracySection()}
                        {renderRetrainButton()}
                    </>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
};

// ==================== STYLES ====================
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
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.brownie,
    },

    // Header
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.white,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    healthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    healthDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    healthText: {
        fontSize: 12,
        color: colors.white,
        fontWeight: '600',
    },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: colors.cream,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: colors.brownie,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.brownie,
    },
    activeTabText: {
        color: colors.white,
    },

    // Charts
    chartCard: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.brownieDark,
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 12,
        color: colors.gray,
        marginBottom: 12,
    },
    chart: {
        borderRadius: 12,
        marginVertical: 8,
    },
    noDataText: {
        textAlign: 'center',
        color: colors.gray,
        fontSize: 14,
        padding: 32,
    },

    // Data table
    dataTable: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.lightGray,
        paddingTop: 12,
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.lightGray,
    },
    dataLabel: {
        flex: 1.2,
        fontSize: 13,
        fontWeight: '600',
        color: colors.brownieDark,
    },
    dataDate: {
        flex: 1.2,
        fontSize: 12,
        color: colors.gray,
    },
    dataValue: {
        flex: 0.8,
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.brownie,
        textAlign: 'center',
    },
    dataConfidence: {
        flex: 1,
        fontSize: 11,
        color: colors.info,
        textAlign: 'right',
    },

    // Weekly cards
    weeklyCards: {
        marginTop: 12,
    },
    weekCard: {
        backgroundColor: '#FFF3E0',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
    },
    weekCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.brownieDark,
    },
    weekCardDates: {
        fontSize: 11,
        color: colors.gray,
        marginBottom: 6,
    },
    weekCardTotal: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.brownie,
    },
    weekCardAvg: {
        fontSize: 12,
        color: colors.brownieLight,
    },

    // Accuracy section
    accuracySection: {
        marginHorizontal: 16,
        marginTop: 20,
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.brownieDark,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: colors.gray,
        marginTop: 2,
        marginBottom: 16,
    },
    metricsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    metricCard: {
        backgroundColor: colors.cream,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        width: '48%',
    },
    bestMetricCard: {
        borderWidth: 2,
        borderColor: colors.success,
        backgroundColor: '#F1F8E9',
    },
    bestBadge: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.success,
        marginBottom: 4,
    },
    metricModelName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.brownieDark,
        marginBottom: 8,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: colors.gray,
    },
    metricValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.brownie,
    },
    trainedAt: {
        fontSize: 11,
        color: colors.gray,
        textAlign: 'center',
        marginTop: 10,
    },

    // Retrain button
    retrainButton: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: colors.brownie,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.brownieDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    retrainButtonDisabled: {
        opacity: 0.6,
    },
    retrainButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },

    // Error
    errorCard: {
        margin: 16,
        padding: 20,
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.error,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 13,
        color: '#C62828',
        lineHeight: 20,
    },
});

export default DemandForecastScreen;
