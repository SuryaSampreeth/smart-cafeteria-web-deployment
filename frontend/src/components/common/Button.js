import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

/*
 * This is a reusable Button component used across the app.
 * It supports multiple styles like primary, secondary, and outline.
 *
 * Props:
 * - title: Text shown on the button
 * - onPress: Function called when button is pressed
 * - variant: Button style type
 * - disabled: Disables button interaction
 * - loading: Shows a loading spinner instead of text
 */
const Button = ({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) => {
    // Combine base button styles with variant and disabled styles
    const buttonStyle = [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'outline' && styles.buttonOutline,
        disabled && styles.buttonDisabled,
        style,
    ];
    // Text styles based on variant and disabled state
    const textStyle = [
        styles.buttonText,
        variant === 'secondary' && styles.buttonTextSecondary,
        variant === 'outline' && styles.buttonTextOutline,
        disabled && styles.buttonTextDisabled,
    ];

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {/* Show loader when button is in loading state  */}
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? colors.brownie : colors.cream} />
            ) : (
                <Text style={textStyle}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.brownie,
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    buttonSecondary: {
        backgroundColor: colors.brownieLight,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.brownie,
    },
    buttonDisabled: {
        backgroundColor: colors.gray,
        opacity: 0.6,
    },
    buttonText: {
        color: colors.cream,
        ...typography.button,
    },
    buttonTextSecondary: {
        color: colors.cream,
    },
    buttonTextOutline: {
        color: colors.brownie,
    },
    buttonTextDisabled: {
        color: colors.lightGray,
    },
});

export default Button;
