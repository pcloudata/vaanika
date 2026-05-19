import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
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
  const { authStatus, canSubmitAssessment, completeAssessment, language, userId } = useVaanika();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus === 'signed_out' || !userId) {
      router.replace('/auth');
    }
  }, [authStatus, router, userId]);

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
        label={submitting ? 'Submitting...' : 'Submit assessment'}
        onPress={async () => {
          if (!canSubmitAssessment) {
            Alert.alert('Assessment locked', 'Complete at least one lesson before submitting assessment.');
            return;
          }
          try {
            setSubmitting(true);
            await completeAssessment();
            router.replace('/badge');
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Could not submit assessment right now.';
            Alert.alert('Assessment blocked', message);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </ScreenShell>
  );
}
