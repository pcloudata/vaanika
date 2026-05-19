import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';

export default function WelcomeRoute() {
  const router = useRouter();
  const { authStatus } = useVaanika();

  return (
    <ScreenShell badgeLabel="MVP">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>A mobile AI tutor built for real conversation practice.</Text>
        <Text style={styles.heroCopy}>
          Vaanika creates an adaptive course, speaks with the learner, answers interruptions, tracks
          mastery, and awards internal skill badges.
        </Text>
      </View>
      <View style={styles.actionRow}>
        <PrimaryButton label="Start onboarding" onPress={() => router.push('/onboarding')} />
        <SecondaryButton label="Sign in" onPress={() => router.push('/auth')} />
      </View>
      <SecondaryButton
        label="Preview course"
        onPress={() => router.push(authStatus === 'signed_in' ? '/dashboard' : '/auth')}
      />
    </ScreenShell>
  );
}
