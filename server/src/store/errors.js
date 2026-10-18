// Errors every storage adapter raises, so callers never depend on a driver's own error types.

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
  constructor(message) {
    super(message);
    this.name = 'StoreValidationError';
  }
}

// The store cannot start or write (corrupt file, newer schema, lock held, closed store).
export class StoreError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StoreError';
  }
}
