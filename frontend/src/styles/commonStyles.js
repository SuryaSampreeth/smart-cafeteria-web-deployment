import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Design System - Common Styles
 * -----------------------------
 * Reusable style definitions for consistent UI components.
 * Use these for containers, cards, inputs, and buttons to maintain visual unity.
 */
export const commonStyles = StyleSheet.create({
    // Main screen container
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // Centered content (loading screens, auth screens)
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    // Standard white card with shadow
    card: {
        backgroundColor: colors.cream,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        // Shadow for iOS
        shadowColor: colors.brownie,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.brownieLight,
    },
    // Primary Action Button
    button: {
        backgroundColor: colors.brownie,
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: colors.cream,
        fontSize: 16,
        fontWeight: '600',
    },
    // Form Inputs
    input: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.brownieLight,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    // Active Input State (to be merged with input style)
    inputFocused: {
        borderColor: colors.brownie,
        borderWidth: 2,
    },
    // Status Badges (Pills)
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.white,
    },
});
