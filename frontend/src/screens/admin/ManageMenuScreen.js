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
import { menuAPI } from '../../services/api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

// Local Image Mapping
const localImages = {
    'biryani': require('../../../assets/images/food/biryani.jpg'),
    'chicken curry': require('../../../assets/images/food/chicken_curry.jpg'),
    'coffee': require('../../../assets/images/food/coffee.jpg'),
    'dal': require('../../../assets/images/food/dal.jpg'),
    'dosa': require('../../../assets/images/food/dosa.jpg'),
    'gulab jamun': require('../../../assets/images/food/gulab_jamun.jpg'),
    'ice cream': require('../../../assets/images/food/ice_cream.jpg'),
    'idli': require('../../../assets/images/food/idli.jpg'),
    'pakora': require('../../../assets/images/food/pakora.jpg'),
    'pancake': require('../../../assets/images/food/pancake.jpg'),
    'paneer curry': require('../../../assets/images/food/paneer_curry.jpg'),
    'poha': require('../../../assets/images/food/poha.jpg'),
    'rice': require('../../../assets/images/food/rice.jpg'),
    'roti': require('../../../assets/images/food/roti.jpg'),
    'samosa': require('../../../assets/images/food/samosa.jpg'),
    'sandwich': require('../../../assets/images/food/sandwich.jpg'),
    'tea': require('../../../assets/images/food/tea.jpg'),
    'veg biryani': require('../../../assets/images/food/veg_biryani.jpg'),
};

const getMenuImage = (itemName, remoteUrl) => {
    if (!itemName) return null;
    const normalizedName = itemName.toLowerCase();

    // 1. Try exact local match
    if (localImages[normalizedName]) return localImages[normalizedName];

    // 2. Try partial local match (e.g., "Masala Dosa" -> matches "dosa")
    for (const key in localImages) {
        if (normalizedName.includes(key)) return localImages[key];
    }

    // 3. Use remote URL if valid
    if (remoteUrl && remoteUrl.startsWith('http')) return { uri: remoteUrl };

    // 4. Fallback placeholder
    return { uri: `https://ui-avatars.com/api/?name=${itemName.replace(' ', '+')}&background=random` };
};

/*
 * ManageMenuScreen
 * ----------------
 * Allows the admin to curate the cafeteria's food menu.
 * Key Functionalities:
 * 1. List all available menu items.
 * 2. Create new items with details (Price, Category, Description).
 * 3. Assign items to specific time slots (Breakfast, Lunch, etc.).
 * 4. Delete items from the menu.
 */
