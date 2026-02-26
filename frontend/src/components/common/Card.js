import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

/*
 * This is a reusable Card component.
 * It is used to wrap and display related content neatly,
 * such as booking details or menu items.
 */
const Card = ({ children, style }) => {
    return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.cream,
        borderRadius: 12,           // Rounded corners
        padding: 16,                // Internal spacing
        marginVertical: 8,          // Vertical separation between cards
        marginHorizontal: 16,       // Horizontal spacing from screen edges

        // Shadow (iOS)
        shadowColor: colors.brownie,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,

        // Shadow (Android)
        elevation: 3,

        // Subtle border
        borderWidth: 1,
        borderColor: colors.brownieLight + '30', // 30% opacity
    },
});

export default Card;
