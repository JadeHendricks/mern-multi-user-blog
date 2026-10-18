// Creates the repo-root .env from .env.example with a random JWT_SECRET. Run it with `npm run setup`
// (it also runs before `npm run dev`). An existing .env is never touched, read or printed.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

// Returns { created: boolean }. The secret goes straight into the file and is never returned or logged.
export function createEnvFile({ examplePath, envPath }: { examplePath: string; envPath: string }): {
  created: boolean;
} {
  if (existsSync(envPath)) return { created: false };

  const secret = randomBytes(48).toString('hex');
  const example = readFileSync(examplePath, 'utf8');
  // A function replacer keeps "$" sequences in the value literal (hex has none, but be safe).
  const line = () => `JWT_SECRET=${secret}`;
  const content = /^JWT_SECRET=.*$/m.test(example)
    ? example.replace(/^JWT_SECRET=.*$/m, line)
    : `${example}${example.endsWith('\n') ? '' : '\n'}${line()}\n`;

  // "wx" fails instead of overwriting if another process created the file in the meantime.
  try {
    writeFileSync(envPath, content, { flag: 'wx', mode: 0o600 });
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'EEXIST') return { created: false };
    throw err;
  }
  return { created: true };
}

if (import.meta.filename === process.argv[1]) {
  const examplePath = path.join(root, '.env.example');
  const envPath = path.join(root, '.env');
  try {
    const { created } = createEnvFile({ examplePath, envPath });
    console.log(
      created ? 'Created .env with a new random JWT_SECRET.' : '.env exists, left unchanged.',
    );
  } catch (err) {
    console.error(`Could not create .env: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
