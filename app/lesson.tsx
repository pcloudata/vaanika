import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
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
import { TUTOR_GIF_FALLBACK } from '../src/media/tutorVideo';
import { TutorAvatar } from '../src/ui/TutorAvatar';
import type { InterruptionSnapshot, LessonPhase, TutorMessage } from '../src/types/learning';

type TutorWindowState = 'idle' | 'teaching' | 'listening' | 'answering';

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
  const [tutorWindowState, setTutorWindowState] = useState<TutorWindowState>('idle');
  const [recordStartAt, setRecordStartAt] = useState<number | null>(null);
  const tutorPulse = useRef(new Animated.Value(1)).current;
  const tutorGlow = useRef(new Animated.Value(0.22)).current;
  const voiceBarA = useRef(new Animated.Value(0.45)).current;
  const voiceBarB = useRef(new Animated.Value(0.75)).current;
  const voiceBarC = useRef(new Animated.Value(0.55)).current;
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const classFlowTokenRef = useRef(0);
  const interruptionPauseRef = useRef(false);
  const activePhaseRef = useRef<LessonPhase>(activePhase);
  const activeStepIdRef = useRef<string>(activeStepId);
  const lessonReadyRef = useRef<boolean>(lessonReadyToComplete);
  const recordingRef = useRef(isRecordingInterruption);
  const busyRef = useRef(busy);
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
  const tutorIsAnimating = tutorWindowState === 'teaching' || tutorWindowState === 'answering';
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
    const shouldAnimate = tutorWindowState === 'teaching' || tutorWindowState === 'answering';
    if (!shouldAnimate) {
      tutorPulse.setValue(1);
      tutorGlow.setValue(0.22);
      voiceBarA.setValue(0.42);
      voiceBarB.setValue(0.62);
      voiceBarC.setValue(0.5);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(tutorPulse, { toValue: 1.2, duration: 340, useNativeDriver: false }),
          Animated.timing(tutorGlow, { toValue: 0.5, duration: 340, useNativeDriver: false }),
          Animated.timing(voiceBarA, { toValue: 0.9, duration: 300, useNativeDriver: false }),
          Animated.timing(voiceBarB, { toValue: 0.36, duration: 260, useNativeDriver: false }),
          Animated.timing(voiceBarC, { toValue: 0.76, duration: 330, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(tutorPulse, { toValue: 1, duration: 340, useNativeDriver: false }),
          Animated.timing(tutorGlow, { toValue: 0.22, duration: 340, useNativeDriver: false }),
          Animated.timing(voiceBarA, { toValue: 0.4, duration: 300, useNativeDriver: false }),
          Animated.timing(voiceBarB, { toValue: 0.88, duration: 290, useNativeDriver: false }),
          Animated.timing(voiceBarC, { toValue: 0.48, duration: 320, useNativeDriver: false }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tutorGlow, tutorPulse, tutorWindowState, voiceBarA, voiceBarB, voiceBarC]);

  useEffect(() => {
    activePhaseRef.current = activePhase;
  }, [activePhase]);

  useEffect(() => {
    activeStepIdRef.current = activeStepId;
  }, [activeStepId]);

  useEffect(() => {
    lessonReadyRef.current = lessonReadyToComplete;
  }, [lessonReadyToComplete]);

  useEffect(() => {
    recordingRef.current = isRecordingInterruption;
  }, [isRecordingInterruption]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(
    () => () => {
      clearAutoAdvanceTimer();
    },
    [],
  );

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
    setTutorWindowState('idle');
    setRecordStartAt(null);
    interruptionPauseRef.current = false;
    setWebInput('');
    clearAutoAdvanceTimer();
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

    try {
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
    } catch {
      // Persistence failures should not break tutor flow.
    }
  }

  async function processLearnerInput(learnerText: string, spokenMode: boolean) {
    clearAutoAdvanceTimer();
    setTutorWindowState('listening');
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
          setTutorWindowState('answering');
          await safeSpeakTutorLine(guardLine);
        }
        setTutorWindowState('listening');
        if (!lessonReadyRef.current) {
          scheduleAutoAdvance(currentStep.id, stepIndex, spokenMode);
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
          setTutorWindowState('answering');
          await safeSpeakTutorLine(deferMessage);
        }
        setTutorWindowState('listening');
        if (!lessonReadyRef.current) {
          scheduleAutoAdvance(currentStep.id, stepIndex, spokenMode);
        }
        return;
      }
      const nextSnapshot: InterruptionSnapshot = {
        phase: activePhase,
        stepId: currentStep.id,
        stepIndex,
      };
      interruptionPauseRef.current = true;
      setInterruptionSnapshot(nextSnapshot);
      setLessonRuntime({ interruptionSnapshot: nextSnapshot });
      setFollowUpCount((count) => count + 1);
      setFollowUpsThisStep((count) => count + 1);
      const followUpAnswer = await buildFollowUpReply(learnerText, selectedLanguage);
      const shortenedAnswer = followUpAnswer.split(/\s+/).slice(0, 45).join(' ').trim();
      const resumeLine = `Back to class step ${nextSnapshot.stepIndex + 1}: ${buildPhasePrompt(currentStep, nextSnapshot.phase, language.name)}`;
      tutorText = `${shortenedAnswer}\n\n${resumeLine}`;
      if (spokenMode) {
        try {
          tutorSpeechText = await buildSpokenFollowUpReply(learnerText, selectedLanguage, followUpAnswer);
        } catch {
          tutorSpeechText = `${shortenedAnswer}. ${resumeLine}`;
        }
      } else {
        tutorSpeechText = tutorText;
      }
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
      if (!spokenMode) {
        setTutorWindowState('listening');
      }
      interruptionPauseRef.current = false;
      if (!lessonReadyRef.current) {
        scheduleAutoAdvance(nextSnapshot.stepId, nextSnapshot.stepIndex, spokenMode);
      }
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
            setTutorWindowState('teaching');
            await safeSpeakTutorLine(
              `${tutorSpeechText} ${buildStepGuidance(nextStep, language.name)}`,
            );
          }
          setTutorWindowState('listening');
          return;
        }

        await appendTurnAndPersist({ learnerText, tutorText, eventType: 'practice_pass' });
        setLessonReadyToComplete(true);
        setTutorWindowState('idle');
      } else {
        tutorText = `${evaluation.feedback} Try again: ${buildPhasePrompt(currentStep, 'PRACTICE', language.name)}`;
        tutorSpeechText = tutorText;
        await appendTurnAndPersist({ learnerText, tutorText, eventType: 'practice_retry' });
        setActivePhase('PRACTICE');
        setLessonRuntime({ activePhase: 'PRACTICE' });
        setTutorWindowState('listening');
        if (!lessonReadyRef.current) {
          scheduleAutoAdvance(currentStep.id, stepIndex, spokenMode);
        }
      }
    }

    if (spokenMode) {
      setTutorWindowState('answering');
      await safeSpeakTutorLine(tutorSpeechText);
      setTutorWindowState('listening');
      if (!lessonReadyRef.current) {
        scheduleAutoAdvance(currentStep.id, stepIndex, spokenMode);
      }
    }
  }

  async function safeSpeakTutorLine(text: string) {
    try {
      await speakTutorLine(text, selectedLanguage, runtimeProviders.voice.name);
    } catch {
      // Speech playback issues should not break class progression or show capture failures.
    }
  }

  async function deliverStepClassFlow(params: {
    playVoice: boolean;
    isFirstStep?: boolean;
    stepOverrideIndex?: number;
    token?: number;
  }) {
    const flowToken = params.token ?? classFlowTokenRef.current;
    const isFlowActive = () => flowToken === classFlowTokenRef.current;
    const effectiveStepIndex = params.stepOverrideIndex ?? stepIndex;
    const stepToTeach = lessonPlan.steps[Math.min(effectiveStepIndex, lessonPlan.steps.length - 1)];
    setActiveStepId(stepToTeach.id);
    setActivePhase('TEACH');
    setLessonRuntime({
      activePhase: 'TEACH',
      activeStepId: stepToTeach.id,
      interruptionSnapshot: null,
    });
    setTutorWindowState('teaching');

    const teachLine = buildPhasePrompt(stepToTeach, 'TEACH', language.name);
    const exampleLine = buildPhasePrompt(stepToTeach, 'EXAMPLE', language.name);
    const practiceLine = buildPhasePrompt(stepToTeach, 'PRACTICE', language.name);

    setLessonTurns((current) => {
      const next = params.isFirstStep ? [] : [...current];
      next.push({ role: 'tutor', text: teachLine });
      return next;
    });

    if (!params.playVoice) {
      await wait(520);
      if (!isFlowActive()) {
        return;
      }
    }

    setLessonTurns((current) => [...current, { role: 'tutor', text: exampleLine }]);

    if (params.playVoice) {
      await safeSpeakTutorLine(`${teachLine} ${exampleLine}`);
      if (!isFlowActive()) {
        return;
      }
    } else {
      await wait(520);
      if (!isFlowActive()) {
        return;
      }
    }

    if (!isFlowActive()) {
      return;
    }

    setLessonTurns((current) => [...current, { role: 'tutor', text: practiceLine }]);

    setActivePhase('PRACTICE');
    setLessonRuntime({ activePhase: 'PRACTICE', activeStepId: stepToTeach.id });
    setTutorWindowState('listening');
    scheduleAutoAdvance(stepToTeach.id, effectiveStepIndex, params.playVoice);
  }

  async function initializeLessonSession(playVoice: boolean) {
    classFlowTokenRef.current += 1;
    const flowToken = classFlowTokenRef.current;
    setBusy(true);
    setLessonTurns([]);
    setSessionId(null);
    setWebInput('');
    setActiveStepId(currentStep.id);
    setActivePhase('TEACH');
    setInterruptionSnapshot(null);
    setFollowUpsThisStep(0);
    setLessonReadyToComplete(false);
    setTutorWindowState('teaching');
    clearAutoAdvanceTimer();
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
    setIsTutorSpeaking(playVoice);
    await deliverStepClassFlow({ playVoice, isFirstStep: true, token: flowToken });
    setBusy(false);
    setIsTutorSpeaking(false);
  }

  function clearAutoAdvanceTimer() {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }

  function scheduleAutoAdvance(stepId: string, lessonStepIndex: number, playVoice: boolean) {
    clearAutoAdvanceTimer();
    autoAdvanceTimer.current = setTimeout(() => {
      void autoAdvanceToNextStep(stepId, lessonStepIndex, playVoice);
    }, 6000);
  }

  async function autoAdvanceToNextStep(stepId: string, lessonStepIndex: number, playVoice: boolean) {
    const flowToken = classFlowTokenRef.current;
    if (
      interruptionPauseRef.current ||
      recordingRef.current ||
      busyRef.current ||
      activePhaseRef.current !== 'PRACTICE' ||
      activeStepIdRef.current !== stepId ||
      lessonReadyRef.current
    ) {
      return;
    }

    const hasNextStep = lessonStepIndex < lessonPlan.steps.length - 1;
    if (!hasNextStep) {
      return;
    }

    const transitionLine = 'I will keep teaching the next step. You can interrupt me anytime for clarification.';
    setTutorWindowState('teaching');
    setLessonTurns((current) => [...current, { role: 'tutor', text: transitionLine }]);
    if (playVoice) {
      await safeSpeakTutorLine(transitionLine);
    } else {
      await wait(420);
    }
    if (flowToken !== classFlowTokenRef.current) {
      return;
    }

    const nextStepIndex = lessonStepIndex + 1;
    const nextStep = lessonPlan.steps[nextStepIndex];
    setStepIndex(nextStepIndex);
    setActiveStepId(nextStep.id);
    setActivePhase('TEACH');
    setFollowUpsThisStep(0);
    setLessonRuntime({
      activePhase: 'TEACH',
      activeStepId: nextStep.id,
      interruptionSnapshot: null,
    });
    await deliverStepClassFlow({ playVoice, stepOverrideIndex: nextStepIndex, token: flowToken });
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

      <View style={styles.tutorWindowDock}>
        <View style={styles.tutorWindow}>
          <Animated.View
            style={[
              styles.tutorVideoFrame,
              {
                transform: [{ scale: tutorPulse }],
                shadowOpacity: tutorGlow,
              },
            ]}
          >
            <TutorAvatar
              speaking={tutorIsAnimating || isTutorSpeaking}
              fallbackUri={TUTOR_GIF_FALLBACK}
              style={styles.tutorVideo}
            />
          </Animated.View>
          <View style={styles.tutorWindowText}>
            <Text style={styles.tutorWindowTitle}>Tutor</Text>
            <Text style={styles.tutorFace}>Live</Text>
            <Text style={styles.tutorWindowState}>
              {tutorWindowState === 'teaching'
                ? 'Teaching step'
                : tutorWindowState === 'listening'
                  ? 'Listening for practice'
                  : tutorWindowState === 'answering'
                    ? 'Answering interruption'
                    : isWeb
                      ? 'Tap Start lesson'
                      : 'Tap Start lesson audio'}
            </Text>
            <View style={styles.voiceBars}>
              <Animated.View style={[styles.voiceBar, { transform: [{ scaleY: voiceBarA }] }]} />
              <Animated.View style={[styles.voiceBar, { transform: [{ scaleY: voiceBarB }] }]} />
              <Animated.View style={[styles.voiceBar, { transform: [{ scaleY: voiceBarC }] }]} />
            </View>
          </View>
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
          label={isWeb ? 'Start lesson' : isTutorSpeaking ? 'Stop lesson audio' : 'Start lesson audio'}
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
                  setTutorWindowState('listening');
                  await recorder.stop();
                  const elapsed = recordStartAt ? Date.now() - recordStartAt : 0;
                  const uri = recorder.uri;
                  setRecordStartAt(null);

                  if (!uri || elapsed < 900) {
                    const retryLine = 'I did not catch that interruption clearly. Hold the mic a little longer and try again.';
                    setLessonTurns((current) => [...current, { role: 'tutor', text: retryLine }]);
                    setTutorWindowState('answering');
                    await safeSpeakTutorLine(retryLine);
                    setTutorWindowState('listening');
                    return;
                  }

                  let learnerText = '';
                  try {
                    learnerText = await transcribeRecordedAudio(uri, selectedLanguage, runtimeProviders.voice.name);
                  } catch {
                    const retryLine = 'I could not transcribe that interruption. Please try again.';
                    setLessonTurns((current) => [...current, { role: 'tutor', text: retryLine }]);
                    setTutorWindowState('answering');
                    await safeSpeakTutorLine(retryLine);
                    setTutorWindowState('listening');
                    return;
                  }
                  learnerText = normalizeLearnerTranscript(learnerText);
                  if (!learnerText) {
                    const retryLine = 'I did not catch that interruption clearly. Please try again.';
                    setLessonTurns((current) => [...current, { role: 'tutor', text: retryLine }]);
                    setTutorWindowState('answering');
                    await safeSpeakTutorLine(retryLine);
                    setTutorWindowState('listening');
                    return;
                  }

                  try {
                    await processLearnerInput(learnerText, true);
                  } catch {
                    const retryLine = `Let us continue this step. ${buildPhasePrompt(currentStep, 'PRACTICE', language.name)}`;
                    setLessonTurns((current) => [...current, { role: 'tutor', text: retryLine }]);
                    setTutorWindowState('answering');
                    await safeSpeakTutorLine(retryLine);
                    setTutorWindowState('listening');
                  }
                } catch (error: unknown) {
                  const retryLine = 'Interruption capture failed. Please hold the mic and try again.';
                  setLessonTurns((current) => [...current, { role: 'tutor', text: retryLine }]);
                  setTutorWindowState('answering');
                  await safeSpeakTutorLine(retryLine);
                  setTutorWindowState('listening');
                } finally {
                  setHasRecording(false);
                  setBusy(false);
                  setIsRecordingInterruption(false);
                  interruptionPauseRef.current = false;
                }
                return;
              }

              if (!voiceReady || busy) {
                return;
              }

              try {
                await stopTutorSpeech(runtimeProviders.voice.name);
                setIsTutorSpeaking(false);
                classFlowTokenRef.current += 1;
                interruptionPauseRef.current = true;
                clearAutoAdvanceTimer();
                await recorder.prepareToRecordAsync();
                recorder.record();
                setRecordStartAt(Date.now());
                setIsRecordingInterruption(true);
                setHasRecording(true);
                setTutorWindowState('listening');
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeLearnerTranscript(transcript: string) {
  const normalized = transcript.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  const lower = normalized.toLowerCase();
  const blockedPhrases = [
    'can you repeat that more slowly',
    'konjam medhuva sollunga',
    'konchem mellaga cheppandi',
    'please repeat',
  ];
  if (blockedPhrases.some((phrase) => lower.includes(phrase))) {
    return '';
  }

  const tokens = lower.split(/[\s,.;!?]+/).filter(Boolean);
  if (tokens.length >= 8) {
    const frequencies = new Map<string, number>();
    for (const token of tokens) {
      frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    }
    const maxTokenCount = Math.max(...frequencies.values());
    if (maxTokenCount / tokens.length >= 0.55) {
      return '';
    }
  }

  return normalized;
}
