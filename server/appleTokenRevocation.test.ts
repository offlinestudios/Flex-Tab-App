import { beforeAll, describe, expect, it, vi } from 'vitest';
import { exportPKCS8, generateKeyPair, jwtVerify } from 'jose';
import { revokeAppleRefreshToken, type AppleRevocationConfig } from './appleTokenRevocation';

describe('Apple refresh-token revocation', () => {
  let config: AppleRevocationConfig;
  let publicKey: Awaited<ReturnType<typeof generateKeyPair>>['publicKey'];
  beforeAll(async () => {
    const keys = await generateKeyPair('ES256', { extractable: true });
    publicKey = keys.publicKey;
    config = { teamId: 'TESTTEAM', keyId: 'TESTKEY', clientId: 'com.example.auth', privateKey: await exportPKCS8(keys.privateKey) };
  });
  it('signs a short-lived client secret and sends only to Apple with redirects forbidden', async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, {status:200}));
    await revokeAppleRefreshToken('test-refresh-token', config, send);
    const [url, request] = send.mock.calls[0];
    expect(url).toBe('https://appleid.apple.com/auth/revoke');
    expect(request).toMatchObject({method:'POST',redirect:'error',headers:{'content-type':'application/x-www-form-urlencoded'}});
    expect(request?.signal).toBeInstanceOf(AbortSignal);
    const body = request?.body as URLSearchParams;
    expect(body.get('token')).toBe('test-refresh-token');
    expect(body.get('token_type_hint')).toBe('refresh_token');
    expect(body.get('client_id')).toBe(config.clientId);
    const { payload, protectedHeader } = await jwtVerify(body.get('client_secret')!, publicKey, {
      issuer:config.teamId, subject:config.clientId, audience:'https://appleid.apple.com', algorithms:['ES256'],
    });
    expect(protectedHeader.kid).toBe(config.keyId);
    expect(payload.exp! - payload.iat!).toBe(300);
  });
  it.each([400,401,429,500,302,204])('rejects status %s without leaking the provider body', async status => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(status === 204 ? null : 'secret-provider-details', {status}));
    await expect(revokeAppleRefreshToken('secret-token',config,send)).rejects.toThrow(/^Apple token revocation failed$/);
  });
  it('sanitizes transport errors for safe worker retry', async () => {
    const send = vi.fn<typeof fetch>().mockRejectedValue(new Error('secret-token in upstream diagnostics'));
    await expect(revokeAppleRefreshToken('secret-token',config,send)).rejects.toThrow(/^Apple token revocation failed$/);
  });
  it('does not send credentials if signing configuration is invalid', async () => {
    const send = vi.fn<typeof fetch>();
    await expect(revokeAppleRefreshToken('test-token',{...config,privateKey:'invalid'},send)).rejects.toThrow('revocation failed');
    expect(send).not.toHaveBeenCalled();
  });
  it('rejects missing tokens before calling Apple', async () => {
    const send = vi.fn<typeof fetch>();
    await expect(revokeAppleRefreshToken('',config,send)).rejects.toThrow('incomplete');
    expect(send).not.toHaveBeenCalled();
  });
});
