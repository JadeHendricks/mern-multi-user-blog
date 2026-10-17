import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import sendGridMail from '@sendgrid/mail';
import supertest from 'supertest';
import { createMailer } from '../../src/lib/mailer.js';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import { fakeConfig, fakeUser, loadApp } from './support/helpers.js';
import { outboxDir } from './support/outbox.js';

// The mailer is handed to the app, so each transport gets its own app instead of flipping an env var.
const mailSettings = (overrides = {}) => ({
  MAIL_TRANSPORT: 'file',
  DATA_DIR: process.env.DATA_DIR,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_REPLY: process.env.EMAIL_REPLY,
  SG_API_KEY: process.env.SG_API_KEY,
  ...overrides,
});

describe('mail transport', () => {
  let fileApp;
  let sendgridApp;
  let send;
  let setApiKey;

  beforeAll(async () => {
    await connectDb();
    fileApp = loadApp({ mailer: createMailer(mailSettings()) });
    sendgridApp = loadApp({ mailer: createMailer(mailSettings({ MAIL_TRANSPORT: 'sendgrid' })) });
  });
  beforeEach(async () => {
    await clearDb();
    // Every SendGrid call in this file is stubbed: no request ever leaves the machine.
    send = vi.spyOn(sendGridMail, 'send').mockResolvedValue([{ statusCode: 202 }]);
    setApiKey = vi.spyOn(sendGridMail, 'setApiKey');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  afterAll(disconnectDb);

  const filesIn = (dir) => (existsSync(dir) ? readdirSync(dir) : []);

  it('uses SendGrid exactly once and writes no file with the sendgrid transport', async () => {
    const outboxBefore = filesIn(outboxDir());
    const defaultOutboxBefore = filesIn('tmp/outbox');
    const user = fakeUser();
    const res = await supertest(sendgridApp).post('/api/auth/register').send(user);
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe(user.email);
    expect(mail.from).toBe(fakeConfig().EMAIL_FROM);
    expect(mail.replyTo).toBe(process.env.EMAIL_REPLY);
    expect(mail.subject).toBe('Account activation link');
    expect(mail.html).toContain('/auth/activate/');
    expect(filesIn(outboxDir())).toEqual(outboxBefore);
    expect(filesIn('tmp/outbox')).toEqual(defaultOutboxBefore);
  });

  it('sets the API key when sending, not when the transport is created', async () => {
    const mailer = createMailer(mailSettings({ MAIL_TRANSPORT: 'sendgrid' }));
    expect(setApiKey).not.toHaveBeenCalled();
    await mailer.send({ to: 'a@example.test', subject: 'Hi', html: '<p>Hi</p>' });
    expect(setApiKey).toHaveBeenCalledWith(process.env.SG_API_KEY);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('uses SendGrid for the password reset mail too with the sendgrid transport', async () => {
    // Create the account through the file transport, then ask for the reset through SendGrid.
    const user = fakeUser();
    await supertest(fileApp).post('/api/auth/register').send(user);
    const { readLatestMail, extractLink, tokenFromLink } = await import('./support/outbox.js');
    const token = tokenFromLink(extractLink(readLatestMail(user.email)));
    await supertest(fileApp).post('/api/auth/account-activation').send({ token });
    send.mockClear();
    const res = await supertest(sendgridApp).put('/api/auth/forgot-password').send({ email: user.email });
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].subject).toBe('Password Reset link');
  });

  it('writes a JSON file and does not call SendGrid with the file transport', async () => {
    const before = filesIn(outboxDir()).length;
    const user = fakeUser();
    await supertest(fileApp).post('/api/auth/register').send(user);
    expect(send).not.toHaveBeenCalled();
    expect(setApiKey).not.toHaveBeenCalled();
    const files = filesIn(outboxDir());
    expect(files).toHaveLength(before + 1);
    const written = JSON.parse(readFileSync(path.join(outboxDir(), files.sort().at(-1)), 'utf8'));
    expect(Object.keys(written).sort()).toEqual(['createdAt', 'from', 'html', 'subject', 'to']);
    expect(written.to).toBe(user.email);
    expect(written.from).toBe(process.env.EMAIL_FROM);
  });

  it('uses the file transport by default', async () => {
    const before = filesIn(outboxDir()).length;
    await supertest(loadApp()).post('/api/auth/register').send(fakeUser());
    expect(send).not.toHaveBeenCalled();
    expect(filesIn(outboxDir())).toHaveLength(before + 1);
  });
});