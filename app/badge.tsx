import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { shouldRedirectToAuth } from '../src/state/authGuard';
import { useVaanika } from '../src/state/VaanikaContext';
import { Metric, PrimaryButton, ScreenShell, styles } from '../src/ui/VaanikaUI';

export default function BadgeRoute() {
  const router = useRouter();
  const { assessmentFeedback, assessmentPassed, assessmentScore, assessmentSubscores, authStatus, awardedBadgeTitle, language, userId } = useVaanika();
  const bestDimension = getDimensionLabel(getTopDimension(assessmentSubscores, 'max'));
  const weakestDimension = getDimensionLabel(getTopDimension(assessmentSubscores, 'min'));

  useEffect(() => {
    if (shouldRedirectToAuth(authStatus, userId)) {
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
        {assessmentSubscores ? (
          <View style={styles.scoreGrid}>
            <Metric label="Strongest" value={bestDimension} />
            <Metric label="Needs work" value={weakestDimension} />
            <Metric label="Overall" value={`${assessmentSubscores.overall}%`} />
          </View>
        ) : null}
      </View>
      <PrimaryButton label="Return to dashboard" onPress={() => router.replace('/dashboard')} />
    </ScreenShell>
  );
}

function getTopDimension(
  subscores: { speaking: number; listening: number; vocabulary: number; reading: number; response: number } | null,
  mode: 'max' | 'min',
): 'speaking' | 'listening' | 'vocabulary' | 'reading' | 'response' | null {
  if (!subscores) {
    return null;
  }

  const entries: Array<['speaking' | 'listening' | 'vocabulary' | 'reading' | 'response', number]> = [
    ['speaking', subscores.speaking],
    ['listening', subscores.listening],
    ['vocabulary', subscores.vocabulary],
    ['reading', subscores.reading],
    ['response', subscores.response],
  ];

  return entries.reduce((best, next) => {
    if (!best) {
      return next;
    }

    if (mode === 'max') {
      return next[1] > best[1] ? next : best;
    }

    return next[1] < best[1] ? next : best;
  }, null as [typeof entries[number][0], number] | null)?.[0] ?? null;
}

function getDimensionLabel(value: 'speaking' | 'listening' | 'vocabulary' | 'reading' | 'response' | null): string {
  if (value === 'speaking') {
    return 'Speaking';
  }

  if (value === 'listening') {
    return 'Listening';
  }

  if (value === 'vocabulary') {
    return 'Vocabulary';
  }

  if (value === 'reading') {
    return 'Reading';
  }

  if (value === 'response') {
    return 'Response';
  }

  return 'N/A';
}
