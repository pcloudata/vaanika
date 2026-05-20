import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Text, TextInput, View } from 'react-native';
import { shouldRedirectToAuth } from '../src/state/authGuard';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, styles } from '../src/ui/VaanikaUI';
import type { AssessmentResponses } from '../src/types/learning';
import { WebBanner, WebShell } from '../src/web/WebShell';
import { WEB_IMAGES } from '../src/web/webImages';

const ASSESSMENT_TASKS: Array<{ key: keyof AssessmentResponses; title: string; prompt: string }> = [
  { key: 'speaking', title: 'Speaking roleplay', prompt: 'Write what you would say in a short roleplay exchange.' },
  { key: 'listening', title: 'Listening prompt', prompt: 'Summarize what you understood from a tutor sentence.' },
  { key: 'vocabulary', title: 'Vocabulary check', prompt: 'Use 3 target words in one or two sentences.' },
  { key: 'reading', title: 'Reading task', prompt: 'Explain the meaning of a short reading passage in your own words.' },
  { key: 'response', title: 'Short response', prompt: 'Answer a practical conversational question in the target language.' },
];

export default function AssessmentRoute() {
  const router = useRouter();
  const { assessmentBlockReason, authStatus, canSubmitAssessment, completeAssessment, language, userId } = useVaanika();
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<AssessmentResponses>({
    speaking: '',
    listening: '',
    vocabulary: '',
    reading: '',
    response: '',
  });

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
          imageUri={WEB_IMAGES.assessmentBanner}
          title={`${language.name} assessment`}
          subtitle="Complete all sections to get a model-graded score, strengths report, and badge decision."
        />
        <View style={styles.summaryPanel}>
          <Text style={styles.eyebrow}>{language.name} skill check</Text>
          <Text style={styles.summaryTitle}>Mixed assessment</Text>
          <Text style={styles.summaryCopy}>
            Speaking roleplay, listening comprehension, vocabulary, reading, and short-response tasks
            determine badge readiness.
          </Text>
          {!canSubmitAssessment && assessmentBlockReason ? (
            <Text style={styles.optionMeta}>Locked: {assessmentBlockReason}</Text>
          ) : null}
        </View>
        {ASSESSMENT_TASKS.map((task, index) => (
          <View key={task.key} style={styles.moduleCard}>
            <Text style={styles.moduleNumber}>Task {index + 1}</Text>
            <Text style={styles.moduleTitle}>{task.title}</Text>
            <Text style={styles.moduleCopy}>{task.prompt}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.optionMeta}>Your answer</Text>
              <TextInput
                multiline
                onChangeText={(value) => setResponses((current) => ({ ...current, [task.key]: value }))}
                placeholder="Type your response..."
                placeholderTextColor="#7b857f"
                style={styles.textArea}
                value={responses[task.key]}
              />
            </View>
          </View>
        ))}
        <PrimaryButton
          label={submitting ? 'Submitting...' : 'Submit assessment'}
          disabled={submitting || !canSubmitAssessment}
          onPress={async () => {
            if (!canSubmitAssessment) {
              Alert.alert('Assessment locked', assessmentBlockReason ?? 'Complete at least one lesson before submitting assessment.');
              return;
            }
            const hasAnyMissing = ASSESSMENT_TASKS.some((task) => responses[task.key].trim().length < 8);
            if (hasAnyMissing) {
              Alert.alert('Assessment incomplete', 'Please add a fuller response for each task before submitting.');
              return;
            }
            try {
              setSubmitting(true);
              await completeAssessment(responses);
              router.replace('/badge');
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Could not submit assessment right now.';
              Alert.alert('Assessment blocked', message);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </WebShell>
    );
  }

  return (
    <ScreenShell homeHref="/dashboard">
      <View style={styles.summaryPanel}>
        <Text style={styles.eyebrow}>{language.name} skill check</Text>
        <Text style={styles.summaryTitle}>Mixed assessment</Text>
        <Text style={styles.summaryCopy}>
          Speaking roleplay, listening comprehension, vocabulary, reading, and short-response tasks
          determine badge readiness.
        </Text>
        {!canSubmitAssessment && assessmentBlockReason ? (
          <Text style={styles.optionMeta}>Locked: {assessmentBlockReason}</Text>
        ) : null}
      </View>
      {ASSESSMENT_TASKS.map((task, index) => (
        <View key={task.key} style={styles.moduleCard}>
          <Text style={styles.moduleNumber}>Task {index + 1}</Text>
          <Text style={styles.moduleTitle}>{task.title}</Text>
          <Text style={styles.moduleCopy}>{task.prompt}</Text>
          <View style={{ marginTop: 8 }}>
            <Text style={styles.optionMeta}>Your answer</Text>
            <TextInput
              multiline
              onChangeText={(value) => setResponses((current) => ({ ...current, [task.key]: value }))}
              placeholder="Type your response..."
              placeholderTextColor="#7b857f"
              style={styles.textArea}
              value={responses[task.key]}
            />
          </View>
        </View>
      ))}
      <PrimaryButton
        label={submitting ? 'Submitting...' : 'Submit assessment'}
        disabled={submitting || !canSubmitAssessment}
        onPress={async () => {
          if (!canSubmitAssessment) {
            Alert.alert('Assessment locked', assessmentBlockReason ?? 'Complete at least one lesson before submitting assessment.');
            return;
          }
          const hasAnyMissing = ASSESSMENT_TASKS.some((task) => responses[task.key].trim().length < 8);
          if (hasAnyMissing) {
            Alert.alert('Assessment incomplete', 'Please add a fuller response for each task before submitting.');
            return;
          }
          try {
            setSubmitting(true);
            await completeAssessment(responses);
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
