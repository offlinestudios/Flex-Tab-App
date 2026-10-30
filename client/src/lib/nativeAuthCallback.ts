export const NATIVE_AUTH_REDIRECT =
  "com.offlinestudios.flextab://auth/callback";

export function parseNativeAuthCallback(
  raw: string
): { code: string } | { error: true } | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const expected = new URL(NATIVE_AUTH_REDIRECT);
  if (
    url.protocol !== expected.protocol ||
    url.hostname !== expected.hostname ||
    url.pathname !== expected.pathname ||
    url.port ||
    url.username ||
    url.password
  )
    return null;
  // Native sign-in uses PKCE only. Never import bearer tokens from an incoming URL.
  if (url.hash || url.searchParams.has("error")) return { error: true };
  const codes = url.searchParams.getAll("code");
  if (codes.length !== 1 || !codes[0].trim()) return { error: true };
  return { code: codes[0] };
}

// Device-level replay protection, not account data. Keep only SHA-256 digests,
// never authorization codes or tokens, across reloads and account cleanup.
const CALLBACK_HISTORY_KEY = "native-auth-consumed-digests";
export function createCallbackReplayGuard(storage: Pick<Storage, "getItem" | "setItem">) {
  let queue = Promise.resolve();
  return (raw: string): Promise<boolean> => {
    const claim = queue.then(async () => {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
      const digest = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
      let history: string[] = [];
      try {
        const stored = JSON.parse(storage.getItem(CALLBACK_HISTORY_KEY) ?? "[]");
        if (Array.isArray(stored)) history = stored.filter(value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value));
      } catch { /* Corrupt/unavailable storage must not block a fresh sign-in. */ }
      if (history.includes(digest)) return false;
      try { storage.setItem(CALLBACK_HISTORY_KEY, JSON.stringify([...history.slice(-31), digest])); }
      catch { /* The handler still deduplicates deliveries in memory. */ }
      return true;
    });
    queue = claim.then(() => undefined, () => undefined);
    return claim;
  };
}

type ExchangeResult = {
  error: unknown;
  data: { session: unknown; redirectType?: unknown };
};
export function createNativeCallbackHandler(actions: {
  exchange: (code: string) => Promise<ExchangeResult>;
  closeBrowser: () => Promise<unknown>;
  navigate: (path: string) => void;
  showError: () => void;
  claimCallback?: (raw: string) => Promise<boolean>;
}, seen = new Set<string>()) {
  // Both getLaunchUrl and appUrlOpen can deliver the same one-use code.
  return async (raw: string) => {
    const callback = parseNativeAuthCallback(raw);
    if (!callback || seen.has(raw)) return;
    seen.add(raw);
    if (seen.size > 32) seen.delete(seen.values().next().value!);
    try {
      if (actions.claimCallback && !(await actions.claimCallback(raw))) return;
      await actions.closeBrowser().catch(() => undefined);
      if ("error" in callback) throw new Error("Invalid callback");
      const { data, error } = await actions.exchange(callback.code);
      if (error || !data.session) throw new Error("Sign-in exchange failed");
      actions.navigate(
        data.redirectType === "recovery" ? "/reset-password" : "/dashboard"
      );
    } catch {
      actions.showError();
    }
  };
}
