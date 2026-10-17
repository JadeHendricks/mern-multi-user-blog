// Errors every storage adapter raises, so callers never depend on a driver's own error types.
// The classes live in lib/errors.ts (the pagination helper needs them too); this file keeps the
// import path the store code and its tests have always used.
export {
  DuplicateEmailError,
  InvalidCursorError,
  StoreError,
  StoreValidationError,
} from '../lib/errors.js';
