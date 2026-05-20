import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';

export type AuthSessionState = {
  isConfigured: boolean;
  needsEmailConfirmation?: boolean;
  userId: string | null;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export async function getCurrentAuthState(): Promise<AuthSessionState> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      userId: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await supabase.auth.signOut({ scope: 'local' });
        return {
          isConfigured: true,
          userId: null,
        };
      }
      throw error;
    }

    return {
      isConfigured: true,
      userId: data.session?.user.id ?? null,
    };
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      await supabase.auth.signOut({ scope: 'local' });
      return {
        isConfigured: true,
        userId: null,
      };
    }

    throw error;
  }
}

function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('invalid refresh token') || message.includes('refresh token not found');
}

export async function signInWithEmail({ email, password }: AuthCredentials): Promise<AuthSessionState> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      userId: 'mock-learner',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return {
    isConfigured: true,
    userId: data.user?.id ?? null,
  };
}

export async function signUpWithEmail({ email, password }: AuthCredentials): Promise<AuthSessionState> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      userId: 'mock-learner',
    };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw error;
  }

  return {
    isConfigured: true,
    needsEmailConfirmation: !data.session,
    userId: data.session?.user.id ?? null,
  };
}

export async function signOut(): Promise<AuthSessionState> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      userId: null,
    };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return {
    isConfigured: true,
    userId: null,
  };
}
