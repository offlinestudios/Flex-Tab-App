import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { encryptAppleToken, decryptAppleToken } from './appleTokenEnvelope';

const binding = { accountId: 7, appleSubject: 'test-apple-user', clientId: 'com.example.auth' };
const keyring = { activeKeyId: 'key1', keys: { key1: randomBytes(32).toString('base64') } };
const token = 'test-refresh-token';

describe('Apple token authenticated encryption', () => {
  it('round-trips without storing plaintext and uses a fresh nonce each time', () => {
    const a = encryptAppleToken(token, binding, keyring);
    const b = encryptAppleToken(token, binding, keyring);
    expect(a).not.toContain(token);
    expect(a).not.toEqual(b);
    expect(decryptAppleToken(a, binding, keyring)).toBe(token);
    expect(decryptAppleToken(b, binding, keyring)).toBe(token);
  });
  it.each([{...binding,accountId:8},{...binding,appleSubject:'another-user'},{...binding,clientId:'another-client'}])('rejects reassignment to a different identity: %j', other => {
    expect(() => decryptAppleToken(encryptAppleToken(token,binding,keyring),other,keyring)).toThrow('Unable to decrypt');
  });
  it.each(['ciphertext','tag','iv'])('rejects tampered %s', field => {
    const data = JSON.parse(encryptAppleToken(token,binding,keyring));
    const bytes = Buffer.from(data[field],'base64'); bytes[0] ^= 1; data[field] = bytes.toString('base64');
    expect(() => decryptAppleToken(JSON.stringify(data),binding,keyring)).toThrow('Unable to decrypt');
  });
  it('supports old-key reads after rotation without allowing key-id substitution', () => {
    const old = encryptAppleToken(token,binding,keyring);
    const rotated = {activeKeyId:'key2',keys:{...keyring.keys,key2:randomBytes(32).toString('base64')}};
    expect(decryptAppleToken(old,binding,rotated)).toBe(token);
    expect(JSON.parse(encryptAppleToken(token,binding,rotated)).keyId).toBe('key2');
    const substituted = {...JSON.parse(old),keyId:'alias'};
    expect(() => decryptAppleToken(JSON.stringify(substituted),binding,{activeKeyId:'alias',keys:{alias:keyring.keys.key1}})).toThrow('Unable to decrypt');
    expect(() => decryptAppleToken(old,binding,{activeKeyId:'key2',keys:{key2:rotated.keys.key2}})).toThrow('Unable to decrypt');
  });
  it.each(['not-json','{}',JSON.stringify({v:2}), 'x'.repeat(24001)])('fails closed for malformed envelopes', value => {
    expect(() => decryptAppleToken(value,binding,keyring)).toThrow(/^Unable to decrypt Apple token$/);
  });
  it('rejects weak keys and invalid account bindings before persistence', () => {
    expect(() => encryptAppleToken(token,binding,{activeKeyId:'bad',keys:{bad:randomBytes(16).toString('base64')}})).toThrow('encryption key');
    expect(() => encryptAppleToken(token,{...binding,accountId:0},keyring)).toThrow('binding');
  });
});
