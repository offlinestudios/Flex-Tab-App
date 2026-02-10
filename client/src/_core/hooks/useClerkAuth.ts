import { useUser, useClerk } from '@clerk/clerk-react';

/**
 * Custom hook that wraps Clerk's useUser and useClerk hooks
 * Provides a consistent interface for authentication state
 */
export function useClerkAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const logout = async () => {
    await signOut();
  };

  return {
    user: user ? {
      id: 0, // Clerk doesn't expose numeric ID
      openId: user.id,
      name: user.fullName || user.username || 'User',
      email: user.primaryEmailAddress?.emailAddress || '',
      role: 'user' as const,
      loginMethod: 'clerk',
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      lastSignedIn: user.lastSignInAt ? new Date(user.lastSignInAt) : (user.createdAt ? new Date(user.createdAt) : new Date()),
    } : null,
    loading: !isLoaded,
    error: null,
    isAuthenticated: isSignedIn || false,
    logout,
  };
}
