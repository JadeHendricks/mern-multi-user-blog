import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';
import { createEnvFile } from '../../../scripts/setup.mjs';

// Temp folders only: the real .env is never read, written or passed to the script.
describe('createEnvFile', () => {
  let dir;
  let examplePath;
  let envPath;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'mern-blog-setup-'));
    examplePath = path.join(dir, '.env.example');
    envPath = path.join(dir, '.env');
    writeFileSync(examplePath, 'PORT=5000\nJWT_SECRET=change-me\nNODE_ENV=development\n');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('creates .env with a 96-character hex JWT_SECRET and keeps the other lines', () => {
    expect(createEnvFile({ examplePath, envPath })).toEqual({ created: true });

    const content = readFileSync(envPath, 'utf8');
    expect(content).toMatch(/^JWT_SECRET=[0-9a-f]{96}$/m);
    expect(content).not.toContain('change-me');
    expect(content).toContain('PORT=5000\n');
    expect(content).toContain('NODE_ENV=development\n');
  });

  it('writes a secret that passes the config rules, and a different one each time', () => {
    createEnvFile({ examplePath, envPath });
    const first = /^JWT_SECRET=(.+)$/m.exec(readFileSync(envPath, 'utf8'))[1];
    expect(() => loadConfig({ JWT_SECRET: first })).not.toThrow();

    const otherEnv = path.join(dir, 'other.env');
    createEnvFile({ examplePath, envPath: otherEnv });
    const second = /^JWT_SECRET=(.+)$/m.exec(readFileSync(otherEnv, 'utf8'))[1];
    expect(second).not.toBe(first);
  });

  it('never overwrites: a second run changes nothing', () => {
    createEnvFile({ examplePath, envPath });
    const before = readFileSync(envPath, 'utf8');

    expect(createEnvFile({ examplePath, envPath })).toEqual({ created: false });
    expect(readFileSync(envPath, 'utf8')).toBe(before);
  });

  it('keeps an existing file with a custom secret exactly as it is', () => {
    const custom = 'JWT_SECRET=my-own-secret-that-is-long-enough-123456\nPORT=9999\n';
    writeFileSync(envPath, custom);

    expect(createEnvFile({ examplePath, envPath })).toEqual({ created: false });
    expect(readFileSync(envPath, 'utf8')).toBe(custom);
  });

  it('adds JWT_SECRET when the example does not have the line', () => {
    writeFileSync(examplePath, 'PORT=5000');

    createEnvFile({ examplePath, envPath });

    expect(readFileSync(envPath, 'utf8')).toMatch(/^PORT=5000\nJWT_SECRET=[0-9a-f]{96}\n$/);
  });

  it('works with Windows line endings', () => {
    writeFileSync(examplePath, 'PORT=5000\r\nJWT_SECRET=change-me\r\n');

    createEnvFile({ examplePath, envPath });

    expect(readFileSync(envPath, 'utf8')).toMatch(/^PORT=5000\r\nJWT_SECRET=[0-9a-f]{96}\r\n$/);
  });
});
