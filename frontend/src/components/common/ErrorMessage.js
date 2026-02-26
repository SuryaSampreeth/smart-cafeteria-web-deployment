import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

/*
 * This component is used to show error messages in the UI.
 * It displays a highlighted box with the error text.
 * If there is no error message, nothing is rendered.
 */
const ErrorMessage = ({ message }) => {
    if (!message) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.error + '20', // 20 adds transparency to the hex color
        borderLeftWidth: 4,                   // left side highlight
        borderLeftColor: colors.error,
        padding: 12,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 4,
    },
    text: {
        color: colors.error,
        ...typography.body,
    },
});

export default ErrorMessage;
