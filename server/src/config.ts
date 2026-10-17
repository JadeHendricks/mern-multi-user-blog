import path from 'node:path';
import { z } from 'zod';
import { ConfigError } from './lib/errors.js';
import { DEFAULT_DATA_DIR } from './lib/paths.js';

export { ConfigError };

// Settings come from process.env (the repo-root .env is loaded by `node --env-file-if-exists`).
// loadConfig is pure: it never reads the file system, never exits and never prints.

const positiveInt = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const schema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    CLIENT_URL: z.url().default('http://localhost:3000'),
    DB_DRIVER: z.enum(['json', 'mongo']).default('json'),
    DATA_DIR: z.string().min(1).default(DEFAULT_DATA_DIR),
    MONGO_URI: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(32),
    COOKIE_EXPIRES_IN: z.coerce.number().positive().default(7),
    MAIL_TRANSPORT: z.enum(['file', 'sendgrid']).default('file'),
    SG_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    EMAIL_REPLY: z.string().min(1).optional(),
    AUTH_RATE_LIMIT_MAX: positiveInt(10),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    BACKUP_KEEP: positiveInt(10),
  })
  .superRefine((value, ctx) => {
    if (value.DB_DRIVER === 'mongo' && !value.MONGO_URI) {
      ctx.addIssue({
        code: 'custom',
        path: ['MONGO_URI'],
        message: 'is required when DB_DRIVER=mongo',
      });
    }
    if (value.MAIL_TRANSPORT === 'sendgrid') {
      for (const key of ['SG_API_KEY', 'EMAIL_FROM', 'EMAIL_REPLY'] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'is required when MAIL_TRANSPORT=sendgrid',
          });
        }
      }
    }
  })
  .transform((value) => ({
    ...value,
    // The file transport needs no real sender, so it gets a harmless default.
    EMAIL_FROM: value.EMAIL_FROM ?? 'noreply@mern-blog.local',
    DATA_DIR: path.resolve(value.DATA_DIR),
  }));

/** The validated settings. Read-only: nothing changes them after startup. */
export type Config = Readonly<z.infer<typeof schema>>;

export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  // An empty value in .env ("KEY=") means "not set", so defaults still apply.
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== undefined && value !== ''),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(config)'}: ${issue.message}`),
    );
  }
  return Object.freeze(result.data);
}

// Re-reads process.env on every call. Only for the few settings that tests flip at run time.
export const readConfig = (): Config => loadConfig(process.env);

// `config` validates lazily on first use, so server.ts can call loadConfig itself first and
// print a clean error. The result is cached for the life of the process.
let cached: Config | undefined;
const current = (): Config => (cached ??= loadConfig(process.env));

// The proxy never reads its target: every trap asks current(), so an empty object stands in for it.
// The assertion is the only way to hand the type of the real settings to the empty stand-in.
export const config: Config = new Proxy({} as Config, {
  get: (_target, key): unknown => Reflect.get(current(), key),
  has: (_target, key) => key in current(),
  ownKeys: () => Reflect.ownKeys(current()),
  getOwnPropertyDescriptor: (_target, key) => ({
    ...Reflect.getOwnPropertyDescriptor(current(), key),
    configurable: true,
  }),
});
