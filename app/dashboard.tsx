import { Redirect, useRouter } from 'expo-router';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { COURSE_MODULES } from '../src/data/learning';
import { shouldRedirectToAuth } from '../src/state/authGuard';
import { useVaanika } from '../src/state/VaanikaContext';
import { Metric, PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';
import { WebBanner, WebShell, webStyles } from '../src/web/WebShell';
import { WEB_IMAGES } from '../src/web/webImages';

export default function DashboardRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === 'web' && width < 980;
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

  if (Platform.OS === 'web') {
    return (
      <WebShell
        homeHref="/dashboard"
        pageBackgroundUri={WEB_IMAGES.pageBackground}
      >
        <WebBanner
          imageUri={WEB_IMAGES.dashboardBanner}
          title={`${language.name} conversation track`}
          subtitle="Tutor-led modules with interruption handling, progress tracking, and assessment readiness."
        />
        <View style={[webStyles.dashboardGrid, isCompactWeb && { flexDirection: 'column' }]}>
          <View style={webStyles.dashboardPrimary}>
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
            <View style={[webStyles.kpiRow, isCompactWeb && { flexDirection: 'column' }]}>
              <View style={webStyles.kpiCard}>
                <Text style={webStyles.kpiLabel}>Active language</Text>
                <Text style={webStyles.kpiValue}>{language.name}</Text>
              </View>
              <View style={webStyles.kpiCard}>
                <Text style={webStyles.kpiLabel}>Course mode</Text>
                <Text style={webStyles.kpiValue}>Tutor-led</Text>
              </View>
            </View>

            <View style={[styles.actionRow, isCompactWeb && { flexDirection: 'column' }]}>
              <PrimaryButton
                label="Start lesson"
                onPress={() => {
                  startLesson();
                  router.push('/lesson');
                }}
              />
              <SecondaryButton label="Assessment" onPress={() => router.push('/assessment')} />
            </View>
            <View style={[styles.actionRow, isCompactWeb && { flexDirection: 'column' }]}>
              <SecondaryButton label="Edit onboarding" onPress={() => router.push('/onboarding')} />
              <SecondaryButton
                label="Sign out"
                onPress={() => {
                  void signOutUser();
                  router.replace('/');
                }}
              />
            </View>
          </View>

          <View style={webStyles.dashboardSecondary}>
            <View style={styles.providerPanel}>
              <Text style={styles.providerTitle}>{language.name} provider route</Text>
              <View style={[styles.providerRow, isCompactWeb && { flexDirection: 'column' }]}>
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
          </View>
        </View>
      </WebShell>
    );
  }

  return (
    <ScreenShell homeHref="/dashboard">
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
