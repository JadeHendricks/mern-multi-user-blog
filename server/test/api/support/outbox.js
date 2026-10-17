import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Mail written by MAIL_TRANSPORT=file lands in <DATA_DIR>/outbox. Tokens are returned to the
// test, never logged.
export const outboxDir = () => path.join(process.env.DATA_DIR, 'outbox');

export function readMails(to) {
  const dir = outboxDir();
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')))
    .filter((mail) => !to || mail.to === to);
}

export function readLatestMail(to) {
  const mails = readMails(to);
  return mails[mails.length - 1];
}

export function extractLink(mail) {
  const match = /https?:\/\/[^\s<"]+/.exec(mail.html);
  return match ? match[0] : undefined;
}

export function tokenFromLink(link) {
  return link.split('/').pop();
}
