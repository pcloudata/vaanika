import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';

export default function AuthRoute() {
  const router = useRouter();
  const { authError, authMode, authStatus, signIn, signUp } = useVaanika();
  const [email, setEmail] = useState('learner@vaanika.app');
  const [password, setPassword] = useState('password123');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (mode: 'sign_in' | 'sign_up') => {
    setIsSubmitting(true);
    setLocalError(null);

    try {
      if (mode === 'sign_in') {
        await signIn({ email, password });
      } else {
        await signUp({ email, password });
      }

      router.replace('/onboarding');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenShell homeHref="/">
      <View style={styles.summaryPanel}>
        <Text style={styles.eyebrow}>{authMode === 'mock' ? 'Mock auth' : 'Supabase auth'}</Text>
        <Text style={styles.summaryTitle}>Learner account</Text>
        <Text style={styles.summaryCopy}>
          Use an account to persist language choice, generated courses, lesson progress, and skill badges.
        </Text>
        <Text style={styles.authStatus}>Status: {authStatus.replace('_', ' ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#7b857f"
          style={styles.textInput}
          value={email}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password</Text>
        <TextInput
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          placeholderTextColor="#7b857f"
          secureTextEntry
          style={styles.textInput}
          value={password}
        />
      </View>

      {(localError || authError) && <Text style={styles.errorText}>{localError ?? authError}</Text>}

      <View style={styles.actionRow}>
        <PrimaryButton
          label={isSubmitting ? 'Signing in...' : 'Sign in'}
          onPress={() => {
            void submit('sign_in');
          }}
        />
        <SecondaryButton
          label={isSubmitting ? 'Creating...' : 'Create account'}
          onPress={() => {
            void submit('sign_up');
          }}
        />
      </View>
    </ScreenShell>
  );
}
