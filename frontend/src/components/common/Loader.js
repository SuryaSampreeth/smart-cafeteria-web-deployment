import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

/*
 * Full-screen loading indicator.
 * Displays a centered spinner on top of the background color.
 * Used while fetching data or performing async operations.
 */
const Loader = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.brownie} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // Take up full screen space
        justifyContent: 'center', // Center vertically
        alignItems: 'center', // Center horizontally
        backgroundColor: colors.background,
    },
});

export default Loader;
