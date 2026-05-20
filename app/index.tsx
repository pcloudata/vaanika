import { useRouter } from 'expo-router';
import { ImageBackground, Platform, Text, View } from 'react-native';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';
import { WebShell, webStyles } from '../src/web/WebShell';
import { WEB_IMAGES } from '../src/web/webImages';

export default function WelcomeRoute() {
  const router = useRouter();
  const { authStatus } = useVaanika();

  if (Platform.OS === 'web') {
    return (
      <WebShell pageBackgroundUri={WEB_IMAGES.pageBackground}>
        <View style={webStyles.pageGrid}>
          <View style={webStyles.twoColumn}>
            <View style={webStyles.columnMain}>
              <ImageBackground
                source={{ uri: WEB_IMAGES.homeHero }}
                style={webStyles.hero}
                imageStyle={{ borderRadius: 12 }}
              >
                <View style={webStyles.heroOverlay} />
                <View style={webStyles.heroContent}>
                  <Text style={webStyles.heroTitle}>Speak naturally. Learn faster. Stay consistent.</Text>
                  <Text style={webStyles.heroCopy}>
                    Vaanika builds adaptive lessons, handles follow-up interruptions, tracks mastery, and
                    grades speaking progress with a real tutor flow.
                  </Text>
                </View>
              </ImageBackground>
              <View style={styles.actionRow}>
                <PrimaryButton label="Start onboarding" onPress={() => router.push('/onboarding')} />
                <SecondaryButton label="Sign in" onPress={() => router.push('/auth')} />
              </View>
            </View>
            <View style={webStyles.columnSide}>
              <View style={webStyles.sideCard}>
                <Text style={webStyles.sectionLabel}>For learners</Text>
                <Text style={webStyles.sideTitle}>Daily practice, tutor-style flow</Text>
                <Text style={webStyles.sideCopy}>
                  Each lesson is guided step-by-step, with interruption support and instant follow-up
                  answers before returning to the active step.
                </Text>
              </View>
              <View style={webStyles.sideCard}>
                <Text style={webStyles.sectionLabel}>Progress and badges</Text>
                <Text style={webStyles.sideCopy}>
                  Your sessions, assessment attempts, completion signals, and badge awards are tracked to
                  Supabase with policy enforcement.
                </Text>
              </View>
            </View>
          </View>
          <View style={webStyles.previewRow}>
            <View style={webStyles.previewButtonWrap}>
              <SecondaryButton
                label="Preview course"
                onPress={() => router.push(authStatus === 'signed_in' ? '/dashboard' : '/auth')}
              />
            </View>
          </View>
        </View>
      </WebShell>
    );
  }

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
