import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

type TokenBinding = { accountId: number; appleSubject: string; clientId: string };
export type TokenKeyring = { activeKeyId: string; keys: Readonly<Record<string, string>> };

function encryptionKey(keyring: TokenKeyring, id: string) {
  const encoded = keyring.keys[id];
  if (!encoded || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) throw new Error('Invalid token encryption key');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encoded) throw new Error('Invalid token encryption key');
  return key;
}

function associatedData(binding: TokenBinding, keyId: string) {
  if (!Number.isSafeInteger(binding.accountId) || binding.accountId < 1 || !binding.appleSubject || !binding.clientId) {
    throw new Error('Invalid token binding');
  }
  // Authenticated metadata prevents ciphertext being reassigned to another user,
  // Apple identity, client ID or encryption-key version.
  return Buffer.from(JSON.stringify(['flextab-apple-refresh-v1', keyId, binding.accountId, binding.appleSubject, binding.clientId]));
}

export function encryptAppleToken(token: string, binding: TokenBinding, keyring: TokenKeyring): string {
  if (!token || Buffer.byteLength(token) > 16384) throw new Error('Invalid provider token');
  const keyId = keyring.activeKeyId;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(keyId)) throw new Error('Invalid token key identifier');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(keyring, keyId), iv);
  cipher.setAAD(associatedData(binding, keyId));
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return JSON.stringify({ v: 1, keyId, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') });
}

export function decryptAppleToken(envelope: string, binding: TokenBinding, keyring: TokenKeyring): string {
  try {
    if (envelope.length > 24000) throw new Error();
    const data = JSON.parse(envelope);
    if (data.v !== 1 || typeof data.keyId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(data.keyId)) throw new Error();
    const decode = (value: unknown) => {
      if (typeof value !== 'string') throw new Error();
      const bytes = Buffer.from(value, 'base64');
      if (bytes.toString('base64') !== value) throw new Error();
      return bytes;
    };
    const iv = decode(data.iv), tag = decode(data.tag), ciphertext = decode(data.ciphertext);
    if (iv.length !== 12 || tag.length !== 16 || !ciphertext.length || ciphertext.length > 16384) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(keyring, data.keyId), iv);
    decipher.setAAD(associatedData(binding, data.keyId));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Unable to decrypt Apple token');
  }
}
