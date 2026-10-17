/** The `code` of a Node system error ('ENOENT', 'EPERM', ...), or undefined for anything else. */
export const errorCode = (err: unknown): string | undefined =>
  typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
    ? err.code
    : undefined;

/** The message of whatever was thrown. */
export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

// Error classes shared across the server.
//
// Which module throws what:
// - the store adapters: DuplicateEmailError, InvalidCursorError, StoreValidationError, StoreError
// - config.ts: ConfigError
// - uploads: HttpError (the JSON error handler in app answers it with its status) The store adapters raise the first four, so callers
// never depend on a driver's own error types; store/errors.ts re-exports them for the store code.

export class DuplicateEmailError extends Error {
  constructor() {
    super('A user with this email already exists');
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCursorError extends Error {
  constructor(message = 'Invalid cursor') {
    super(message);
    this.name = 'InvalidCursorError';
  }
}

// A field broke a length or required rule (the same rules the Mongo schema enforces).
export class StoreValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreValidationError';
  }
}

// The store cannot start or write (corrupt file, newer schema, lock held, closed store).
export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreError';
  }
}

// The settings are wrong or missing. One problem per line, key names only: a zod issue message
// describes the rule, never the value, so no secret ends up in the message.
export class ConfigError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`Invalid configuration:\n${problems.map((line) => `  - ${line}`).join('\n')}`);
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

// An error the JSON error handler (app) answers with `status`. `expose` says the message is safe to
// show to the client; without it the handler sends a generic "Bad request".
export class HttpError extends Error {
  readonly status: number;
  readonly expose: boolean;

  constructor(status: number, message: string, expose = false) {
    super(message);
    this.status = status;
    this.expose = expose;
  }
}
// A handler that needs the signed-in user ran without `protect` in front of it. The routes always
// put `protect` first, so this only fires if a route is wired wrong; the message is the one
// `protect` itself answers with.
export class UnauthorizedError extends HttpError {
  constructor() {
    super(401, 'You are not logged in! Please log in to get access.', true);
    this.name = 'UnauthorizedError';
  }
}
