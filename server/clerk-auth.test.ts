import { describe, it, expect } from 'vitest';
import { getClerkSignInUrl, getClerkSignUpUrl } from './_core/clerk-auth';

describe('Clerk Authentication', () => {
  it('should have Clerk environment variables configured', () => {
    expect(process.env.CLERK_SECRET_KEY).toBeDefined();
    expect(process.env.CLERK_PUBLISHABLE_KEY).toBeDefined();
    expect(process.env.CLERK_SECRET_KEY).toMatch(/^sk_test_/);
    expect(process.env.CLERK_PUBLISHABLE_KEY).toMatch(/^pk_test_/);
  });

  it('should generate valid Clerk sign-in URL', () => {
    const signInUrl = getClerkSignInUrl();
    expect(signInUrl).toContain('clerk.accounts.dev/sign-in');
    expect(signInUrl).toContain('https://');
  });

  it('should generate valid Clerk sign-up URL', () => {
    const signUpUrl = getClerkSignUpUrl();
    expect(signUpUrl).toContain('clerk.accounts.dev/sign-up');
    expect(signUpUrl).toContain('https://');
  });

  it('should extract domain correctly from publishable key', () => {
    const signInUrl = getClerkSignInUrl();
    // Should extract "humorous-gibbon-90" from the key
    expect(signInUrl).toContain('humorous-gibbon-90.clerk.accounts.dev');
  });
});
