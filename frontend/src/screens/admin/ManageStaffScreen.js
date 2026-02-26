import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Platform,
    StatusBar,
    Image,
    KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { adminAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

/*
 * ManageStaffScreen
 * -----------------
 * This screen allows administrators to manage the cafeteria staff.
 * Key Features:
 * 1. View all registered staff members.
 * 2. Register new staff members (Name, Email, Password).
 * 3. Delete existing staff profiles.
 * 4. Input validation for the registration form.
 */
const ManageStaffScreen = () => {
    // Data Loading State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Staff Data State
    const [staff, setStaff] = useState([]);

    // Form Visibility State (Toggles the registration form)
    const [showForm, setShowForm] = useState(false);

    // Form Data State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    // Error & Submission Handling
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    /**
     * Initial fetch of staff list on component mount.
     */
    useEffect(() => {
        fetchStaff();
    }, []);

    /**
     * Calls backend API to get all users with 'staff' role.
     */
    const fetchStaff = async () => {
        try {
            setError('');
            const response = await adminAPI.getAllStaff();
            setStaff(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load staff');
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStaff();
    };

    /**
     * Validates input and submits new staff registration.
     */
    const handleRegister = async () => {
        // 1. Basic Validation
        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        // 2. Password Length Check (Security best practice)
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // 3. API Call to register
            await adminAPI.registerStaff(formData);

            // 4. Reset form and refresh list on success
            setFormData({ name: '', email: '', password: '' });
            setShowForm(false);
            Alert.alert('Success', 'Staff member registered successfully');
            fetchStaff();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register staff');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Deletes a staff member after confirmation.
     * Uses an alert dialog to prevent accidental deletions.
     */
    const handleDelete = (staffId, staffName) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${staffName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive', // Highlights button in red on iOS
                    onPress: async () => {
                        try {
                            await adminAPI.deleteStaff(staffId);
                            Alert.alert('Success', 'Staff member deleted');
                            fetchStaff();
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to delete staff');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5E3023" />
                <Text style={styles.loadingText}>Loading Team Data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* 1. Custom Gradient Header */}
            <LinearGradient
                colors={['#2D1B16', '#5E3023']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>ADMINISTRATION</Text>
                        <Text style={styles.headerSubtitle}>Manage Staff Team</Text>
                    </View>
                    <View style={styles.headerIconContainer}>
                        <MaterialCommunityIcons name="account-group" size={28} color="#FFF" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5E3023" />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* 2. Action Bar / Add Button */}
                {!showForm && (
                    <TouchableOpacity
                        style={styles.addButton}
                        activeOpacity={0.8}
                        onPress={() => {
                            setShowForm(true);
                            setError('');
                            setFormData({ name: '', email: '', password: '' });
                        }}
                    >
                        <LinearGradient
                            colors={['#5E3023', '#8B5E3C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.addButtonGradient}
                        >
                            <MaterialCommunityIcons name="account-plus" size={24} color="#FFF" />
                            <Text style={styles.addButtonText}>Add New Staff Member</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* 3. Registration Form Card */}
                {showForm && (
                    <View style={styles.formContainer}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>New Staff Registration</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.closeButton}>
                                <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ErrorMessage message={error} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons name="account" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. john@cafeteria.com"
                                    value={formData.email}
                                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min. 6 characters"
                                    value={formData.password}
                                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                                    secureTextEntry={true}
                                />
                            </View>
                        </View>

                        <Button
                            title="Create Account"
                            onPress={handleRegister}
                            loading={submitting}
                            style={styles.submitButton}
                        />
                    </View>
                )}

                {/* 4. Staff List */}
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>TEAM MEMBERS</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{staff.length}</Text>
                    </View>
                </View>

                {staff.length > 0 ? (
                    <View style={styles.gridContainer}>
                        {staff.map((member) => (
                            <View key={member._id} style={styles.staffCard}>
                                <View style={styles.avatarContainer}>
                                    <LinearGradient
                                        colors={['#E0F2FE', '#BAE6FD']}
                                        style={styles.avatarGradient}
                                    >
                                        <Text style={styles.avatarText}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                </View>

                                <View style={styles.cardInfo}>
                                    <Text style={styles.staffName} numberOfLines={1}>{member.name}</Text>
                                    <Text style={styles.staffEmail} numberOfLines={1}>{member.email}</Text>
                                    <View style={styles.roleBadge}>
                                        <Text style={styles.roleText}>STAFF</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.deleteAction}
                                    onPress={() => handleDelete(member._id, member.name)}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyStateText}>No staff members found.</Text>
                        <Text style={styles.emptyStateSubtext}>Add your first team member using the button above.</Text>
                    </View>
                )}

                {/* Decorative Footer Illustration */}
                <View style={styles.decorativeFooter}>
                    <View style={styles.decorativeIcons}>
                        <MaterialCommunityIcons name="coffee-outline" size={60} color="rgba(94, 48, 35, 0.1)" />
                        <MaterialCommunityIcons name="chef-hat" size={100} color="rgba(94, 48, 35, 0.15)" style={{ marginHorizontal: -20, marginTop: -30 }} />
                        <MaterialCommunityIcons name="silverware-fork-knife" size={60} color="rgba(94, 48, 35, 0.1)" />
                    </View>
                    <Text style={styles.decorativeText}>Streamline Your Service</Text>
                    <Text style={styles.decorativeSubtext}>Manage your cafeteria team efficiently</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        // Removed border radius for modern flat look
        shadowColor: '#5E3023',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 10,
        borderRadius: 12,
    },
    content: {
        flex: 1,
        paddingTop: 0,
    },
    addButton: {
        marginHorizontal: 16,
        marginTop: 20, // Added significant spacing from header
        marginBottom: 20,
        shadowColor: '#5E3023',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        borderRadius: 16,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 20, // Added spacing from header
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 6,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    submitButton: {
        marginTop: 8,
        borderRadius: 12,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginRight: 10,
    },
    badge: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    gridContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    staffCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 12, // Ensure spacing between items
        borderWidth: 1,
        borderColor: 'transparent', // Prepare for potential hover state
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatarGradient: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0284C7',
    },
    cardInfo: {
        flex: 1,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    staffEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
    },
    roleBadge: {
        backgroundColor: '#F3F4F6',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    deleteAction: {
        padding: 10,
        backgroundColor: '#FEF2F2', // Light red background
        borderRadius: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 4,
    },
    decorativeFooter: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 20,
        opacity: 0.8,
    },
    decorativeIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    decorativeText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(94, 48, 35, 0.3)',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    decorativeSubtext: {
        fontSize: 12,
        color: 'rgba(94, 48, 35, 0.2)',
        marginTop: 4,
        fontStyle: 'italic',
    },
});

export default ManageStaffScreen;
