import fs from 'node:fs/promises';
import path from 'node:path';
import type { MailService } from '@sendgrid/mail';

export interface Mail {
  to: string;
  subject: string;
  html: string;
}

/** Controllers only know this: they never deal with transports or credentials. */
export interface Mailer {
  /** Resolves once the mail is handed over; the value is whatever the transport answers. */
  send(mail: Mail): Promise<unknown>;
}

export interface MailerSettings {
  MAIL_TRANSPORT?: 'file' | 'sendgrid' | undefined;
  DATA_DIR: string;
  EMAIL_FROM: string;
  EMAIL_REPLY?: string | undefined;
  SG_API_KEY?: string | undefined;
}

// Mail goes through one small interface: send({ to, subject, html }). The sender address comes
// from the mailer, so controllers never deal with transports or credentials.
//   file (default): writes the message as JSON into <DATA_DIR>/outbox, nothing leaves the machine.
//   sendgrid: loads @sendgrid/mail only when it is first used and sets the API key at send time.
export function createMailer({
  MAIL_TRANSPORT = 'file',
  DATA_DIR,
  EMAIL_FROM,
  EMAIL_REPLY,
  SG_API_KEY,
}: MailerSettings): Mailer {
  if (MAIL_TRANSPORT === 'sendgrid') {
    let client: MailService | undefined;
    return {
      async send({ to, subject, html }) {
        // loadConfig makes sure the key is set when MAIL_TRANSPORT=sendgrid.
        if (!SG_API_KEY) throw new Error('SG_API_KEY is not set');
        client ??= (await import('@sendgrid/mail')).default;
        client.setApiKey(SG_API_KEY);
        return client.send({
          from: EMAIL_FROM,
          to,
          subject,
          html,
          ...(EMAIL_REPLY ? { replyTo: EMAIL_REPLY } : {}),
        });
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
