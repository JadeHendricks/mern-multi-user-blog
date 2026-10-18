import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { dataDir } from './store.js';

// What the file mail transport writes (src/lib/mailer.ts).
const mailSchema = z.object({
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  html: z.string(),
  createdAt: z.string(),
});
export type OutboxMail = z.infer<typeof mailSchema>;

// Mail written by MAIL_TRANSPORT=file lands in <DATA_DIR>/outbox. Tokens are returned to the
// test, never logged.
export const outboxDir = (): string => path.join(dataDir(), 'outbox');

export function readMails(to?: string): OutboxMail[] {
  const dir = outboxDir();
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => mailSchema.parse(JSON.parse(readFileSync(path.join(dir, file), 'utf8'))))
    .filter((mail) => !to || mail.to === to);
}

// Throws when nothing was sent, so a test that expects a mail fails with that message.
export function readLatestMail(to?: string): OutboxMail {
  const mail = readMails(to).at(-1);
  if (!mail) throw new Error(`No mail in the outbox${to ? ` for ${to}` : ''}.`);
  return mail;
}

// Throws when the mail has no link.
export function extractLink(mail: OutboxMail): string {
  const link = /https?:\/\/[^\s<"]+/.exec(mail.html)?.[0];
  if (!link) throw new Error('The mail contains no link.');
  return link;
}

export const tokenFromLink = (link: string): string => link.slice(link.lastIndexOf('/') + 1);
