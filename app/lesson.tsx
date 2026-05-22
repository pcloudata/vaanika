import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { RecordingPresets, useAudioRecorder } from 'expo-audio';
import { Mic, Square } from 'lucide-react-native';
import {
  buildPhasePrompt,
  buildStepGuidance,
  canHandleFollowUp,
  classifyLearnerUtterance,
  evaluatePracticeResponse,
  getLessonPlan,
  restoreFromInterruption,
  transitionAfterPracticeEvaluation,
} from '../src/services/lesson/lessonOrchestrator';
import { recordPracticeOutcome } from '../src/services/progress/masteryService';
import { appendTranscriptTurn, completeTrackedLessonSession, startTrackedLessonSession } from '../src/services/session/sessionTrackingService';
import { recordLessonStepEvent, type StepEventType } from '../src/services/session/stepMetricsService';
import {
  buildFollowUpReply,
  buildSpokenFollowUpReply,
  prepareVoiceRuntime,
  speakTutorLine,
  transcribeRecordedAudio,
  stopTutorSpeech,
} from '../src/services/voice/liveVoiceSession';
import { shouldRedirectToAuth } from '../src/state/authGuard';
import { useVaanika } from '../src/state/VaanikaContext';
import { PrimaryButton, ScreenShell, SecondaryButton, styles } from '../src/ui/VaanikaUI';
import { WebBanner, webStyles } from '../src/web/WebShell';
import { WEB_IMAGES } from '../src/web/webImages';
import type { InterruptionSnapshot, LessonPhase, TutorMessage } from '../src/types/learning';

