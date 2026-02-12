import { supabase } from '@/lib/supabase';
import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useState, useMemo } from "react";
import type { User as SupabaseUser } from '@supabase/supabase-js';

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type MappedUser = {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  loginMethod: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

/**
 * Authentication hook using Supabase
 * Provides a consistent interface for authentication state
 */
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const state = useMemo(() => {
    const mappedUser: MappedUser | null = user ? {
      id: 0, // Supabase doesn't expose numeric ID
      openId: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: 'user' as const,
      loginMethod: 'supabase',
      createdAt: user.created_at ? new Date(user.created_at) : new Date(),
      updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
      lastSignedIn: user.last_sign_in_at ? new Date(user.last_sign_in_at) : new Date(),
    } : null;

    // Store user info in localStorage for compatibility
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(mappedUser)
    );

    return {
      user: mappedUser,
      loading,
      error: null,
      isAuthenticated: !!user,
    };
  }, [user, loading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      // Refresh the session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });
    },
    logout,
  };
}
