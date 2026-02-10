import { useUser, useClerk } from '@clerk/clerk-react';
import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

/**
 * Authentication hook using Clerk
 * Provides a consistent interface for authentication state
 */
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const state = useMemo(() => {
    const mappedUser = user ? {
      id: 0, // Clerk doesn't expose numeric ID
      openId: user.id,
      name: user.fullName || user.username || 'User',
      email: user.primaryEmailAddress?.emailAddress || '',
      role: 'user' as const,
      loginMethod: 'clerk',
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      lastSignedIn: user.lastSignInAt ? new Date(user.lastSignInAt) : (user.createdAt ? new Date(user.createdAt) : new Date()),
    } : null;

    // Store user info in localStorage for compatibility
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(mappedUser)
    );

    return {
      user: mappedUser,
      loading: !isLoaded,
      error: null,
      isAuthenticated: isSignedIn || false,
    };
  }, [user, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!isLoaded) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isLoaded,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      // Clerk handles refreshing automatically
      window.location.reload();
    },
    logout,
  };
}
