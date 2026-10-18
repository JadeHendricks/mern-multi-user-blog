import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import supertest from 'supertest';
import type { OwnUserDto } from '@mern-blog/shared';
import { clearDb, connectDb, disconnectDb, getStore } from './support/db.js';
import { createUserAndLogin, loadApp } from './support/helpers.js';

describe('socials and profile updates', () => {
  let app: Express;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  const putSocials = (agent: supertest.Agent, user: OwnUserDto, body: Record<string, unknown>) =>
    agent.put(`/api/user/${user._id}/socials`).send(body);

  it('stores https links and leaves the other networks untouched', async () => {
    const { agent, user } = await createUserAndLogin(app);

    await putSocials(agent, user, {
      facebook: 'https://facebook.com/me',
      linkedin: 'https://linkedin.com/in/me',
      twitter: 'https://twitter.com/me',
    });
    const res = await putSocials(agent, user, { twitter: 'https://twitter.com/other' });

    expect(res.status).toBe(200);
    expect(res.body.user.socials).toMatchObject({
      facebook: 'https://facebook.com/me',
      linkedin: 'https://linkedin.com/in/me',
      twitter: 'https://twitter.com/other',
    });
  });

  // null, 0 and false pass validation as "left out"; they used to be stored as they came in.
  it.each([null, 0, false])(
    'does not store %j as a link and keeps the existing one',
    async (value) => {
      const { agent, user } = await createUserAndLogin(app);
      await putSocials(agent, user, { facebook: 'https://facebook.com/me' });
      const res = await putSocials(agent, user, {
        facebook: value,
        twitter: 'https://twitter.com/me',
      });
      expect(res.status).toBe(200);
      expect(res.body.user.socials).toEqual({
        facebook: 'https://facebook.com/me',
        twitter: 'https://twitter.com/me',
      });
    },
  );
  it('clears one network with an empty string', async () => {
    const { agent, user } = await createUserAndLogin(app);
    await putSocials(agent, user, {
      facebook: 'https://facebook.com/me',
      twitter: 'https://twitter.com/me',
    });

    const res = await putSocials(agent, user, { twitter: '' });

    expect(res.status).toBe(200);
    expect(res.body.user.socials.twitter).toBe('');
    expect(res.body.user.socials.facebook).toBe('https://facebook.com/me');
  });

  it.each([
    ['javascript:alert(1)'],
    ['http://example.com/me'],
    ['example.com/me'],
    [`https://example.com/${'a'.repeat(200)}`],
  ])('rejects %s with 422', async (value) => {
    const { agent, user } = await createUserAndLogin(app);

    const res = await putSocials(agent, user, { twitter: value });

    expect(res.status).toBe(422);
    const me = await agent.get('/api/user/me');
    expect(me.body.user.socials?.twitter).toBeUndefined();
  });

  it('requires a login', async () => {
    const { user } = await createUserAndLogin(app);

    const res = await supertest(app)
      .put(`/api/user/${user._id}/socials`)
      .send({ twitter: 'https://twitter.com/me' });

    expect(res.status).toBe(401);
  });

  it('does not create a document when the user no longer exists', async () => {
    const { agent, user } = await createUserAndLogin(app);
    const before = (await getStore().admin.counts()).users;
    await getStore().users.deleteById(user._id);

    const social = await putSocials(agent, user, { twitter: 'https://twitter.com/me' });
    const profile = await agent.put('/api/user/me').send({ name: 'Ghost' });

    // protect rejects a deleted user before the controller runs, and nothing is upserted either way
    expect([social.status, profile.status]).toEqual([401, 401]);
    expect(before).toBe(1);
    expect((await getStore().admin.counts()).users).toBe(0);
  });
});