const ManageMenuScreen = () => {
    // UI Loading States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data States
    const [menuItems, setMenuItems] = useState([]); // List of all food items
    const [slots, setSlots] = useState([]);         // List of available time slots

    // Form Interaction State
    const [showForm, setShowForm] = useState(false); // Toggle add item form
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'veg',  // Default category
        price: '',
        imageUrl: '',
    });

    // Multi-select state for assigning item to multiple slots
    const [selectedSlots, setSelectedSlots] = useState([]);

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    /**
     * Initial data load: Get Menu Items AND Slots
     */
    useEffect(() => {
        fetchMenuItems();
        fetchSlots();
    }, []);

    /**
     * Fetches the complete list of menu items from the backend.
     */
    const fetchMenuItems = async () => {
        try {
            setError('');
            const response = await menuAPI.getAllMenuItems();
            setMenuItems(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load menu items');
            console.error('Error fetching menu items:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Fetches time slots (Breakfast, Lunch, Dinner) so items can be linked to them.
     */
    const fetchSlots = async () => {
        try {
            const response = await menuAPI.getAllSlots();
            setSlots(response.data);
        } catch (err) {
            console.error('Error fetching slots:', err);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMenuItems();
    };

    /**
     * core Logic: Add New Menu Item
     * -----------------------------
     * 1. Validates form inputs.
     * 2. Creates the menu item via API.
     * 3. Iterates through selected slots and updates their menu lists.
     *    (Note: This N+1 API call pattern is simple but could be optimized in future backend iterations)
     */
    const handleAddItem = async () => {
        // 1. Validation
        if (!formData.name || !formData.description || !formData.price) {
            setError('Please fill in all required fields');
            return;
        }

        if (selectedSlots.length === 0) {
            setError('Please select at least one slot');
            return;
        }

        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            setError('Please enter a valid price');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // 2. Create the menu item
            const itemResponse = await menuAPI.addMenuItem({
                ...formData,
                price,
                // Use placeholder if no image URL provided
                imageUrl: formData.imageUrl || 'https://via.placeholder.com/150?text=' + formData.name,
            });

            const newItemId = itemResponse.data._id;

            // 3. Assign item to selected slots
            for (const slotId of selectedSlots) {
                // Fetch existing menu for this slot to preserve other items
                const menuResponse = await menuAPI.getMenuBySlot(slotId);
                const existingItemIds = menuResponse.data.menuItems?.map(item => item._id) || [];

                // Add new item to the list (avoid duplicates)
                if (!existingItemIds.includes(newItemId)) {
                    existingItemIds.push(newItemId);
                }

                // Update the slot's menu
                await menuAPI.assignMenuToSlot(slotId, { menuItems: existingItemIds });
            }

            // 4. Cleanup and Feedback
            setFormData({
                name: '',
                description: '',
                category: 'veg',
                price: '',
                imageUrl: '',
            });
            setSelectedSlots([]);
            setShowForm(false);
            Alert.alert('Success', 'Menu item added and assigned to selected slots');
            fetchMenuItems();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add menu item');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Deletes a menu item.
     */
    const handleDelete = (itemId, itemName) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${itemName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await menuAPI.deleteMenuItem(itemId);
                            Alert.alert('Success', 'Menu item deleted');
                            fetchMenuItems();
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to delete menu item');
                        }
                    },
                },
            ]
        );
    };

    /**
     * Helper to handle multi-selection of slots (checkbox logic).
     */
    const toggleSlotSelection = (slotId) => {
        setSelectedSlots(prev => {
            if (prev.includes(slotId)) {
                return prev.filter(id => id !== slotId); // Uncheck
            } else {
                return [...prev, slotId]; // Check
            }
        });
    };

    /**
     * Returns color codes for food categories.
     */
    const getCategoryColor = (category) => {
        switch (category) {
            case 'veg': return colors.success;
            case 'non-veg': return colors.error;
            case 'beverage': return colors.info;
            case 'dessert': return colors.warning;
            default: return colors.gray;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5E3023" />
                <Text style={styles.loadingText}>Loading Menu...</Text>
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
                        <Text style={styles.headerTitle}>MENU MANAGEMENT</Text>
                        <Text style={styles.headerSubtitle}>Curate Daily Offerings</Text>
                    </View>
                    <View style={styles.headerIconContainer}>
                        <MaterialCommunityIcons name="food-variant" size={28} color="#FFF" />
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
                            setFormData({
                                name: '',
                                description: '',
                                category: 'veg',
                                price: '',
                                imageUrl: '',
                            });
                            setSelectedSlots([]);
                        }}
                    >
                        <LinearGradient
                            colors={['#5E3023', '#8B5E3C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.addButtonGradient}
                        >
                            <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#FFF" />
                            <Text style={styles.addButtonText}>Add New Menu Item</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* 3. Add Item Form Card */}
                {showForm && (
                    <View style={styles.formContainer}>
                        <LinearGradient colors={['#FFFFFF', '#FDFBF7']} style={styles.formGradient}>
                            <View style={styles.formHeader}>
                                <Text style={styles.formTitle}>New Menu Item</Text>
                                <TouchableOpacity onPress={() => setShowForm(false)} style={styles.closeButton}>
                                    <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ErrorMessage message={error} />

                            {/* Name & Price Row */}
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 2, marginRight: 12 }]}>
                                    <Text style={styles.label}>Item Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <MaterialCommunityIcons name="food" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. Masala Dosa"
                                            value={formData.name}
                                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Price (₹)</Text>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.currencySymbol}>₹</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="50"
                                            value={formData.price}
                                            onChangeText={(text) => setFormData({ ...formData, price: text })}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start' }]}>
                                    <TextInput
                                        style={[styles.input, { height: '100%', textAlignVertical: 'top', paddingTop: 8 }]}
                                        placeholder="Brief description of the item..."
                                        value={formData.description}
                                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryContainer}>
                                {['veg', 'non-veg', 'beverage', 'dessert'].map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryPill,
                                            formData.category === cat && styles.categoryPillActive,
                                            { borderColor: getCategoryColor(cat) }
                                        ]}
                                        onPress={() => setFormData({ ...formData, category: cat })}
                                    >
                                        <MaterialCommunityIcons
                                            name={cat === 'veg' ? 'leaf' : cat === 'non-veg' ? 'food-drumstick' : cat === 'beverage' ? 'cup' : 'cake'}
                                            size={16}
                                            color={formData.category === cat ? '#FFF' : getCategoryColor(cat)}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text
                                            style={[
                                                styles.categoryPillText,
                                                { color: formData.category === cat ? '#FFF' : getCategoryColor(cat) }
                                            ]}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Available Slots</Text>
                            <View style={styles.slotsContainer}>
                                {slots.map((slot) => (
                                    <TouchableOpacity
                                        key={slot._id}
                                        style={[
                                            styles.slotChip,
                                            selectedSlots.includes(slot._id) && styles.slotChipActive
                                        ]}
                                        onPress={() => toggleSlotSelection(slot._id)}
                                    >
                                        <Text style={[
                                            styles.slotChipText,
                                            selectedSlots.includes(slot._id) && styles.slotChipTextActive
                                        ]}>{slot.name}</Text>
                                        {selectedSlots.includes(slot._id) && (
                                            <MaterialCommunityIcons name="check-circle" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Button
                                title="Save to Menu"
                                onPress={handleAddItem}
                                loading={submitting}
                                style={styles.submitButton}
                            />
                        </LinearGradient>
                    </View>
                )}

                {/* 4. Menu Items List */}
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>CURRENT OFFERS</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{menuItems.length}</Text>
                    </View>
                </View>

                {menuItems.length > 0 ? (
                    <View style={styles.gridContainer}>
                        {menuItems.map((item) => (
                            <View key={item._id} style={[styles.menuCard, { borderLeftColor: getCategoryColor(item.category) }]}>
                                <LinearGradient
                                    colors={['#FFFFFF', '#FAF9F6']}
                                    style={styles.cardGradient}
                                >
                                    <View style={styles.menuCardHeader}>
                                        <Image
                                            source={getMenuImage(item.name, item.imageUrl)}
                                            style={styles.menuImage}
                                        />
                                        <View style={styles.menuTextContainer}>
                                            <Text style={styles.menuName}>{item.name}</Text>
                                            <Text style={styles.menuDescription} numberOfLines={2}>{item.description}</Text>
                                        </View>
                                        <View style={[styles.priceBadge, { backgroundColor: getCategoryColor(item.category) + '15' }]}>
                                            <Text style={[styles.priceText, { color: getCategoryColor(item.category) }]}>₹{item.price}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.menuCardFooter}>
                                        <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) + '10' }]}>
                                            <MaterialCommunityIcons
                                                name={item.category === 'veg' ? 'leaf' : item.category === 'non-veg' ? 'food-drumstick' : item.category === 'beverage' ? 'cup' : 'cake'}
                                                size={14}
                                                color={getCategoryColor(item.category)}
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={[styles.categoryTagText, { color: getCategoryColor(item.category) }]}>{item.category.toUpperCase()}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteAction}
                                            onPress={() => handleDelete(item._id, item.name)}
                                        >
                                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="food-off" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyStateText}>Menu is empty.</Text>
                        <Text style={styles.emptyStateSubtext}>Start adding delicious items!</Text>
                    </View>
                )}

                {/* Decorative Footer */}
                <View style={styles.decorativeFooter}>
                    <View style={styles.decorativeIcons}>
                        <MaterialCommunityIcons name="silverware-spoon" size={60} color="rgba(94, 48, 35, 0.1)" />
                        <MaterialCommunityIcons name="chef-hat" size={100} color="rgba(94, 48, 35, 0.15)" style={{ marginHorizontal: -20, marginTop: -30 }} />
                        <MaterialCommunityIcons name="food-croissant" size={60} color="rgba(94, 48, 35, 0.1)" />
                    </View>
                    <Text style={styles.decorativeText}>Culinary Excellence</Text>
                    <Text style={styles.decorativeSubtext}>Curating the best for our community</Text>
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
        // Flat modern look
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
        marginTop: 20,
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
        marginTop: 20,
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderTopWidth: 6,
        borderTopColor: '#5E3023', // Strong top accent
        overflow: 'hidden', // Contain the gradient
    },
    formGradient: {
        padding: 20,
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9CA3AF',
        marginRight: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    categoryPillActive: {
        backgroundColor: '#5E3023', // Will be overridden dynamically
    },
    categoryPillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    slotsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    slotChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
        marginRight: 8,
        marginBottom: 8,
    },
    slotChipActive: {
        backgroundColor: '#5E3023',
        borderColor: '#5E3023',
    },
    slotChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    slotChipTextActive: {
        color: '#FFFFFF',
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
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
        borderLeftWidth: 6, // Thick colored accent
        overflow: 'hidden', // Contain the gradient
    },
    cardGradient: {
        padding: 16,
    },
    menuCardHeader: {
        flexDirection: 'row',
        alignItems: 'center', // Align center vertically because image height
        marginBottom: 12,
    },
    menuImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    menuTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    menuName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    menuDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    priceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    priceText: {
        fontSize: 14,
        fontWeight: '800',
    },
    menuCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    categoryTagText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    deleteAction: {
        padding: 6,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
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
        marginTop: 40,
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

export default ManageMenuScreen;
