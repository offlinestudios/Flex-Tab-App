import { beforeAll, describe, expect, it, vi } from 'vitest';
import { generateKeyPair, exportPKCS8, SignJWT } from 'jose';
import { validateAppleRefreshToken } from './appleTokenValidation';
import type { AppleRevocationConfig } from './appleTokenRevocation';

let config: AppleRevocationConfig;
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
beforeAll(async () => {
  keys = await generateKeyPair('RS256');
  const signing = await generateKeyPair('ES256', {extractable:true});
  config = {teamId:'TESTTEAM',keyId:'TESTKEY',clientId:'com.example.auth',privateKey:await exportPKCS8(signing.privateKey)};
});
async function identity(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now()/1000);
  return new SignJWT({iss:'https://appleid.apple.com',aud:config.clientId,sub:'apple-user',iat:now,exp:now+300,...overrides})
    .setProtectedHeader({alg:'RS256'}).sign(keys.privateKey);
}
function dependencies(response: Response) {
  return {send:vi.fn<typeof fetch>().mockResolvedValue(response), keys:async () => keys.publicKey};
}
describe('Apple provider token ownership', () => {
  it('validates the refresh token with Apple and binds the signed identity to the expected account', async () => {
    const deps = dependencies(Response.json({id_token:await identity()}));
    await expect(validateAppleRefreshToken('test-refresh','apple-user',config,deps)).resolves.toBeUndefined();
    const [url, request] = deps.send.mock.calls[0];
    expect(url).toBe('https://appleid.apple.com/auth/token');
    expect(request).toMatchObject({method:'POST',redirect:'error'});
    const form = request?.body as URLSearchParams;
    expect(form.get('grant_type')).toBe('refresh_token');
    expect(form.get('refresh_token')).toBe('test-refresh');
    expect(form.get('client_id')).toBe(config.clientId);
  });
  it.each([{sub:'other-user'},{aud:'other-client'},{iss:'https://attacker.example'},{exp:1},{exp:undefined}])('rejects wrong or incomplete claims: %j', async claims => {
    const deps = dependencies(Response.json({id_token:await identity(claims)}));
    await expect(validateAppleRefreshToken('test-refresh','apple-user',config,deps)).rejects.toThrow(/^Unable to verify Apple token ownership$/);
  });
  it('rejects an otherwise valid identity signed by a different key', async () => {
    const other = await generateKeyPair('RS256');
    const deps = {...dependencies(Response.json({id_token:await identity()})),keys:async()=>other.publicKey};
    await expect(validateAppleRefreshToken('test-refresh','apple-user',config,deps)).rejects.toThrow('ownership');
  });
  it.each([400,401,429,500])('fails closed on provider status %s', async status => {
    await expect(validateAppleRefreshToken('test-refresh','apple-user',config,dependencies(new Response('private error',{status})))).rejects.toThrow(/^Unable to verify Apple token ownership$/);
  });
  it('rejects a response without an identity token', async () => {
    await expect(validateAppleRefreshToken('test-refresh','apple-user',config,dependencies(Response.json({access_token:'not-an-identity'})))).rejects.toThrow('ownership');
  });
});
