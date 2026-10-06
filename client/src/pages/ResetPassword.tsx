import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      navigate("/dashboard");
    } catch {
      setError("Unable to update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-slate-900 shadow-xl"
      >
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <label className="block">
          New password
          <input
            className="mt-1 w-full rounded border p-3"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <label className="block">
          Confirm password
          <input
            className="mt-1 w-full rounded border p-3"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button
          className="w-full rounded bg-slate-900 p-3 text-white disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
