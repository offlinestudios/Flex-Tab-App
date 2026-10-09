import "./launch.css";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { isNativeShell } from "@/lib/api";
import {
  AUTH_PROVIDERS,
  authRedirectUrl,
  NativeOAuthButtons,
} from "@/components/NativeAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthUI, setShowAuthUI] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          // User is authenticated, redirect immediately
          setLocation("/dashboard");
        } else {
          // No session, show auth UI
          setIsLoading(false);
          setShowAuthUI(true);
        }
      })
      .catch(() => {
        // Supabase call failed (e.g. missing env vars) — show auth UI anyway
        setIsLoading(false);
        setShowAuthUI(true);
      });

    // Listen for auth changes (OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Successful sign-in, redirect to dashboard
        setLocation("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Don't render Auth UI if we're redirecting
  if (!showAuthUI) {
    return null;
  }

  return (
    <div className="ft-auth">
      <a href="/" className="ft-auth-brand" aria-label="FlexTab home">
        flextab
      </a>
      <div className="ft-auth-card">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back.
          </h1>
          <p className="text-slate-600">Your next workout starts here.</p>
        </div>
        {localStorage.getItem("flextab_deletion_receipt") && (
          <a
            href="/account-deletion-requested"
            className="mb-4 block text-center text-sm underline"
          >
            Check account deletion status
          </a>
        )}
        <NativeOAuthButtons />
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#1a2332",
                  brandAccent: "#334155",
                  brandButtonText: "#ffffff",
                  inputBorder: "#e2e4e8",
                  inputBorderFocus: "#526783",
                  anchorTextColor: "#334155",
                },
                radii: { borderRadiusButton: "7px", inputBorderRadius: "7px" },
                fonts: {
                  bodyFontFamily: "Inter, system-ui, sans-serif",
                  buttonFontFamily: "Inter, system-ui, sans-serif",
                  inputFontFamily: "Inter, system-ui, sans-serif",
                  labelFontFamily: "Inter, system-ui, sans-serif",
                },
              },
            },
          }}
          providers={isNativeShell() ? [] : AUTH_PROVIDERS}
          redirectTo={authRedirectUrl()}
          view="sign_in"
          showLinks={true}
          theme="light"
        />
      </div>
      <nav className="ft-auth-footer" aria-label="Account help">
        <a href="/support">Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
    </div>
  );
}
