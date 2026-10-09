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
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SignUpPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLocation("/dashboard");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLocation("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  return (
    <div className="ft-auth">
      <a href="/" className="ft-auth-brand" aria-label="FlexTab home">
        flextab
      </a>
      <div className="ft-auth-card">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Make your next set count.
          </h1>
          <p className="text-slate-600">Create your free FlexTab account.</p>
        </div>
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
          view="sign_up"
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
