import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useVaanika } from '../src/state/VaanikaContext';
import { Metric, PrimaryButton, ScreenShell, styles } from '../src/ui/VaanikaUI';

export default function BadgeRoute() {
  const router = useRouter();
  const { assessmentFeedback, assessmentPassed, assessmentScore, authStatus, awardedBadgeTitle, language, userId } = useVaanika();

  useEffect(() => {
    if (authStatus === 'signed_out' || !userId) {
      router.replace('/auth');
    }
  }, [authStatus, router, userId]);

  return (
    <ScreenShell homeHref="/dashboard">
      <View style={styles.badgeCard}>
        <Text style={styles.eyebrow}>{assessmentPassed ? 'Skill badge earned' : 'Assessment submitted'}</Text>
        <Text style={styles.badgeName}>{awardedBadgeTitle}</Text>
        <Text style={styles.badgeDescription}>
          {assessmentFeedback}
        </Text>
        <View style={styles.scoreGrid}>
          <Metric label="Score" value={`${assessmentScore}%`} />
          <Metric label="Status" value={assessmentPassed ? 'Passed' : 'Retry'} />
          <Metric label="Language" value={language.name} />
        </View>
      </View>
      <PrimaryButton label="Return to dashboard" onPress={() => router.replace('/dashboard')} />
    </ScreenShell>
  );
}
