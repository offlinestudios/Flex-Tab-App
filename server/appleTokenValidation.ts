import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { createAppleClientSecret, type AppleRevocationConfig } from './appleTokenRevocation';

const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'), { timeoutDuration: 10000 });

// expectedSubject must come from the authenticated user's server-verified Apple
// identity, never from a caller-supplied user ID, email, or decoded unsigned JWT.
export async function validateAppleRefreshToken(
  refreshToken: string,
  expectedSubject: string,
  config: AppleRevocationConfig,
  dependencies: { send?: typeof fetch; keys?: JWTVerifyGetKey } = {},
): Promise<void> {
  try {
    if (!expectedSubject || !refreshToken.trim() || refreshToken.length > 16384) throw new Error();
    const clientSecret = await createAppleClientSecret(config);
    const response = await (dependencies.send ?? fetch)('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: clientSecret,
        grant_type: 'refresh_token', refresh_token: refreshToken }),
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (response.status !== 200) throw new Error();
    const result = await response.json();
    if (typeof result.id_token !== 'string' || result.id_token.length > 32768) throw new Error();
    await jwtVerify(result.id_token, dependencies.keys ?? appleKeys, {
      algorithms: ['RS256'], issuer: 'https://appleid.apple.com',
      audience: config.clientId, subject: expectedSubject,
      requiredClaims: ['exp', 'iat', 'sub', 'aud', 'iss'],
    });
  } catch {
    // Neither Apple's tokens nor upstream transport diagnostics are safe to log.
    throw new Error('Unable to verify Apple token ownership');
  }
}
