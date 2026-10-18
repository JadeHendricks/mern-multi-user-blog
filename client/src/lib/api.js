// Thin fetch wrapper for the JSON API. Every call goes through here so errors look the same
// everywhere: a rejected promise with an ApiError { status, message }.

/**
 * @typedef {object} RequestOptions
 * @property {unknown} [body] A plain object is sent as JSON, a FormData is passed through as is.
 * @property {AbortSignal} [signal]
 */

export class ApiError extends Error {
  /**
   * @param {number} status HTTP status, or 0 when the request never got an answer.
   * @param {string} message The server's `message`, or a fallback.
   */
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Reads the body once. Empty (204) or non-JSON bodies give `null` instead of throwing. */
const readBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * @param {string} method
 * @param {string} path
 * @param {RequestOptions} [options]
 * @returns {Promise<any>} The parsed JSON body, or null for an empty body.
 */
const request = async (method, path, { body, signal } = {}) => {
  /** @type {RequestInit} */
  const init = { method, credentials: 'include', signal };
  if (body instanceof FormData) {
    // No Content-Type here on purpose: the browser adds multipart/form-data with its boundary.
    // Forcing application/json would break the upload.
    init.body = body;
  } else if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(path, init);
  } catch (err) {
    // A cancelled request is not an API failure; let Query see the AbortError.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Network error');
  }

  const data = await readBody(res);
  if (!res.ok) {
    // A few routes answer with `msg` instead of `message`.
    const message = data?.message ?? data?.msg ?? (res.statusText || 'Request failed');
    throw new ApiError(res.status, message);
  }
  return data;
};

export const api = {
  /** @param {string} path @param {RequestOptions} [options] */
  get: (path, options) => request('GET', path, options),
  /** @param {string} path @param {RequestOptions} [options] */
  post: (path, options) => request('POST', path, options),
  /** @param {string} path @param {RequestOptions} [options] */
  put: (path, options) => request('PUT', path, options),
  /** @param {string} path @param {RequestOptions} [options] */
  delete: (path, options) => request('DELETE', path, options),
};
