import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import { fakeConfig, fakeUser, loadApp } from './support/helpers.js';

// Same module instance that authController.js requires.
const require = createRequire(import.meta.url);

describe('mail transport', () => {
  let app;
  let send;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(async () => {
    await clearDb();
    send = vi.spyOn(require('@sendgrid/mail'), 'send').mockResolvedValue([{ statusCode: 202 }]);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    process.env.MAIL_TRANSPORT = 'file';
  });
  afterAll(disconnectDb);

  const filesIn = (dir) => (existsSync(dir) ? readdirSync(dir) : []);

  it('uses SendGrid exactly once and writes no file when MAIL_TRANSPORT is unset', async () => {
    delete process.env.MAIL_TRANSPORT;
    const outboxBefore = filesIn(process.env.MAIL_OUTBOX_DIR);
    const defaultOutboxBefore = filesIn('tmp/outbox');
    const user = fakeUser();

    const res = await supertest(app).post('/api/auth/register').send(user);

    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe(user.email);
    expect(mail.from).toBe(fakeConfig().EMAIL_FROM);
    expect(mail.subject).toBe('Account activation link');
    expect(mail.html).toContain('/auth/activate/');
    expect(filesIn(process.env.MAIL_OUTBOX_DIR)).toEqual(outboxBefore);
    expect(filesIn('tmp/outbox')).toEqual(defaultOutboxBefore);
  });

  it('uses SendGrid for the password reset mail too when MAIL_TRANSPORT is unset', async () => {
    // Create the account while the file transport is on, then switch to the default path.
    const user = fakeUser();
    await supertest(app).post('/api/auth/register').send(user);
    const { readLatestMail, extractLink, tokenFromLink } = await import('./support/outbox.js');
    const token = tokenFromLink(extractLink(readLatestMail(user.email)));
    await supertest(app).post('/api/auth/account-activation').send({ token });
    send.mockClear();

    delete process.env.MAIL_TRANSPORT;
    const res = await supertest(app).put('/api/auth/forgot-password').send({ email: user.email });

    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].subject).toBe('Password Reset link');
  });

  it('writes a JSON file and does not call SendGrid when MAIL_TRANSPORT=file', async () => {
    const before = filesIn(process.env.MAIL_OUTBOX_DIR).length;

    await supertest(app).post('/api/auth/register').send(fakeUser());

    expect(send).not.toHaveBeenCalled();
    expect(filesIn(process.env.MAIL_OUTBOX_DIR)).toHaveLength(before + 1);
  });
});
