export type AuthStatus = 'loading' | 'signed_in' | 'signed_out';

export function shouldRedirectToAuth(authStatus: AuthStatus, userId: string | null): boolean {
  return authStatus === 'signed_out' || !userId;
}
