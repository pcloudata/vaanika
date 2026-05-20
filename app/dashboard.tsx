import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { COURSE_MODULES } from '../src/data/learning';
import { shouldRedirectToAuth } from '../src/state/authGuard';
import { useVaanika } from '../src/state/VaanikaContext';
import { Metric, PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';

export default function DashboardRoute() {
  const router = useRouter();
  const {
    courseProgress,
    dataStatus,
    authStatus,
    language,
    learnerNeed,
    mockCourse,
    providerPlan,
    runtimeProviders,
    selectedGoal,
    signOutUser,
    startLesson,
    userId,
  } = useVaanika();

  if (shouldRedirectToAuth(authStatus, userId)) {
    return <Redirect href="/auth" />;
  }

  return (
    <ScreenShell homeHref="/">
      <View style={styles.summaryPanel}>
        <Text style={styles.eyebrow}>{language.name} adaptive course</Text>
        <Text style={styles.summaryTitle}>{selectedGoal} practice</Text>
        <Text style={styles.summaryCopy}>{learnerNeed}</Text>
        <Text style={styles.authStatus}>Learner: {userId ?? 'not signed in'}</Text>
        <Text style={styles.authStatus}>Data: {dataStatus}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: courseProgress }]} />
        </View>
        <Text style={styles.optionMeta}>{courseProgress} complete</Text>
      </View>

      <View style={styles.providerPanel}>
        <Text style={styles.providerTitle}>{language.name} provider route</Text>
        <View style={styles.providerRow}>
          <Metric label="Voice" value={runtimeProviders.voice.name} />
          <Metric label="Tutor brain" value={runtimeProviders.tutorBrain.name} />
        </View>
        <Text style={styles.providerCopy}>{providerPlan.rationale}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Modules</Text>
        {(mockCourse?.modules ?? COURSE_MODULES).map((module, index) => (
          <View key={module.title} style={styles.moduleCard}>
            <Text style={styles.moduleNumber}>Module {index + 1}</Text>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <Text style={styles.moduleCopy}>{module.description}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: module.progress }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <PrimaryButton
          label="Start lesson"
          onPress={() => {
            startLesson();
            router.push('/lesson');
          }}
        />
        <SecondaryButton label="Assessment" onPress={() => router.push('/assessment')} />
      </View>
      <SecondaryButton label="Edit onboarding" onPress={() => router.push('/onboarding')} />
      <SecondaryButton
        label="Sign out"
        onPress={() => {
          void signOutUser();
          router.replace('/');
        }}
      />
    </ScreenShell>
  );
}
