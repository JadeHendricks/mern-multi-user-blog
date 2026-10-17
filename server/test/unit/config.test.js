import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../../src/config.js';

// Fake values only. SECRET is a marker the error text must never contain.
const SECRET = 'a-very-long-fake-secret-value-0123456789abcdef';
const valid = { JWT_SECRET: SECRET };

const problemsFor = (env) => {
  try {
    loadConfig(env);
  } catch (err) {
    expect(err).toBeInstanceOf(ConfigError);
    return err.problems;
  }
  throw new Error('expected loadConfig to throw');
};

describe('loadConfig', () => {
  it('applies the defaults when only JWT_SECRET is set', () => {
    const config = loadConfig(valid);

    expect(config).toMatchObject({
      PORT: 5000,
      CLIENT_URL: 'http://localhost:3000',
      DB_DRIVER: 'json',
      COOKIE_EXPIRES_IN: 7,
      MAIL_TRANSPORT: 'file',
      EMAIL_FROM: 'noreply@mern-blog.local',
      AUTH_RATE_LIMIT_MAX: 10,
      NODE_ENV: 'development',
      BACKUP_KEEP: 10,
    });
    // Resolved from the config module, not from the working directory.
    expect(path.isAbsolute(config.DATA_DIR)).toBe(true);
    expect(config.DATA_DIR.endsWith(path.join('server', 'data'))).toBe(true);
  });

  it('coerces numeric strings and returns a frozen object', () => {
    const config = loadConfig({
      ...valid,
      PORT: '8080',
      COOKIE_EXPIRES_IN: '1',
      AUTH_RATE_LIMIT_MAX: '3',
    });

    expect(config.PORT).toBe(8080);
    expect(config.COOKIE_EXPIRES_IN).toBe(1);
    expect(config.AUTH_RATE_LIMIT_MAX).toBe(3);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('treats an empty value like a missing one', () => {
    const config = loadConfig({ ...valid, PORT: '', MONGO_URI: '' });

    expect(config.PORT).toBe(5000);
    expect(config.MONGO_URI).toBeUndefined();
  });

  it('requires MONGO_URI only for the mongo driver', () => {
    expect(() => loadConfig({ ...valid, DB_DRIVER: 'json' })).not.toThrow();
    expect(problemsFor({ ...valid, DB_DRIVER: 'mongo' })).toEqual([
      expect.stringContaining('MONGO_URI'),
    ]);
    expect(
      loadConfig({ ...valid, DB_DRIVER: 'mongo', MONGO_URI: 'mongodb://127.0.0.1:27017/blog' })
        .MONGO_URI,
    ).toBe('mongodb://127.0.0.1:27017/blog');
  });

  it('requires all three SendGrid keys for the sendgrid transport', () => {
    const problems = problemsFor({ ...valid, MAIL_TRANSPORT: 'sendgrid' });

    expect(problems).toHaveLength(3);
    for (const key of ['SG_API_KEY', 'EMAIL_FROM', 'EMAIL_REPLY']) {
      expect(problems.some((line) => line.startsWith(`${key}:`))).toBe(true);
    }
    expect(
      loadConfig({
        ...valid,
        MAIL_TRANSPORT: 'sendgrid',
        SG_API_KEY: 'fake-key',
        EMAIL_FROM: 'from@example.test',
        EMAIL_REPLY: 'reply@example.test',
      }).MAIL_TRANSPORT,
    ).toBe('sendgrid');
  });

  it('rejects a missing or short JWT_SECRET without echoing it', () => {
    expect(problemsFor({})).toEqual([expect.stringMatching(/^JWT_SECRET:/)]);

    const shortSecret = 'too-short-secret-value';
    const problems = problemsFor({ JWT_SECRET: shortSecret });

    expect(problems).toEqual([expect.stringMatching(/^JWT_SECRET:/)]);
    expect(problems.join('\n')).not.toContain(shortSecret);
  });

  it('never puts a secret value in the error text', () => {
    let message = '';
    try {
      loadConfig({
        JWT_SECRET: SECRET,
        PORT: 'not-a-number',
        DB_DRIVER: 'sqlite',
        SG_API_KEY: 'fake-key',
      });
    } catch (err) {
      message = err.message;
    }

    expect(message).toContain('PORT');
    expect(message).toContain('DB_DRIVER');
    expect(message).not.toContain(SECRET);
    expect(message).not.toContain('not-a-number');
    expect(message).not.toContain('sqlite');
  });

  it('rejects out-of-range and unknown values', () => {
    expect(problemsFor({ ...valid, PORT: '70000' })[0]).toMatch(/^PORT:/);
    expect(problemsFor({ ...valid, NODE_ENV: 'staging' })[0]).toMatch(/^NODE_ENV:/);
    expect(problemsFor({ ...valid, CLIENT_URL: 'not a url' })[0]).toMatch(/^CLIENT_URL:/);
    expect(problemsFor({ ...valid, AUTH_RATE_LIMIT_MAX: '0' })[0]).toMatch(/^AUTH_RATE_LIMIT_MAX:/);
  });
});
