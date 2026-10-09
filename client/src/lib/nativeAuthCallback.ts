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

type ExchangeResult = {
  error: unknown;
  data: { session: unknown; redirectType?: unknown };
};
export function createNativeCallbackHandler(actions: {
  exchange: (code: string) => Promise<ExchangeResult>;
  closeBrowser: () => Promise<unknown>;
  navigate: (path: string) => void;
  showError: () => void;
}) {
  // Both getLaunchUrl and appUrlOpen can deliver the same one-use code.
  const seen = new Set<string>();
  return async (raw: string) => {
    const callback = parseNativeAuthCallback(raw);
    if (!callback || seen.has(raw)) return;
    seen.add(raw);
    if (seen.size > 32) seen.delete(seen.values().next().value!);
    try {
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
