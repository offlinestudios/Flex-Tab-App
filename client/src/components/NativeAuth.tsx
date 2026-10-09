import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { isNativeShell, publicAppUrl } from "@/lib/api";
import {
  createNativeCallbackHandler,
  NATIVE_AUTH_REDIRECT,
} from "@/lib/nativeAuthCallback";

const supportedProviders = ["apple", "google", "github"] as const;
const configuredProviders = (import.meta.env.VITE_OAUTH_PROVIDERS ?? "google")
  .split(",")
  .map((value: string) => value.trim());
export const AUTH_PROVIDERS = supportedProviders.filter(provider =>
  configuredProviders.includes(provider)
);

export const authRedirectUrl = () =>
  isNativeShell() ? NATIVE_AUTH_REDIRECT : publicAppUrl("/dashboard");

export function NativeAuthListener() {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isNativeShell()) return;
    let active = true;
    const handle = createNativeCallbackHandler({
      exchange: code => supabase.auth.exchangeCodeForSession(code),
      closeBrowser: () => Browser.close(),
      navigate: path => {
        if (active) navigate(path);
      },
      showError: () => {
        if (active)
          toast.error(
            "This sign-in link could not be completed. Start again in FlexTab and open the new link on this device."
          );
      },
    });
    // Register before reading the launch URL so a warm callback cannot be missed.
    const listener = App.addListener("appUrlOpen", ({ url }) => {
      void handle(url);
    });
    void listener
      .then(async () => {
        if (!active) return;
        const launch = await App.getLaunchUrl();
        if (active && launch?.url) await handle(launch.url);
      })
      .catch(() => {
        if (active)
          toast.error(
            "Unable to receive sign-in links. Restart FlexTab and try again."
          );
      });
    return () => {
      active = false;
      void listener.then(handle => handle.remove()).catch(() => undefined);
    };
  }, [navigate]);
  return null;
}

export function NativeOAuthButtons() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!isNativeShell()) return null;
  const signIn = async (provider: "apple" | "google" | "github") => {
    setBusy(true);
    setError("");
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: NATIVE_AUTH_REDIRECT,
          skipBrowserRedirect: true,
        },
      });
      if (result.error || !result.data.url)
        throw new Error("Unable to start sign-in");
      await Browser.open({ url: result.data.url });
    } catch {
      setError("Unable to open sign-in. Please try again or use email.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mb-4 space-y-2">
      {AUTH_PROVIDERS.map(provider => (
        <button
          key={provider}
          type="button"
          disabled={busy}
          onClick={() => void signIn(provider)}
          className="w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900 disabled:opacity-50"
        >
          Continue with{" "}
          {{ apple: "Apple", google: "Google", github: "GitHub" }[provider]}
        </button>
      ))}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
