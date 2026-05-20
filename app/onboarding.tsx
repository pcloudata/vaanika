import { Redirect, useRouter } from 'expo-router';
import { Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LANGUAGES, LEARNER_GOALS } from '../src/data/learning';
import { shouldRedirectToAuth } from '../src/state/authGuard';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, styles } from '../src/ui/VaanikaUI';
import { WebBanner, WebShell } from '../src/web/WebShell';
import { WEB_IMAGES } from '../src/web/webImages';

export default function OnboardingRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === 'web' && width < 860;
  const { authStatus, generateCourse, learnerNeed, selectedGoal, selectedLanguage, setLearnerNeed, setSelectedGoal, setSelectedLanguage, userId } =
    useVaanika();

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
          imageUri={WEB_IMAGES.onboardingBanner}
          title="Set up your learning path"
          subtitle="Choose language, define your goal, and tell Vaanika what kind of speaking outcomes you want."
        />
        <View style={styles.summaryPanel}>
          <Text style={styles.eyebrow}>Personalized onboarding</Text>
          <Text style={styles.summaryTitle}>Build your adaptive course</Text>
          <Text style={styles.summaryCopy}>
            Your selections here are used to generate modules, tutor prompts, and lesson progression for your profile.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a language</Text>
          <View style={styles.optionGrid}>
            {LANGUAGES.map((item) => (
              <Pressable
                key={item.code}
                onPress={() => setSelectedLanguage(item.code)}
                style={[
                  styles.option,
                  isCompactWeb && { width: '100%' },
                  item.code === selectedLanguage && styles.optionActive,
                ]}
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
      </WebShell>
    );
  }

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
