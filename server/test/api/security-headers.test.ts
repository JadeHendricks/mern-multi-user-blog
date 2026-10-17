import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { stubStore } from './support/helpers.js';

// The headers do not depend on the store, so a bare app is enough here.
const app = createApp({ store: stubStore() });

describe('security headers', () => {
  it('sends an explicit CSP with no third-party font hosts and no eval', async () => {
    const res = await supertest(app).get('/api/nope');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    // Lato is self-hosted, so fonts and styles come from this origin only.
    expect(csp).not.toContain('https://fonts.googleapis.com');
    expect(csp).not.toContain('https://fonts.gstatic.com');
    expect(csp).toContain("font-src 'self'");
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
