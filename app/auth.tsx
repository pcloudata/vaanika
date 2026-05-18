import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';

type AuthFormMode = 'sign_in' | 'sign_up';

export default function AuthRoute() {
  const router = useRouter();
  const { authError, authMode, authNotice, authStatus, signIn, signUp } = useVaanika();
  const [formMode, setFormMode] = useState<AuthFormMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);
    setLocalError(null);

    try {
      if (!email.trim() || password.length < 6) {
        setLocalError('Enter a valid email and a password with at least 6 characters.');
        return;
      }

      const isSignedIn =
        formMode === 'sign_in' ? await signIn({ email, password }) : await signUp({ email, password });

      if (!isSignedIn) {
        return;
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
        <Text style={styles.summaryCopy}>
          Learner profile and course rows are saved after onboarding, once the app knows your language and goal.
        </Text>
        <Text style={styles.authStatus}>Status: {authStatus.replace('_', ' ')}</Text>
      </View>

      <View style={styles.segmentGroup}>
        {(['sign_in', 'sign_up'] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => {
              setFormMode(mode);
              setLocalError(null);
            }}
            style={[styles.segment, formMode === mode && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, formMode === mode && styles.segmentTextActive]}>
              {mode === 'sign_in' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
        ))}
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
        <View style={styles.passwordField}>
          <TextInput
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            placeholderTextColor="#7b857f"
            secureTextEntry={!isPasswordVisible}
            style={styles.passwordInput}
            value={password}
          />
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleText}>{isPasswordVisible ? '◉' : '◎'}</Text>
          </Pressable>
        </View>
      </View>

      {authNotice && <Text style={styles.noticeText}>{authNotice}</Text>}
      {(localError || authError) && <Text style={styles.errorText}>{localError ?? authError}</Text>}

      <View style={styles.actionRow}>
        <PrimaryButton
          label={isSubmitting ? 'Working...' : formMode === 'sign_in' ? 'Sign in' : 'Create account'}
          onPress={() => {
            void submit();
          }}
        />
        <SecondaryButton
          label={formMode === 'sign_in' ? 'Need an account?' : 'Already have one?'}
          onPress={() => {
            setFormMode(formMode === 'sign_in' ? 'sign_up' : 'sign_in');
            setLocalError(null);
          }}
        />
      </View>
    </ScreenShell>
  );
}
