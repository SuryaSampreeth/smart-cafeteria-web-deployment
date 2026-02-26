import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { colors } from '../../styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width > 768;

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#F3E9DC', '#5E3023']}
            style={styles.backgroundImage}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardContainer}
            >
                <View style={styles.container}>
                    <View style={styles.centeredCard}>
                        {/* Left Panel - Image/Branding */}
                        {isLargeScreen && (
                            <View style={styles.leftPanel}>
                                <ImageBackground
                                    source={require('../../../assets/images/food/cafeteria_bg.png')}
                                    style={styles.imageBackground}
                                    resizeMode="cover"
                                >
                                    <LinearGradient
                                        colors={['rgba(94, 48, 35, 0.85)', 'rgba(61, 31, 23, 0.9)']}
                                        style={styles.imageOverlay}
                                    >
                                        <View style={styles.brandingContent}>
                                            <Ionicons name="restaurant" size={50} color="#FFF" />
                                            <Text style={styles.brandTitle}>Smart Cafeteria</Text>
                                            <Text style={styles.brandSubtitle}>
                                                Your Digital Dining Experience
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </View>
                        )}

                        {/* Right Panel - Form */}
                        <ScrollView
                            style={styles.rightPanel}
                            contentContainerStyle={styles.formContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.formContent}>
                                <View style={styles.header}>
                                    <Text style={styles.welcomeText}>Welcome Back</Text>
                                    <Text style={styles.subtitle}>Login to your account</Text>
                                </View>

                                <ErrorMessage message={error} />

                                <View style={styles.formFields}>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="mail-outline" size={20} color={colors.brownie} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter your email"
                                                placeholderTextColor="#999"
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.label}>Password</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="lock-closed-outline" size={20} color={colors.brownie} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter your password"
                                                placeholderTextColor="#999"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    <Button
                                        title="Login"
                                        onPress={handleLogin}
                                        loading={loading}
                                        style={styles.loginButton}
                                    />

                                    <View style={styles.divider}>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.dividerText}>or</Text>
                                        <View style={styles.dividerLine} />
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Register')}
                                        style={styles.signupLink}
                                    >
                                        <Text style={styles.signupText}>
                                            Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardContainer: {
        flex: 1,
        width: '100%',
    },
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    centeredCard: {
        flexDirection: isLargeScreen ? 'row' : 'column',
        width: '100%',
        maxWidth: 900,
        height: isLargeScreen ? 600 : undefined,
        maxHeight: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    leftPanel: {
        flex: 1,
        width: '50%',
    },
    imageBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    brandingContent: {
        alignItems: 'center',
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    brandSubtitle: {
        fontSize: 16,
        color: '#F3E9DC',
        textAlign: 'center',
        opacity: 0.9,
    },
    rightPanel: {
        flex: isLargeScreen ? 1 : undefined,
        width: isLargeScreen ? '50%' : '100%',
        backgroundColor: '#FAFAFA',
    },
    formContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 40,
    },
    formContent: {
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        marginBottom: 30,
        alignItems: isLargeScreen ? 'flex-start' : 'center',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.brownie,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    formFields: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.brownie,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    loginButton: {
        marginTop: 10,
        height: 50,
        borderRadius: 8,
        backgroundColor: colors.brownie,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 14,
    },
    signupLink: {
        alignItems: 'center',
    },
    signupText: {
        fontSize: 14,
        color: '#666',
    },
    signupTextBold: {
        color: colors.brownie,
        fontWeight: '600',
    },
});

export default LoginScreen;
