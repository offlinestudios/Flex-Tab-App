import { describe, expect, it, vi } from "vitest";
import {
  createNativeCallbackHandler,
  NATIVE_AUTH_REDIRECT,
  parseNativeAuthCallback,
} from "./nativeAuthCallback";

const valid = `${NATIVE_AUTH_REDIRECT}?code=one-use-code`;
function setup(
  result = {
    data: { session: {}, redirectType: null as string | null },
    error: null as unknown,
  }
) {
  const actions = {
    exchange: vi.fn().mockResolvedValue(result),
    closeBrowser: vi.fn().mockResolvedValue(undefined),
    navigate: vi.fn(),
    showError: vi.fn(),
  };
  return { ...actions, handle: createNativeCallbackHandler(actions) };
}
describe("native auth callbacks", () => {
  it.each([
    "https://auth/callback?code=x",
    "com.offlinestudios.flextab://evil/callback?code=x",
    "com.offlinestudios.flextab://auth/other?code=x",
    "com.offlinestudios.flextab://user@auth/callback?code=x",
    "not a URL",
  ])("ignores unrelated URLs: %s", async url => {
    const h = setup();
    await h.handle(url);
    expect(h.exchange).not.toHaveBeenCalled();
    expect(h.closeBrowser).not.toHaveBeenCalled();
  });
  it.each([
    "",
    "?code=",
    "?code=x&code=y",
    "#access_token=untrusted",
    "?error=access_denied",
  ])("rejects invalid or implicit-token callbacks: %s", async suffix => {
    const h = setup();
    await h.handle(NATIVE_AUTH_REDIRECT + suffix);
    expect(h.exchange).not.toHaveBeenCalled();
    expect(h.showError).toHaveBeenCalledOnce();
  });
  it("parses a PKCE code", () => {
    expect(parseNativeAuthCallback(valid)).toEqual({ code: "one-use-code" });
  });
  it("exchanges duplicate cold/warm deliveries only once", async () => {
    const h = setup();
    await Promise.all([h.handle(valid), h.handle(valid)]);
    expect(h.exchange).toHaveBeenCalledOnce();
    expect(h.exchange).toHaveBeenCalledWith("one-use-code");
    expect(h.navigate).toHaveBeenCalledOnce();
    expect(h.navigate).toHaveBeenCalledWith("/dashboard");
  });
  it("routes password recovery to the password form", async () => {
    const h = setup({
      data: { session: {}, redirectType: "recovery" },
      error: null,
    });
    await h.handle(valid);
    expect(h.navigate).toHaveBeenCalledWith("/reset-password");
  });
  it("does not navigate on an expired code or missing verifier", async () => {
    const h = setup({
      data: { session: null, redirectType: null },
      error: new Error("expired"),
    });
    await h.handle(valid);
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.showError).toHaveBeenCalledOnce();
  });
  it("reports a network failure without exposing the callback", async () => {
    const h = setup();
    h.exchange.mockRejectedValue(new Error("network"));
    await h.handle(valid);
    expect(h.showError).toHaveBeenCalledOnce();
    expect(h.showError).toHaveBeenCalledWith();
  });
  it("continues when closing the browser is unsupported", async () => {
    const h = setup();
    h.closeBrowser.mockRejectedValue(new Error("unsupported"));
    await h.handle(valid);
    expect(h.navigate).toHaveBeenCalledWith("/dashboard");
  });
});
