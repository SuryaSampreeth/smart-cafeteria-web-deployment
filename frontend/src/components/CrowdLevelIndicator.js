import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

/*
 * Visual component to display crowd density.
 * Uses color-coded icons and text to indicate if the cafeteria is:
 * - Low Crowd (Green)
 * - Medium Crowd (Orange)
 * - High Crowd (Red)
 * 
 * Props:
 * - level: 'low' | 'medium' | 'high'
 * - occupancyRate: Number (0-100)
 * - slotName: Optional name of the slot (e.g., "Lunch")
 * - size: 'small' | 'medium' | 'large' (Controls icon/font scaling)
 * - showBorder: boolean (Adds a colored left border accent)
 * - enableHover: boolean (Adds a hover scale effect)
 */
const CrowdLevelIndicator = ({
    level,
    occupancyRate,
    slotName,
    size = 'medium',
    showBorder = false,
    enableHover = false
}) => {
    // Animation value for scale
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Mapping of crowd levels to specific UI styles (Color, Icon, Label)
    const getLevelConfig = () => {
        switch (level) {
            case 'low':
                return {
                    color: colors.success,         // Green
                    icon: 'account-group-outline',
                    label: 'Low Crowd',
                    bgColor: '#E8F5E9',           // Light Green background
                };
            case 'medium':
                return {
                    color: colors.warning,         // Orange
                    icon: 'account-group',
                    label: 'Medium Crowd',
                    bgColor: '#FFF3E0',           // Light Orange background
                };
            case 'high':
                return {
                    color: colors.error,           // Red
                    icon: 'account-multiple',
                    label: 'High Crowd',
                    bgColor: '#FFEBEE',           // Light Red background
                };
            default:
                return {
                    color: colors.gray,
                    icon: 'help-circle-outline',
                    label: 'Unknown',
                    bgColor: colors.lightGray,
                };
        }
    };

    const config = getLevelConfig();

    const sizeConfig = {
        small: {
            iconSize: 20,
            fontSize: 12,
            padding: 6,
        },
        medium: {
            iconSize: 28,
            fontSize: 14,
            padding: 10,
        },
        large: {
            iconSize: 40,
            fontSize: 18,
            padding: 14,
        },
    };

    const currentSize = sizeConfig[size];

    const handleHoverIn = () => {
        if (!enableHover) return;
        Animated.spring(scaleAnim, {
            toValue: 1.02,
            useNativeDriver: true,
            friction: 7,
            tension: 40
        }).start();
    };

    const handleHoverOut = () => {
        if (!enableHover) return;
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
            tension: 40
        }).start();
    };

    // Style Calculation
    const containerStyle = [
        styles.container,
        {
            backgroundColor: config.bgColor,
            transform: [{ scale: scaleAnim }]
        },
        showBorder && {
            borderLeftWidth: 6,
            borderLeftColor: config.color
        }
    ];

    return (
        <Pressable
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={({ pressed }) => [
                // Optional: add pressed state visual if needed
            ]}
        >
            <Animated.View style={containerStyle}>
                {/* Icon Section with dynamic padding */}
                <View style={[styles.iconContainer, { padding: currentSize.padding }]}>
                    <MaterialCommunityIcons
                        name={config.icon}
                        size={currentSize.iconSize}
                        color={config.color}
                    />
                </View>

                {/* Text Details Section */}
                <View style={styles.textContainer}>
                    {/* Optional Slot Name (e.g., "Breakfast") */}
                    {slotName && (
                        <Text style={[styles.slotName, { fontSize: currentSize.fontSize + 2 }]}>
                            {slotName}
                        </Text>
                    )}

                    {/* Crowd Label (e.g., "High Crowd") */}
                    <Text style={[styles.label, { fontSize: currentSize.fontSize, color: config.color }]}>
                        {config.label}
                    </Text>

                    {/* Exact Percentage (e.g., "85% Full") */}
                    <Text style={[styles.percentage, { fontSize: currentSize.fontSize - 1 }]}>
                        {occupancyRate}% Full
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        marginVertical: 6,
        // Standard shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden', // Ensures border radius clips content
    },
    iconContainer: {
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white backing for icon
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    slotName: {
        fontWeight: 'bold',
        color: colors.brownie,
        marginBottom: 2,
    },
    label: {
        fontWeight: '600',
        marginBottom: 2,
    },
    percentage: {
        color: colors.gray,
        fontWeight: '500',
    },
});

export default CrowdLevelIndicator;