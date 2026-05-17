import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LANGUAGES, LEARNER_GOALS } from '../src/data/learning';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, styles } from '../src/ui/VaanikaUI';

export default function OnboardingRoute() {
  const router = useRouter();
  const { generateCourse, learnerNeed, selectedGoal, selectedLanguage, setLearnerNeed, setSelectedGoal, setSelectedLanguage } =
    useVaanika();

  return (
    <ScreenShell homeHref="/dashboard">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose a language</Text>
        <View style={styles.optionGrid}>
          {LANGUAGES.map((item) => (
            <Pressable
              key={item.code}
              onPress={() => setSelectedLanguage(item.code)}
              style={[styles.option, item.code === selectedLanguage && styles.optionActive]}
            >
              <Text style={[styles.optionTitle, item.code === selectedLanguage && styles.optionTitleActive]}>
                {item.name}
              </Text>
              <Text style={styles.optionMeta}>{item.focus}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning goal</Text>
        <View style={styles.segmentGroup}>
          {LEARNER_GOALS.map((goal) => (
            <Pressable
              key={goal}
              onPress={() => setSelectedGoal(goal)}
              style={[styles.segment, goal === selectedGoal && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, goal === selectedGoal && styles.segmentTextActive]}>
                {goal}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Need</Text>
        <TextInput
          multiline
          onChangeText={setLearnerNeed}
          placeholder="Describe why you want to learn this language"
          placeholderTextColor="#7b857f"
          style={styles.textArea}
          value={learnerNeed}
        />
      </View>

      <PrimaryButton
        label="Generate course"
        onPress={async () => {
          await generateCourse();
          router.replace('/dashboard');
        }}
      />
    </ScreenShell>
  );
}
