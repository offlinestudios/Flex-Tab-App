import { describe, expect, it } from 'vitest';
import { initialDisplayName } from '../shared/profile';

describe('initial public display names', () => {
  it('never derives a public name from the login email', () => {
    for (const candidate of [undefined, null, '', ' ', {}, 123, ' PRIVATE@example.com ']) {
      expect(initialDisplayName(candidate, 'private@example.com')).toBe('FlexTab Member');
    }
  });
  it('preserves a supplied name within the profile length limit', () => {
    expect(initialDisplayName('  Alex Runner  ', 'private@example.com')).toBe('Alex Runner');
    expect(initialDisplayName('a'.repeat(100))).toHaveLength(80);
  });
});
