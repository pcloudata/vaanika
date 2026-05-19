import { shouldRedirectToAuth } from './authGuard';

describe('authGuard', () => {
  it('redirects when user is signed out', () => {
    expect(shouldRedirectToAuth('signed_out', null)).toBe(true);
    expect(shouldRedirectToAuth('signed_out', 'learner-1')).toBe(true);
  });

  it('redirects when user id is missing', () => {
    expect(shouldRedirectToAuth('signed_in', null)).toBe(true);
  });

  it('does not redirect for signed-in user', () => {
    expect(shouldRedirectToAuth('signed_in', 'learner-1')).toBe(false);
  });
});
