import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { RecordingPresets, useAudioRecorder } from 'expo-audio';
import { Mic, Square } from 'lucide-react-native';
import {
  buildStepGuidance,
  classifyLearnerUtterance,
  evaluatePracticeResponse,
  getLessonPlan,
} from '../src/services/lesson/lessonOrchestrator';
import { recordPracticeOutcome } from '../src/services/progress/masteryService';
import { appendTranscriptTurn, completeTrackedLessonSession, startTrackedLessonSession } from '../src/services/session/sessionTrackingService';
import {
  buildFollowUpReply,
  buildSpokenFollowUpReply,
  prepareVoiceRuntime,
  speakTutorLine,
  transcribeRecordedAudio,
  stopTutorSpeech,
} from '../src/services/voice/liveVoiceSession';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';
import type { TutorMessage } from '../src/types/learning';

export default function LessonRoute() {
  const router = useRouter();
  const { authStatus, completeLesson, language, mockCourse, providerPlan, runtimeProviders, selectedLanguage, userId } = useVaanika();
  const [lessonTurns, setLessonTurns] = useState<TutorMessage[]>([]);
  const [voiceReady, setVoiceReady] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [isRecordingInterruption, setIsRecordingInterruption] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const lessonPlan = useMemo(() => getLessonPlan(selectedLanguage), [selectedLanguage]);
  const currentStep = lessonPlan.steps[Math.min(stepIndex, lessonPlan.steps.length - 1)];
  const supportsInterruptions = true;
  const transcript = lessonTurns;
  const introLine = useMemo(
    () => buildStepGuidance(currentStep, language.name),
    [currentStep, language.name],
  );
  const voiceStatus = useMemo(() => {
    if (!voiceReady) {
      return 'Voice setup in progress...';
    }

    if (isRecordingInterruption) {
      return 'Listening to your interruption...';
    }

    if (busy) {
      return 'Processing voice...';
    }

    if (isTutorSpeaking) {
      return 'Tutor is speaking...';
    }

    return 'Voice ready.';
  }, [voiceReady, isRecordingInterruption, busy, isTutorSpeaking]);

  useEffect(() => {
    prepareVoiceRuntime()
      .then(() => {
        setVoiceReady(true);
      })
      .catch((error: unknown) => {
        Alert.alert('Voice setup failed', getErrorMessage(error));
      });
  }, []);

  useEffect(() => {
    if (authStatus === 'signed_out' || !userId) {
      router.replace('/auth');
    }
  }, [authStatus, router, userId]);

  useEffect(() => {
    setLessonTurns([]);
    setSessionId(null);
    setStepIndex(0);
    setFollowUpCount(0);
  }, [selectedLanguage]);

  return (
    <ScreenShell homeHref="/dashboard">
      <View style={styles.sessionCard}>
        <View style={styles.pulse} />
        <View style={styles.sessionText}>
          <Text style={styles.sessionTitle}>{language.name} conversation practice</Text>
          <Text style={styles.sessionMeta}>
            {runtimeProviders.voice.name} voice route. Transcript enabled.{' '}
            {supportsInterruptions ? 'Realtime interruptions enabled.' : 'Turn-based fallback enabled.'}
          </Text>
        </View>
      </View>

      {transcript.map((message, index) => (
        <View
          key={`${message.role}-${index}-${message.text}`}
          style={[styles.message, message.role === 'learner' ? styles.learnerMessage : styles.tutorMessage]}
        >
          <Text style={styles.messageRole}>{message.role === 'learner' ? 'You' : 'Vaanika'}</Text>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      ))}

      <View style={styles.actionRow}>
        <SecondaryButton
          label={isTutorSpeaking ? 'Stop tutor audio' : 'Start tutor audio'}
          onPress={async () => {
            if (isTutorSpeaking) {
              await stopTutorSpeech(runtimeProviders.voice.name);
              setIsTutorSpeaking(false);
              return;
            }

            if (!voiceReady || !introLine) {
              Alert.alert('Voice not ready', 'Please allow microphone access first.');
              return;
            }

            try {
              setBusy(true);
              setLessonTurns([]);
              setSessionId(null);
              if (userId && mockCourse) {
                const nextSessionId = await startTrackedLessonSession({
                  courseId: mockCourse.id,
                  learnerId: userId,
                  providerPlan,
                });
                if (nextSessionId) {
                  setSessionId(nextSessionId);
                }
              }
              setIsTutorSpeaking(true);
              setLessonTurns([
                { role: 'tutor', text: currentStep.teachLine },
                { role: 'tutor', text: currentStep.practicePrompt },
              ]);
              await speakTutorLine(introLine, selectedLanguage, runtimeProviders.voice.name);
            } catch (error: unknown) {
              Alert.alert('Tutor audio failed', getErrorMessage(error));
            } finally {
              setBusy(false);
              setIsTutorSpeaking(false);
            }
          }}
        />
        <PrimaryButton
          label="Complete lesson"
          onPress={async () => {
            try {
              setBusy(true);
              await stopTutorSpeech(runtimeProviders.voice.name);
              setIsTutorSpeaking(false);
              if (sessionId) {
                await completeTrackedLessonSession(sessionId);
              }
              completeLesson();
              router.replace('/dashboard');
            } catch (error: unknown) {
              Alert.alert('Could not complete lesson', getErrorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Pressable
          disabled={!voiceReady || busy}
          onPress={async () => {
            if (isRecordingInterruption) {
              if (!hasRecording) {
                return;
              }

              try {
                setBusy(true);
                setIsRecordingInterruption(false);
                await recorder.stop();
                const learnerText = await transcribeRecordedAudio(recorder.uri, selectedLanguage, runtimeProviders.voice.name);
                const utteranceType = classifyLearnerUtterance(learnerText, currentStep, selectedLanguage);
                let tutorText = '';
                let tutorSpeechText = '';

                if (utteranceType === 'unclear') {
                  tutorText = `I could not catch that clearly. Please repeat slowly: ${currentStep.practicePrompt}`;
                  tutorSpeechText = tutorText;
                } else if (utteranceType === 'followup') {
                  setFollowUpCount((count) => count + 1);
                  const followUpAnswer = await buildFollowUpReply(learnerText, selectedLanguage);
                  const resumeLine = `Let us continue with this step: ${currentStep.practicePrompt}`;
                  tutorText = `${followUpAnswer}\n\n${resumeLine}`;
                  tutorSpeechText = await buildSpokenFollowUpReply(learnerText, selectedLanguage, followUpAnswer);
                } else {
                  const evaluation = await evaluatePracticeResponse(learnerText, currentStep, selectedLanguage);
                  if (userId && mockCourse) {
                    await recordPracticeOutcome({
                      courseId: mockCourse.id,
                      learnerId: userId,
                      passed: evaluation.passed,
                    });
                  }
                  if (evaluation.passed) {
                    const isLastStep = stepIndex >= lessonPlan.steps.length - 1;
                    tutorText = isLastStep
                      ? `${evaluation.feedback} You completed this lesson. Tap Complete lesson to finish.`
                      : `${evaluation.feedback} Great, moving to the next step.`;
                    tutorSpeechText = tutorText;
                    if (!isLastStep) {
                      const nextStepIndex = stepIndex + 1;
                      const nextStep = lessonPlan.steps[nextStepIndex];
                      setStepIndex(nextStepIndex);
                      setLessonTurns((current) => [
                        ...current,
                        { role: 'learner', text: learnerText },
                        { role: 'tutor', text: tutorText },
                        { role: 'tutor', text: nextStep.teachLine },
                        { role: 'tutor', text: nextStep.practicePrompt },
                      ]);
                      if (sessionId) {
                        await appendTranscriptTurn({
                          provider: runtimeProviders.voice.name,
                          sessionId,
                          speaker: 'learner',
                          text: learnerText,
                        });
                        await appendTranscriptTurn({
                          provider: runtimeProviders.tutorBrain.name,
                          sessionId,
                          speaker: 'tutor',
                          text: tutorText,
                        });
                        await appendTranscriptTurn({
                          provider: runtimeProviders.tutorBrain.name,
                          sessionId,
                          speaker: 'tutor',
                          text: nextStep.teachLine,
                        });
                        await appendTranscriptTurn({
                          provider: runtimeProviders.tutorBrain.name,
                          sessionId,
                          speaker: 'tutor',
                          text: nextStep.practicePrompt,
                        });
                      }
                      await speakTutorLine(
                        `${tutorSpeechText} ${buildStepGuidance(nextStep, language.name)}`,
                        selectedLanguage,
                        runtimeProviders.voice.name,
                      );
                      return;
                    }
                  } else {
                    tutorText = `${evaluation.feedback} Try again: ${currentStep.practicePrompt}`;
                    tutorSpeechText = tutorText;
                  }
                }
                setLessonTurns((current) => [...current, { role: 'learner', text: learnerText }, { role: 'tutor', text: tutorText }]);
                if (sessionId) {
                  await appendTranscriptTurn({
                    provider: runtimeProviders.voice.name,
                    sessionId,
                    speaker: 'learner',
                    text: learnerText,
                  });
                  await appendTranscriptTurn({
                    provider: runtimeProviders.tutorBrain.name,
                    sessionId,
                    speaker: 'tutor',
                    text: tutorText,
                  });
                }
                await speakTutorLine(tutorSpeechText, selectedLanguage, runtimeProviders.voice.name);
              } catch (error: unknown) {
                Alert.alert('Interruption failed', getErrorMessage(error));
              } finally {
                setHasRecording(false);
                setBusy(false);
                setIsRecordingInterruption(false);
              }
              return;
            }

            if (!voiceReady || busy) {
              return;
            }

            try {
              await stopTutorSpeech(runtimeProviders.voice.name);
              setIsTutorSpeaking(false);

              await recorder.prepareToRecordAsync();
              recorder.record();
              setIsRecordingInterruption(true);
              setHasRecording(true);
            } catch (error: unknown) {
              Alert.alert('Recording failed', getErrorMessage(error));
            }
          }}
          style={{
            alignItems: 'center',
            backgroundColor: isRecordingInterruption ? '#c7422b' : '#20352d',
            borderRadius: 32,
            height: 64,
            justifyContent: 'center',
            opacity: !voiceReady || busy ? 0.6 : 1,
            width: 64,
          }}
        >
          {busy ? (
            <ActivityIndicator color="#fffdf8" />
          ) : isRecordingInterruption ? (
            <Square color="#fffdf8" size={24} />
          ) : (
            <Mic color="#fffdf8" size={24} />
          )}
        </Pressable>
        <Text style={[styles.sessionMeta, { marginTop: 8 }]}>
          {isRecordingInterruption ? 'Tap to stop and send' : 'Tap mic to speak'}
        </Text>
      </View>
      <Text style={styles.sessionMeta}>{voiceStatus}</Text>
      <Text style={styles.sessionMeta}>
        Step {Math.min(stepIndex + 1, lessonPlan.steps.length)} of {lessonPlan.steps.length} in {lessonPlan.title}
      </Text>
      <Text style={styles.sessionMeta}>Voice follow-ups captured: {followUpCount}</Text>
    </ScreenShell>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
