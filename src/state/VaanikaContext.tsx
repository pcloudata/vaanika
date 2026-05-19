import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { COURSE_MODULES, LANGUAGES, LEARNER_GOALS } from '../data/learning';
import { getProviderPlan } from '../providers/providerRouter';
import {
  getCurrentAuthState,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  type AuthCredentials,
} from '../services/auth/authService';
import {
  generateMockCourse,
  getLatestCourseForLearner,
  saveGeneratedCourse,
  type GeneratedCourse,
} from '../services/course/mockCourseService';
import { submitAssessmentAttempt, type AssessmentOutcome } from '../services/assessment/assessmentService';
import { getLearnerProfile, saveLearnerProfile } from '../services/profile/profileService';
import { getRuntimeProviders } from '../services/providerRegistry';
import { canSubmitAssessmentFromProgress, type LessonStatus } from './assessmentGate';
import type {
  AssessmentResponses,
  AssessmentSubscores,
  LanguageCode,
  LearnerProfile,
  LearningGoal,
  LearningLanguage,
  ProviderPlan,
} from '../types/learning';
import type { RuntimeProviders } from '../services/providerRegistry';

type VaanikaState = {
  assessmentFeedback: string;
  assessmentPassed: boolean;
  assessmentScore: number;
  assessmentSubscores: AssessmentSubscores | null;
  awardedBadgeTitle: string;
  authError: string | null;
  authMode: 'mock' | 'supabase';
  authNotice: string | null;
  authStatus: 'loading' | 'signed_in' | 'signed_out';
  canSubmitAssessment: boolean;
  courseProgress: `${number}%`;
  dataStatus: 'idle' | 'loading' | 'ready' | 'error';
  language: LearningLanguage;
  learnerProfile: LearnerProfile | null;
  learnerNeed: string;
  lessonStatus: LessonStatus;
  mockCourse: GeneratedCourse | null;
  providerPlan: ProviderPlan;
  runtimeProviders: RuntimeProviders;
  selectedGoal: LearningGoal;
  selectedLanguage: LanguageCode;
  userId: string | null;
  completeAssessment: (responsesByTask: AssessmentResponses) => Promise<void>;
  completeLesson: () => void;
  generateCourse: () => Promise<void>;
  signIn: (credentials: AuthCredentials) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<boolean>;
  setLearnerNeed: (need: string) => void;
  setSelectedGoal: (goal: LearningGoal) => void;
  setSelectedLanguage: (language: LanguageCode) => void;
  startLesson: () => void;
};

const VaanikaContext = createContext<VaanikaState | null>(null);

