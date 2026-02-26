/**
 *Design System - Typography
 * --------------------------
 * Standardizes text styles across the application.
 * 
 * Usage:
 * Spread these objects into your style definitions.
 * Example: { ...typography.h1, color: colors.brownie }
 */
export const typography = {
    // Page Headers
    h1: { fontSize: 32, fontWeight: 'bold', fontFamily: 'System' },

    // Section Headers
    h2: { fontSize: 24, fontWeight: 'bold', fontFamily: 'System' },

    // Card Titles / Subsections
    h3: { fontSize: 20, fontWeight: '600', fontFamily: 'System' },

    // Standard Body Text
    body: { fontSize: 16, fontWeight: 'normal', fontFamily: 'System' },

    // Helper Text / Subtitles
    caption: { fontSize: 14, fontWeight: 'normal', fontFamily: 'System' },

    // Actionable Text (Buttons)
    button: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },

    // Tiny Text (Timestamps, Tags)
    small: { fontSize: 12, fontWeight: 'normal', fontFamily: 'System' },
};
