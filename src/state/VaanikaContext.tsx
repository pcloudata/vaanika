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
import { generateMockCourse, type GeneratedCourse } from '../services/course/mockCourseService';
import { getLearnerProfile, saveLearnerProfile } from '../services/profile/profileService';
import { getRuntimeProviders } from '../services/providerRegistry';
import type { LanguageCode, LearnerProfile, LearningGoal, LearningLanguage, ProviderPlan } from '../types/learning';
import type { RuntimeProviders } from '../services/providerRegistry';

type LessonStatus = 'not_started' | 'in_progress' | 'complete';

type VaanikaState = {
  assessmentScore: number;
  authError: string | null;
  authMode: 'mock' | 'supabase';
  authStatus: 'loading' | 'signed_in' | 'signed_out';
  courseProgress: `${number}%`;
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
  completeAssessment: () => void;
  completeLesson: () => void;
  generateCourse: () => Promise<void>;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signOutUser: () => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<void>;
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
  const [mockCourse, setMockCourse] = useState<GeneratedCourse | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<VaanikaState['authStatus']>('loading');
  const [authMode, setAuthMode] = useState<VaanikaState['authMode']>('mock');
  const [authError, setAuthError] = useState<string | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);

  const language = LANGUAGES.find((item) => item.code === selectedLanguage) ?? LANGUAGES[0];
  const providerPlan = useMemo(() => getProviderPlan(selectedLanguage), [selectedLanguage]);
  const runtimeProviders = useMemo(() => getRuntimeProviders(selectedLanguage), [selectedLanguage]);
  const courseProgress = getCourseProgress(lessonStatus);

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

        if (authState.userId) {
          const profile = await getLearnerProfile(authState.userId);

          if (profile && isMounted) {
            setLearnerProfile(profile);
            setSelectedGoal(profile.goal);
            setSelectedLanguage(profile.targetLanguage);
          }
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
      authError,
      authMode,
      authStatus,
      courseProgress,
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
      completeAssessment: () => setAssessmentScore(selectedLanguage === 'ta-IN' ? 84 : 88),
      completeLesson: () => setLessonStatus('complete'),
      generateCourse: async () => {
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

        setLearnerProfile(profile);
        setMockCourse(generatedCourse);
        setLessonStatus('not_started');
        setAssessmentScore(0);
      },
      signIn: async (credentials) => {
        setAuthError(null);
        const authState = await signInWithEmail(credentials);

        setAuthMode(authState.isConfigured ? 'supabase' : 'mock');
        setUserId(authState.userId);
        setAuthStatus(authState.userId ? 'signed_in' : 'signed_out');
      },
      signOutUser: async () => {
        const authState = await signOut();

        setUserId(authState.userId);
        setAuthStatus('signed_out');
        setLearnerProfile(null);
        setMockCourse(null);
      },
      signUp: async (credentials) => {
        setAuthError(null);
        const authState = await signUpWithEmail(credentials);

        setAuthMode(authState.isConfigured ? 'supabase' : 'mock');
        setUserId(authState.userId);
        setAuthStatus(authState.userId ? 'signed_in' : 'signed_out');
      },
      setLearnerNeed,
      setSelectedGoal,
      setSelectedLanguage,
      startLesson: () => setLessonStatus('in_progress'),
    }),
    [
      assessmentScore,
      authError,
      authMode,
      authStatus,
      courseProgress,
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

function getCourseProgress(lessonStatus: LessonStatus): `${number}%` {
  if (lessonStatus === 'complete') {
    return '42%';
  }

  if (lessonStatus === 'in_progress') {
    return '21%';
  }

  return COURSE_MODULES.length > 0 ? '8%' : '0%';
}
