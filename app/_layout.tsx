import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VaanikaProvider } from '../src/state/VaanikaContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <VaanikaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </VaanikaProvider>
    </SafeAreaProvider>
  );
}
