import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { tutorMessages } from '../src/data/learning';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';

export default function LessonRoute() {
  const router = useRouter();
  const { completeLesson, language, runtimeProviders, selectedLanguage } = useVaanika();
  const messages = tutorMessages[selectedLanguage];
  const supportsInterruptions = runtimeProviders.voice.name !== 'Sarvam';

  return (
    <ScreenShell homeHref="/dashboard">
      <View style={styles.sessionCard}>
        <View style={styles.pulse} />
        <View style={styles.sessionText}>
          <Text style={styles.sessionTitle}>{language.name} conversation practice</Text>
          <Text style={styles.sessionMeta}>
            {runtimeProviders.voice.name} voice route. Transcript enabled.{' '}
            {supportsInterruptions ? 'Realtime interruptions enabled.' : 'Turn-based Tamil voice test enabled.'}
          </Text>
        </View>
      </View>

      {messages.map((message) => (
        <View
          key={message.text}
          style={[styles.message, message.role === 'learner' ? styles.learnerMessage : styles.tutorMessage]}
        >
          <Text style={styles.messageRole}>{message.role === 'learner' ? 'You' : 'Vaanika'}</Text>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      ))}

      <View style={styles.actionRow}>
        <SecondaryButton label="Ask follow-up" onPress={() => undefined} />
        <PrimaryButton
          label="Complete lesson"
          onPress={() => {
            completeLesson();
            router.replace('/dashboard');
          }}
        />
      </View>
    </ScreenShell>
  );
}
