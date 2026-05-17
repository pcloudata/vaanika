import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Redirect href="/" />
    </SafeAreaProvider>
  );
}
