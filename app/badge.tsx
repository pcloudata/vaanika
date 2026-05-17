import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useVaanika } from '../src/state/VaanikaContext';
import { Metric, PrimaryButton, ScreenShell, styles } from '../src/ui/VaanikaUI';

export default function BadgeRoute() {
  const router = useRouter();
  const { assessmentScore, language } = useVaanika();

  return (
    <ScreenShell homeHref="/dashboard">
      <View style={styles.badgeCard}>
        <Text style={styles.eyebrow}>Skill badge earned</Text>
        <Text style={styles.badgeName}>{language.name} Conversation Basics</Text>
        <Text style={styles.badgeDescription}>
          Internal Vaanika badge for completing the adaptive course path and passing the mixed
          conversation assessment.
        </Text>
        <View style={styles.scoreGrid}>
          <Metric label="Score" value={`${assessmentScore}%`} />
          <Metric label="Status" value="Passed" />
          <Metric label="Type" value="Internal" />
        </View>
      </View>
      <PrimaryButton label="Return to dashboard" onPress={() => router.replace('/dashboard')} />
    </ScreenShell>
  );
}