export function VaanikaProvider({ children }: PropsWithChildren) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('ta-IN');
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal>(LEARNER_GOALS[0]);
  const [learnerNeed, setLearnerNeed] = useState('I want to speak confidently in daily conversations.');
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('not_started');
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [assessmentPassed, setAssessmentPassed] = useState(false);
  const [assessmentFeedback, setAssessmentFeedback] = useState('Assessment not submitted yet.');
  const [assessmentSubscores, setAssessmentSubscores] = useState<AssessmentSubscores | null>(null);
  const [awardedBadgeTitle, setAwardedBadgeTitle] = useState('Pending certificate');
  const [mockCourse, setMockCourse] = useState<GeneratedCourse | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<VaanikaState['authStatus']>('loading');
  const [authMode, setAuthMode] = useState<VaanikaState['authMode']>('mock');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [dataStatus, setDataStatus] = useState<VaanikaState['dataStatus']>('idle');

  const language = LANGUAGES.find((item) => item.code === selectedLanguage) ?? LANGUAGES[0];
  const providerPlan = useMemo(() => getProviderPlan(selectedLanguage), [selectedLanguage]);
  const runtimeProviders = useMemo(() => getRuntimeProviders(selectedLanguage), [selectedLanguage]);
  const courseProgress = getCourseProgress(lessonStatus, mockCourse);
  const canSubmitAssessment = canSubmitAssessmentFromProgress(lessonStatus, mockCourse?.modules);

  useEffect(() => {
    let isMounted = true;

    getCurrentAuthState()
      .then(async (authState) => {
        if (!isMounted) {
          return;
        }

        setAuthMode(authState.isConfigured ? 'supabase' : 'mock');
        setUserId(authState.userId);
        setAuthStatus(authState.userId ? 'signed_in' : 'signed_out');

        if (authState.userId && isMounted) {
          await hydrateLearnerState(authState.userId, isMounted);
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setAuthError(getErrorMessage(error));
        setAuthStatus('signed_out');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<VaanikaState>(
    () => ({
      assessmentScore,
      assessmentPassed,
      assessmentFeedback,
      assessmentSubscores,
      awardedBadgeTitle,
      canSubmitAssessment,
      authError,
      authMode,
      authNotice,
      authStatus,
      courseProgress,
      dataStatus,
      language,
      learnerProfile,
      learnerNeed,
      lessonStatus,
      mockCourse,
      providerPlan,
      runtimeProviders,
      selectedGoal,
      selectedLanguage,
      userId,
      completeAssessment: async (responsesByTask) => {
        if (!canSubmitAssessmentFromProgress(lessonStatus, mockCourse?.modules)) {
          setAssessmentScore(0);
          setAssessmentPassed(false);
          setAssessmentFeedback('Complete at least one lesson before submitting assessment.');
          setAssessmentSubscores(null);
          setAwardedBadgeTitle('Assessment locked');
          return;
        }

        if (!mockCourse || !userId) {
          const fallbackScore = selectedLanguage === 'ta-IN' ? 84 : 88;
          setAssessmentScore(fallbackScore);
          setAssessmentPassed(fallbackScore >= 75);
          setAssessmentFeedback('Saved in local mode. Connect account and course for persisted scoring.');
          setAssessmentSubscores(null);
          setAwardedBadgeTitle(`${language.name} Conversation Basics`);
          return;
        }

        const outcome: AssessmentOutcome = await submitAssessmentAttempt({
          courseId: mockCourse.id,
          languageCode: selectedLanguage,
          learnerId: userId,
          providerName: runtimeProviders.tutorBrain.name,
          responsesByTask,
        });
        setAssessmentScore(outcome.score);
        setAssessmentPassed(outcome.passed);
        setAssessmentFeedback(outcome.feedback);
        setAssessmentSubscores(outcome.subscores);
        setAwardedBadgeTitle(outcome.badgeTitle);
      },
      completeLesson: () => {
        setLessonStatus('complete');
        setMockCourse((current) => {
          if (!current) {
            return current;
          }

          const nextModules = [...current.modules];
          const moduleIndex = nextModules.findIndex((module) => module.progress !== '100%');
          if (moduleIndex >= 0) {
            nextModules[moduleIndex] = {
              ...nextModules[moduleIndex],
              progress: '100%',
            };
          }

          return {
            ...current,
            modules: nextModules,
          };
        });
      },
      generateCourse: async () => {
        setDataStatus('loading');
        const profile = await saveLearnerProfile({
          id: userId ?? 'mock-learner',
          displayName: 'Vaanika Learner',
          goal: selectedGoal,
          targetLanguage: selectedLanguage,
        });
        const generatedCourse = await generateMockCourse({
          id: profile.id,
          displayName: profile.displayName,
          goal: profile.goal,
          targetLanguage: profile.targetLanguage,
        });
        const savedCourse = await saveGeneratedCourse(profile, generatedCourse);

        setLearnerProfile(profile);
        setMockCourse(savedCourse);
        setLessonStatus('not_started');
        setAssessmentScore(0);
        setAssessmentPassed(false);
        setAssessmentFeedback('Assessment not submitted yet.');
        setAssessmentSubscores(null);
        setAwardedBadgeTitle('Pending certificate');
        setDataStatus('ready');
      },
      signIn: async (credentials) => {
        setAuthError(null);
        const authState = await signInWithEmail(credentials);

        setAuthMode(authState.isConfigured ? 'supabase' : 'mock');
        setAuthNotice(null);
        setUserId(authState.userId);
        setAuthStatus(authState.userId ? 'signed_in' : 'signed_out');

        if (authState.userId) {
          await hydrateLearnerState(authState.userId, true);
        }

        return Boolean(authState.userId);
      },
      signOutUser: async () => {
        const authState = await signOut();

        setUserId(authState.userId);
        setAuthStatus('signed_out');
        setDataStatus('idle');
        setLearnerProfile(null);
        setMockCourse(null);
      },
      signUp: async (credentials) => {
        setAuthError(null);
        const authState = await signUpWithEmail(credentials);

        setAuthMode(authState.isConfigured ? 'supabase' : 'mock');
        setAuthNotice(authState.needsEmailConfirmation ? 'Check your email to confirm the account before saving progress.' : null);
        setUserId(authState.userId);
        setAuthStatus(authState.userId ? 'signed_in' : 'signed_out');

        if (authState.userId) {
          await hydrateLearnerState(authState.userId, true);
        }

        return Boolean(authState.userId);
      },
      setLearnerNeed,
      setSelectedGoal,
      setSelectedLanguage,
      startLesson: () => setLessonStatus('in_progress'),
    }),
    [
      assessmentScore,
      assessmentPassed,
      assessmentFeedback,
      assessmentSubscores,
      awardedBadgeTitle,
      canSubmitAssessment,
      authError,
      authMode,
      authNotice,
      authStatus,
      courseProgress,
      dataStatus,
      language,
      learnerProfile,
      learnerNeed,
      lessonStatus,
      mockCourse,
      providerPlan,
      runtimeProviders,
      selectedGoal,
      selectedLanguage,
      userId,
    ],
  );

  return <VaanikaContext.Provider value={value}>{children}</VaanikaContext.Provider>;

  async function hydrateLearnerState(nextUserId: string, isMounted: boolean) {
    setDataStatus('loading');

    try {
      const [profile, latestCourse] = await Promise.all([
        getLearnerProfile(nextUserId),
        getLatestCourseForLearner(nextUserId),
      ]);

      if (!isMounted) {
        return;
      }

      if (profile) {
        setLearnerProfile(profile);
        setSelectedGoal(profile.goal);
        setSelectedLanguage(profile.targetLanguage);
      }

      if (latestCourse) {
        setMockCourse(latestCourse);
      }

      setDataStatus('ready');
    } catch (error) {
      if (!isMounted) {
        return;
      }

      setAuthError(getErrorMessage(error));
      setDataStatus('error');
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function useVaanika() {
  const context = useContext(VaanikaContext);

  if (!context) {
    throw new Error('useVaanika must be used inside VaanikaProvider');
  }

  return context;
}

function getCourseProgress(lessonStatus: LessonStatus, mockCourse: GeneratedCourse | null): `${number}%` {
  if (mockCourse?.modules?.length) {
    const total = mockCourse.modules.reduce((sum, module) => {
      const value = Number.parseInt(module.progress.replace('%', ''), 10);
      return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);
    const average = Math.round(total / mockCourse.modules.length);
    return `${Math.max(0, Math.min(100, average))}%`;
  }

  if (lessonStatus === 'complete') {
    return '42%';
  }

  if (lessonStatus === 'in_progress') {
    return '21%';
  }

  return COURSE_MODULES.length > 0 ? '8%' : '0%';
}