export default function LessonRoute() {
  const router = useRouter();
  const {
    authStatus,
    completeLesson,
    language,
    lessonRuntime,
    mockCourse,
    providerPlan,
    runtimeProviders,
    selectedLanguage,
    setLessonRuntime,
    userId,
  } = useVaanika();
  const [lessonTurns, setLessonTurns] = useState<TutorMessage[]>([]);
  const [voiceReady, setVoiceReady] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [isRecordingInterruption, setIsRecordingInterruption] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeStepId, setActiveStepId] = useState<string>('');
  const [activePhase, setActivePhase] = useState<LessonPhase>('TEACH');
  const [interruptionSnapshot, setInterruptionSnapshot] = useState<InterruptionSnapshot | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [followUpsThisStep, setFollowUpsThisStep] = useState(0);
  const [lessonReadyToComplete, setLessonReadyToComplete] = useState(false);
  const [webInput, setWebInput] = useState('');
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const activeModuleIndex = useMemo(() => {
    const modules = mockCourse?.modules;
    if (!modules?.length) {
      return 0;
    }
    const index = modules.findIndex((module) => module.progress !== '100%');
    return index >= 0 ? index : modules.length - 1;
  }, [mockCourse?.modules]);
  const lessonPlan = useMemo(
    () => getLessonPlan(selectedLanguage, activeModuleIndex),
    [activeModuleIndex, selectedLanguage],
  );
  const currentStep = lessonPlan.steps[Math.min(stepIndex, lessonPlan.steps.length - 1)];
  const supportsInterruptions = true;
  const transcript = lessonTurns;
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isCompactWeb = isWeb && width < 900;
  const introLine = useMemo(() => buildStepGuidance(currentStep, language.name), [currentStep, language.name]);
  const voiceStatus = useMemo(() => {
    if (isWeb) {
      return busy ? 'Processing lesson response...' : 'Web lesson mode ready.';
    }
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
  }, [busy, isRecordingInterruption, isTutorSpeaking, isWeb, voiceReady]);

  useEffect(() => {
    if (isWeb) {
      setVoiceReady(false);
      return;
    }

    prepareVoiceRuntime()
      .then(() => {
        setVoiceReady(true);
      })
      .catch((error: unknown) => {
        Alert.alert('Voice setup failed', getErrorMessage(error));
      });
  }, [isWeb]);

  useEffect(() => {
    setLessonTurns([]);
    setSessionId(null);
    setStepIndex(0);
    setActiveStepId('');
    setActivePhase('TEACH');
    setInterruptionSnapshot(null);
    setFollowUpCount(0);
    setFollowUpsThisStep(0);
    setLessonReadyToComplete(false);
    setWebInput('');
  }, [selectedLanguage]);

  if (shouldRedirectToAuth(authStatus, userId)) {
    return <Redirect href="/auth" />;
  }

  async function appendTurnAndPersist(params: {
    learnerText: string;
    tutorText: string;
    eventType: StepEventType;
    includeNextStep?: { teachLine: string; exampleLine: string; practicePrompt: string };
  }) {
    setLessonTurns((current) => {
      const nextTurns: TutorMessage[] = [...current, { role: 'learner', text: params.learnerText }, { role: 'tutor', text: params.tutorText }];
      if (params.includeNextStep) {
        nextTurns.push({ role: 'tutor', text: params.includeNextStep.teachLine });
        nextTurns.push({ role: 'tutor', text: params.includeNextStep.exampleLine });
        nextTurns.push({ role: 'tutor', text: params.includeNextStep.practicePrompt });
      }
      return nextTurns;
    });

    if (!sessionId) {
      return;
    }

    await recordLessonStepEvent({
      eventType: params.eventType,
      learnerText: params.learnerText,
      lessonSessionId: sessionId,
      stepId: currentStep.id,
      stepIndex,
      tutorText: params.tutorText,
      activePhase,
    });

    await appendTranscriptTurn({
      provider: runtimeProviders.voice.name,
      sessionId,
      speaker: 'learner',
      text: params.learnerText,
    });
    await appendTranscriptTurn({
      provider: runtimeProviders.tutorBrain.name,
      sessionId,
      speaker: 'tutor',
      text: params.tutorText,
    });

    if (params.includeNextStep) {
      await appendTranscriptTurn({
        provider: runtimeProviders.tutorBrain.name,
        sessionId,
        speaker: 'tutor',
        text: params.includeNextStep.teachLine,
      });
      await appendTranscriptTurn({
        provider: runtimeProviders.tutorBrain.name,
        sessionId,
        speaker: 'tutor',
        text: params.includeNextStep.exampleLine,
      });
      await appendTranscriptTurn({
        provider: runtimeProviders.tutorBrain.name,
        sessionId,
        speaker: 'tutor',
        text: params.includeNextStep.practicePrompt,
      });
    }
  }

  async function processLearnerInput(learnerText: string, spokenMode: boolean) {
    if (activePhase !== 'PRACTICE') {
      if (activePhase === 'RUBRIC_CHECK') {
        // Recover from transient state lag and keep the learner in practice flow.
        setActivePhase('PRACTICE');
        setLessonRuntime({ activePhase: 'PRACTICE' });
      } else {
      const resumePrompt = buildPhasePrompt(currentStep, 'PRACTICE', language.name);
      const guardLine = `We are still in guided class mode. ${resumePrompt}`;
      await appendTurnAndPersist({
        learnerText,
        tutorText: guardLine,
        eventType: 'unclear',
      });
      if (spokenMode) {
        await speakTutorLine(guardLine, selectedLanguage, runtimeProviders.voice.name);
      }
      return;
      }
    }

    const utteranceType = classifyLearnerUtterance(learnerText, currentStep, selectedLanguage);
    let tutorText = '';
    let tutorSpeechText = '';

    if (utteranceType === 'unclear') {
      tutorText = `I could not catch that clearly. Please repeat slowly: ${buildPhasePrompt(currentStep, 'PRACTICE', language.name)}`;
      tutorSpeechText = tutorText;
      await appendTurnAndPersist({ learnerText, tutorText, eventType: 'unclear' });
    } else if (utteranceType === 'followup') {
      if (!canHandleFollowUp(followUpsThisStep, 2)) {
        const deferMessage = `Let us finish this practice first. I will take more questions right after this step: ${buildPhasePrompt(
          currentStep,
          'PRACTICE',
          language.name,
        )}`;
        await appendTurnAndPersist({
          learnerText,
          tutorText: deferMessage,
          eventType: 'followup',
        });
        if (spokenMode) {
          await speakTutorLine(deferMessage, selectedLanguage, runtimeProviders.voice.name);
        }
        return;
      }
      const nextSnapshot: InterruptionSnapshot = {
        phase: activePhase,
        stepId: currentStep.id,
        stepIndex,
      };
      setInterruptionSnapshot(nextSnapshot);
      setLessonRuntime({ interruptionSnapshot: nextSnapshot });
      setFollowUpCount((count) => count + 1);
      setFollowUpsThisStep((count) => count + 1);
      const followUpAnswer = await buildFollowUpReply(learnerText, selectedLanguage);
      const shortenedAnswer = followUpAnswer.split(/\s+/).slice(0, 45).join(' ').trim();
      const resumeLine = `Back to class step ${nextSnapshot.stepIndex + 1}: ${buildPhasePrompt(currentStep, nextSnapshot.phase, language.name)}`;
      tutorText = `${shortenedAnswer}\n\n${resumeLine}`;
      tutorSpeechText = spokenMode
        ? await buildSpokenFollowUpReply(learnerText, selectedLanguage, followUpAnswer)
        : tutorText;
      await appendTurnAndPersist({ learnerText, tutorText, eventType: 'followup' });
      const resumed = restoreFromInterruption(nextSnapshot);
      setActivePhase(resumed.activePhase);
      setStepIndex(resumed.stepIndex);
      setActiveStepId(resumed.activeStepId);
      setInterruptionSnapshot(null);
      setLessonRuntime({
        activePhase: resumed.activePhase,
        activeStepId: resumed.activeStepId,
        interruptionSnapshot: null,
      });
    } else {
      setActivePhase('RUBRIC_CHECK');
      setLessonRuntime({ activePhase: 'RUBRIC_CHECK' });
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
          const transitioned = transitionAfterPracticeEvaluation(
            { activePhase: 'RUBRIC_CHECK', activeStepId: currentStep.id, stepIndex },
            true,
            lessonPlan.steps.length,
            nextStep.id,
          );
          setStepIndex(transitioned.stepIndex);
          setActiveStepId(transitioned.activeStepId);
          setActivePhase(transitioned.activePhase);
          setFollowUpsThisStep(0);
          setLessonRuntime({
            activePhase: transitioned.activePhase,
            activeStepId: transitioned.activeStepId,
          });
          await appendTurnAndPersist({
            learnerText,
            tutorText,
            eventType: 'practice_pass',
            includeNextStep: {
              teachLine: buildPhasePrompt(nextStep, 'TEACH', language.name),
              exampleLine: buildPhasePrompt(nextStep, 'EXAMPLE', language.name),
              practicePrompt: buildPhasePrompt(nextStep, 'PRACTICE', language.name),
            },
          });
          if (spokenMode) {
            await speakTutorLine(
              `${tutorSpeechText} ${buildStepGuidance(nextStep, language.name)}`,
              selectedLanguage,
              runtimeProviders.voice.name,
            );
          }
          return;
        }

        await appendTurnAndPersist({ learnerText, tutorText, eventType: 'practice_pass' });
        setLessonReadyToComplete(true);
      } else {
        tutorText = `${evaluation.feedback} Try again: ${buildPhasePrompt(currentStep, 'PRACTICE', language.name)}`;
        tutorSpeechText = tutorText;
        await appendTurnAndPersist({ learnerText, tutorText, eventType: 'practice_retry' });
        setActivePhase('PRACTICE');
        setLessonRuntime({ activePhase: 'PRACTICE' });
      }
    }

    if (spokenMode) {
      await speakTutorLine(tutorSpeechText, selectedLanguage, runtimeProviders.voice.name);
    }
  }

  async function initializeLessonSession(playVoice: boolean) {
    setBusy(true);
    setLessonTurns([]);
    setSessionId(null);
    setWebInput('');
    setActiveStepId(currentStep.id);
    setActivePhase('TEACH');
    setInterruptionSnapshot(null);
    setFollowUpsThisStep(0);
    setLessonReadyToComplete(false);
    setLessonRuntime({
      activePhase: 'TEACH',
      activeStepId: currentStep.id,
      interruptionSnapshot: null,
    });
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
    setLessonTurns([
      { role: 'tutor', text: buildPhasePrompt(currentStep, 'TEACH', language.name) },
      { role: 'tutor', text: buildPhasePrompt(currentStep, 'EXAMPLE', language.name) },
      { role: 'tutor', text: buildPhasePrompt(currentStep, 'PRACTICE', language.name) },
    ]);
    setActivePhase('PRACTICE');
    setLessonRuntime({ activePhase: 'PRACTICE', activeStepId: currentStep.id });
    if (playVoice) {
      setIsTutorSpeaking(true);
      await speakTutorLine(introLine, selectedLanguage, runtimeProviders.voice.name);
    }
    setBusy(false);
    setIsTutorSpeaking(false);
  }

  return (
    <ScreenShell
      homeHref="/dashboard"
      pageBackgroundUri={WEB_IMAGES.pageBackground}
    >
      {isWeb ? (
        <WebBanner
          imageUri={WEB_IMAGES.lessonBanner}
          title={`${language.name} tutor session`}
          subtitle="Text-first web lesson with follow-up interruption handling and guided step progression."
        />
      ) : null}
      <View style={styles.sessionCard}>
        <View style={styles.pulse} />
        <View style={styles.sessionText}>
          <Text style={styles.sessionTitle}>{language.name} conversation practice</Text>
          <Text style={styles.sessionMeta}>
            {isWeb
              ? 'Web lesson mode. Text-first interaction with tutor-led step progression and interruption logic.'
              : `${runtimeProviders.voice.name} voice route. Transcript enabled. ${
                  supportsInterruptions ? 'Realtime interruptions enabled.' : 'Turn-based fallback enabled.'
                }`}
          </Text>
        </View>
      </View>

      <View style={isWeb ? webStyles.transcriptPanel : undefined}>
        {transcript.map((message, index) => (
          <View
            key={`${message.role}-${index}-${message.text}`}
            style={[styles.message, message.role === 'learner' ? styles.learnerMessage : styles.tutorMessage]}
          >
            <Text style={styles.messageRole}>{message.role === 'learner' ? 'You' : 'Vaanika'}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.actionRow, isCompactWeb && { flexDirection: 'column' }]}>
        <SecondaryButton
          label={isWeb ? 'Start lesson' : isTutorSpeaking ? 'Stop tutor audio' : 'Start tutor audio'}
          disabled={busy}
          onPress={async () => {
            if (!isWeb && isTutorSpeaking) {
              await stopTutorSpeech(runtimeProviders.voice.name);
              setIsTutorSpeaking(false);
              return;
            }

            if (!isWeb && (!voiceReady || !introLine)) {
              Alert.alert('Voice not ready', 'Please allow microphone access first.');
              return;
            }

            try {
              await initializeLessonSession(!isWeb);
            } catch (error: unknown) {
              Alert.alert(isWeb ? 'Lesson start failed' : 'Tutor audio failed', getErrorMessage(error));
              setBusy(false);
              setIsTutorSpeaking(false);
            }
          }}
        />
        <PrimaryButton
          label="Complete lesson"
          disabled={busy || !lessonReadyToComplete}
          onPress={async () => {
            if (!lessonReadyToComplete) {
              Alert.alert('Lesson in progress', 'Finish all guided steps before completing this lesson.');
              return;
            }
            try {
              setBusy(true);
              if (!isWeb) {
                await stopTutorSpeech(runtimeProviders.voice.name);
                setIsTutorSpeaking(false);
              }
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

      {isWeb ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ask or respond</Text>
          <TextInput
            editable={!busy}
            onChangeText={setWebInput}
            placeholder="Type your response or follow-up question..."
            placeholderTextColor="#7b857f"
            style={styles.textArea}
            value={webInput}
          />
          <View style={{ marginTop: 10 }}>
            <PrimaryButton
              label="Send response"
              disabled={busy || webInput.trim().length < 2}
              onPress={async () => {
                const nextInput = webInput.trim();
                if (!nextInput) {
                  return;
                }
                try {
                  setBusy(true);
                  setWebInput('');
                  await processLearnerInput(nextInput, false);
                } catch (error: unknown) {
                  Alert.alert('Message failed', getErrorMessage(error));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </View>
        </View>
      ) : (
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
                  await processLearnerInput(learnerText, true);
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
      )}

      {isWeb ? (
        <View style={styles.providerPanel}>
          <Text style={styles.providerTitle}>Session status</Text>
          <Text style={styles.providerCopy}>{voiceStatus}</Text>
          <Text style={styles.providerCopy}>
            Step {Math.min(stepIndex + 1, lessonPlan.steps.length)} of {lessonPlan.steps.length} in {lessonPlan.title}
          </Text>
          <Text style={styles.providerCopy}>Phase: {activePhase}</Text>
          <Text style={styles.providerCopy}>Active step: {activeStepId || currentStep.id}</Text>
          <Text style={styles.providerCopy}>Module: {lessonPlan.moduleTitle ?? 'Module'} ({activeModuleIndex + 1}/3)</Text>
          <Text style={styles.providerCopy}>Follow-ups in this step: {followUpsThisStep}/2</Text>
          {interruptionSnapshot ? (
            <Text style={styles.providerCopy}>
              Interruption snapshot: step {interruptionSnapshot.stepIndex + 1}, phase {interruptionSnapshot.phase}
            </Text>
          ) : null}
          <Text style={styles.providerCopy}>Voice follow-ups captured: {followUpCount}</Text>
          <Text style={styles.providerCopy}>Voice route: {runtimeProviders.voice.name}</Text>
          <Text style={styles.providerCopy}>Tutor route: {runtimeProviders.tutorBrain.name}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sessionMeta}>{voiceStatus}</Text>
        <Text style={styles.sessionMeta}>
          Step {Math.min(stepIndex + 1, lessonPlan.steps.length)} of {lessonPlan.steps.length} in {lessonPlan.title}
        </Text>
        <Text style={styles.sessionMeta}>Phase: {activePhase}</Text>
        <Text style={styles.sessionMeta}>Voice follow-ups captured: {followUpCount}</Text>
      </>
      )}
    </ScreenShell>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
