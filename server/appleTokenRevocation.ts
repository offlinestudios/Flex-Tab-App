import { importPKCS8, SignJWT } from 'jose';

export type AppleRevocationConfig = {
  teamId: string;
  keyId: string;
  clientId: string;
  privateKey: string;
};

// Server-only: neither Apple's signing key nor the user's provider refresh token
// may be bundled into the client, logged, or included in error messages.
export async function revokeAppleRefreshToken(
  refreshToken: string,
  config: AppleRevocationConfig,
  send: typeof fetch = fetch,
) {
  if (!refreshToken.trim() || Object.values(config).some(value => !value.trim())) {
    throw new Error('Apple revocation configuration is incomplete');
  }
  try {
    const key = await importPKCS8(config.privateKey, 'ES256');
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
      .setIssuer(config.teamId)
      .setSubject(config.clientId)
      .setAudience('https://appleid.apple.com')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);
    const response = await send('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }),
      // Never forward provider credentials to a redirected endpoint.
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    // Apple's contract is 200 for both newly revoked and already revoked tokens.
    if (response.status !== 200) throw new Error('Unexpected revocation status');
  } catch {
    // Do not retain upstream response bodies, transport errors or signing details.
    // The deletion worker must retry and retain the token until revocation succeeds.
    throw new Error('Apple token revocation failed');
  }
}
