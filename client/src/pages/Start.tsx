import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { isNativeShell } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import Landing from "./Landing";

export default function Start() {
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(isNativeShell);
  useEffect(() => {
    if (!isNativeShell()) return;
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      // A launch auth callback may have already selected its own route.
      if (active && session && window.location.pathname === "/") {
        navigate("/dashboard", { replace: true });
      }
    }).catch(() => undefined).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [navigate]);
  if (checking) return <div role="status" className="min-h-screen flex items-center justify-center bg-background text-foreground">Opening FlexTab…</div>;
  return <Landing />;
}
