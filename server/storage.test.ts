import { describe, it, expect } from 'vitest';
import { storagePut, storageGet } from './storage';

describe('Cloudflare R2 Storage', () => {
  it('should have R2 environment variables configured', () => {
    expect(process.env.R2_ACCOUNT_ID).toBeDefined();
    expect(process.env.R2_ACCESS_KEY_ID).toBeDefined();
    expect(process.env.R2_SECRET_ACCESS_KEY).toBeDefined();
    expect(process.env.R2_BUCKET_NAME).toBeDefined();
    expect(process.env.R2_BUCKET_NAME).toBe('flextab-storage');
  });

  it('should upload a test file to R2', async () => {
    const testData = 'Hello from FlexTab!';
    const testKey = `test/vitest-${Date.now()}.txt`;
    
    const result = await storagePut(testKey, testData, 'text/plain');
    
    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('url');
    expect(result.key).toBe(testKey);
    expect(result.url).toContain(testKey);
  }, 10000); // 10 second timeout for network request

  it('should generate presigned URL for file access', async () => {
    const testKey = 'test/sample.txt';
    
    const result = await storageGet(testKey, 3600);
    
    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('url');
    expect(result.key).toBe(testKey);
    expect(result.url).toContain('X-Amz-Signature'); // Presigned URL signature
  }, 10000);
});
