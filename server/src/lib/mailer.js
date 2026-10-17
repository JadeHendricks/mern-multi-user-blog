import fs from 'node:fs/promises';
import path from 'node:path';

// Mail goes through one small interface: send({ to, subject, html }). The sender address comes
// from the mailer, so controllers never deal with transports or credentials.
//   file (default): writes the message as JSON into <DATA_DIR>/outbox, nothing leaves the machine.
//   sendgrid: loads @sendgrid/mail only when it is first used and sets the API key at send time.
export function createMailer({ MAIL_TRANSPORT = 'file', DATA_DIR, EMAIL_FROM, EMAIL_REPLY, SG_API_KEY }) {
  if (MAIL_TRANSPORT === 'sendgrid') {
    let client;
    return {
      async send({ to, subject, html }) {
        client ??= (await import('@sendgrid/mail')).default;
        client.setApiKey(SG_API_KEY);
        const message = { from: EMAIL_FROM, to, subject, html };
        if (EMAIL_REPLY) message.replyTo = EMAIL_REPLY;
        return client.send(message);
      },
    };
  }

  const dir = path.join(DATA_DIR, 'outbox');
  return {
    async send({ to, subject, html }) {
      await fs.mkdir(dir, { recursive: true });
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.json`;
      const record = { from: EMAIL_FROM, to, subject, html, createdAt: new Date().toISOString() };
      await fs.writeFile(path.join(dir, name), JSON.stringify(record, null, 2));
    },
  };
}