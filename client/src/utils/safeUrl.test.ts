import { isHttpsUrl } from './safeUrl';

describe('isHttpsUrl', () => {
  it('accepts https urls', () => {
    expect(isHttpsUrl('https://example.com/dan')).toBe(true);
  });

  it('rejects other protocols', () => {
    expect(isHttpsUrl('http://example.com')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpsUrl('data:text/html,hi')).toBe(false);
  });

  it('rejects empty, malformed and non-string values', () => {
    expect(isHttpsUrl('')).toBe(false);
    expect(isHttpsUrl('not a url')).toBe(false);
    expect(isHttpsUrl(undefined)).toBe(false);
    expect(isHttpsUrl(null)).toBe(false);
    expect(isHttpsUrl(42)).toBe(false);
  });
});
