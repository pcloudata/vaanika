import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, styles } from '../src/ui/VaanikaUI';

const ASSESSMENT_TASKS = [
  'Speaking roleplay',
  'Listening prompt',
  'Vocabulary check',
  'Reading task',
  'Short response',
] as const;

export default function AssessmentRoute() {
  const router = useRouter();
  const { completeAssessment, language } = useVaanika();

  return (
    <ScreenShell homeHref="/dashboard">
      <View style={styles.summaryPanel}>
        <Text style={styles.eyebrow}>{language.name} skill check</Text>
        <Text style={styles.summaryTitle}>Mixed assessment</Text>
        <Text style={styles.summaryCopy}>
          Speaking roleplay, listening comprehension, vocabulary, reading, and short-response tasks
          determine badge readiness.
        </Text>
      </View>
      {ASSESSMENT_TASKS.map((task, index) => (
        <View key={task} style={styles.moduleCard}>
          <Text style={styles.moduleNumber}>Task {index + 1}</Text>
          <Text style={styles.moduleTitle}>{task}</Text>
          <Text style={styles.moduleCopy}>Mock task ready for provider-backed scoring.</Text>
        </View>
      ))}
      <PrimaryButton
        label="Submit assessment"
        onPress={() => {
          completeAssessment();
          router.replace('/badge');
        }}
      />
    </ScreenShell>
  );
}
