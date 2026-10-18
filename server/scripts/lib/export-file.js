import { z } from 'zod';

// The file db:export writes and db:import reads. It is the store's own export (see
// store/types.js StoreAdmin.exportAll) inside a small envelope that names the format.
export const FORMAT = 'mern-blog-export';
export const FORMAT_VERSION = 1;

const hexId = z.string().regex(/^[0-9a-f]{24}$/, 'must be a 24-character hex id');
const isoDate = z.iso.datetime();
const optionalString = z.string().optional();

const user = z
  .object({
    _id: hexId,
    name: z.string().min(1),
    email: z.string().min(1),
    avatar: z.string().min(1),
    role: z.enum(['user', 'admin']),
    status: z.enum(['pending', 'active']),
    createdAt: isoDate,
    updatedAt: isoDate,
    socials: z.object({ facebook: optionalString, linkedin: optionalString, twitter: optionalString }).strict().optional(),
    // Password hashes and one-time link hashes travel with the account so logins keep working.
    passwordHash: z.string().min(1),
    passwordChangedAt: isoDate.optional(),
    activationHash: optionalString,
    activationExpires: isoDate.optional(),
    resetHash: optionalString,
    resetExpires: isoDate.optional(),
  })
  .strict();

const post = z
  .object({
    _id: hexId,
    user: hexId.optional(),
    image: z.string().min(1),
    title: z.string().min(1),
    tag: z.string(),
    description: z.string().min(1),
    likes: z.array(z.object({ _id: hexId, user: hexId }).strict()),
    comments: z.array(z.object({ _id: hexId, user: hexId, comment: z.string().min(1), date: isoDate }).strict()),
    date: isoDate,
  })
  .strict();

export const exportFileSchema = z
  .object({
    format: z.literal(FORMAT),
    version: z.literal(FORMAT_VERSION),
    exportedAt: isoDate,
    schemaVersion: z.number().int().min(0).optional(),
    users: z.array(user),
    posts: z.array(post),
  })
  .strict();

// One short line per problem, with the path but never the offending value (it may be a hash).
export function describeProblems(error, limit = 8) {
  const lines = error.issues.slice(0, limit).map((issue) => `  - ${issue.path.join('.') || '(file)'}: ${issue.message}`);
  if (error.issues.length > limit) lines.push(`  - ...and ${error.issues.length - limit} more`);
  return lines.join('\n');
}
