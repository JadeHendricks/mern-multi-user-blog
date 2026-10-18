import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';

// The headers do not depend on the store, so a bare app is enough here.
const app = createApp({ store: { users: {}, posts: {}, admin: {} } });

describe('security headers', () => {
  it('sends an explicit CSP that allows the Google Fonts hosts and no eval', async () => {
    const res = await supertest(app).get('/api/nope');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe-eval');
    // Inline is only tolerated for styles
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    // upgrade-insecure-requests is production only, and tests run with NODE_ENV=test
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('lets other sites on the same site load uploads', async () => {
    const res = await supertest(app).get('/api/nope');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-site');
  });
});
