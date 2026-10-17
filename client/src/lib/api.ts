// Thin fetch wrapper for the JSON API. Every call goes through here so errors look the same
// everywhere: a rejected promise with an ApiError { status, message }.

export interface RequestOptions {
  /** A plain object is sent as JSON, a FormData is passed through as is. */
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;

  /**
   * @param status HTTP status, or 0 when the request never got an answer.
   * @param message The server's `message`, or a fallback.
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Reads the body once. Empty (204) or non-JSON bodies give `null` instead of throwing. */
const readBody = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

/** The server's error text. A few routes answer with `msg` instead of `message`. */
const errorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'object' && data !== null) {
    if ('message' in data && typeof data.message === 'string') return data.message;
    if ('msg' in data && typeof data.msg === 'string') return data.msg;
  }
  return fallback;
};

// T is the response type the caller declares for the route. The wrapper cannot know it: the shapes are
// pinned by server/test/contracts.spec.ts and shared/test/dto.test.ts, and checking them at runtime here
// would pull zod into the bundle. So the one cast sits at the end of request().

/** @returns The parsed JSON body, or null for an empty body. */
const request = async <T>(
  method: string,
  path: string,
  { body, signal }: RequestOptions = {},
): Promise<T> => {
  const init: RequestInit = { method, credentials: 'include' };
  // Only set when present: under exactOptionalPropertyTypes `signal: undefined` is not "absent".
  if (signal) init.signal = signal;
  if (body instanceof FormData) {
    // No Content-Type here on purpose: the browser adds multipart/form-data with its boundary.
    // Forcing application/json would break the upload.
    init.body = body;
  } else if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (err) {
    // A cancelled request is not an API failure; let Query see the AbortError.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Network error');
  }

  const data = await readBody(res);
  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(data, res.statusText || 'Request failed'));
  }
  return data as T;
};

export const api = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> => request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions): Promise<T> => request<T>('POST', path, options),
  put: <T>(path: string, options?: RequestOptions): Promise<T> => request<T>('PUT', path, options),
  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('DELETE', path, options),
};
