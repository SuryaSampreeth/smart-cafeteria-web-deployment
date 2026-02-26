import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Platform,
    StatusBar,
    TouchableOpacity,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';

const DataBackupScreen = () => {
    const [loading, setLoading] = useState(false);
    const [backupData, setBackupData] = useState(null);
    const [error, setError] = useState('');

    const handleBackup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminAPI.triggerDataBackup();
            setBackupData(res.data);
            if (Platform.OS === 'web') {
                alert('Success: Database backup successfully generated.');
            } else {
                Alert.alert('Success', 'Database backup successfully generated.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to trigger backup');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const d = new Date(dateString);
        return d.toLocaleString();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.logoContainer}>
                            <MaterialCommunityIcons name="database-sync" size={24} color="#0F172A" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>AUTOMATED DATA BACKUP</Text>
                            <Text style={styles.welcomeText}>System Snapshots</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {error ? (
                    <View style={styles.errorBanner}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.backupCard}>
                    <View style={styles.backupHeader}>
                        <View style={styles.backupIconContainer}>
                            <MaterialCommunityIcons name="cloud-upload" size={32} color="#0F172A" />
                        </View>
                        <View style={styles.backupHeaderText}>
                            <Text style={styles.backupTitle}>Manual Snapshot Trigger</Text>
                            <Text style={styles.backupSubtitle}>Create an immediate backup of all system collections</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.backupButton, loading && styles.backupButtonDisabled]}
                        onPress={handleBackup}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        ) : (
                            <MaterialCommunityIcons name="backup-restore" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.backupButtonText}>
                            {loading ? 'GENERATING BACKUP...' : 'TRIGGER BACKUP NOW'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {backupData && (
                    <View style={styles.resultContainer}>
                        <Text style={styles.sectionHeader}>LAST BACKUP DETAILS</Text>

                        <View style={styles.resultCard}>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Timestamp</Text>
                                <Text style={styles.resultValue}>{formatDate(backupData.timestamp)}</Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.subTitle}>Collections Saved</Text>
                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxLabel}>Users</Text>
                                    <Text style={styles.statBoxValue}>{backupData.collections.users}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxLabel}>Bookings</Text>
                                    <Text style={styles.statBoxValue}>{backupData.collections.bookings}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxLabel}>Slots</Text>
                                    <Text style={styles.statBoxValue}>{backupData.collections.slots}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statusBox}>
                                <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
                                <Text style={styles.statusText}>{backupData.message}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    headerGradient: { paddingTop: Platform.OS === 'ios' ? 40 : 20, paddingBottom: 24, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    logoContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    headerTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4 },
    welcomeText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
    scrollView: { flex: 1, marginTop: -10 },
    scrollContent: { paddingTop: 24, paddingHorizontal: 16 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FECACA' },
    errorText: { color: '#991B1B', marginLeft: 8, fontSize: 13, fontWeight: '600', flex: 1 },
    backupCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    backupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backupIconContainer: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    backupHeaderText: { flex: 1 },
    backupTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    backupSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
    backupButton: { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    backupButtonDisabled: { opacity: 0.7 },
    backupButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    resultContainer: { flex: 1 },
    sectionHeader: { fontSize: 13, fontWeight: '900', color: '#9CA3AF', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' },
    resultCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    resultLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    resultValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
    subTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 12 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    statBoxLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
    statBoxValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' },
    statusText: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginLeft: 8, flex: 1 },
});

export default DataBackupScreen;
