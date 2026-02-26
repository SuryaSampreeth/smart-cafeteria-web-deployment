import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Main navigation container */}
        <AppNavigator />

        {/* Auto-style status bar based on theme */}
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
