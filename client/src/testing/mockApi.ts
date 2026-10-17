import { vi } from 'vitest';

export interface MockReply {
  /** Defaults to 200. */
  status?: number;
  /** Sent as JSON; leave it out for an empty body. */
  body?: unknown;
}

export interface MockRequest {
  /** The parsed JSON body, or the FormData / other body as it was sent. */
  body: unknown;
}

export type MockHandler = MockReply | ((request: MockRequest) => MockReply | Promise<MockReply>);

export interface MockCall {
  method: string;
  path: string;
  body: unknown;
  headers: HeadersInit | undefined;
}

// Stubs global fetch for component tests. `routes` maps 'METHOD /path' to a reply, or to a function
// that returns one: { status = 200, body } (body is sent as JSON). A reply may also be a promise
// that never settles, to keep a request in flight. Unlisted requests answer 404 so a forgotten
// route fails loudly. Remember to call vi.unstubAllGlobals() in afterEach.
export const mockApi = (routes: Record<string, MockHandler>) => {
  const calls: MockCall[] = [];
  const handlers: Record<string, MockHandler> = { ...routes };
  const fetchMock = vi.fn(async (path: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body: unknown = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    calls.push({ method, path, body, headers: init.headers });
    const handler = handlers[`${method} ${path}`];
    if (!handler) {
      return new Response(JSON.stringify({ message: `Unhandled ${method} ${path}` }), { status: 404 });
    }
    const reply = typeof handler === 'function' ? await handler({ body }) : handler;
    const { status = 200, body: replyBody } = reply;
    return new Response(replyBody === undefined ? null : JSON.stringify(replyBody), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    calls,
    fetchMock,
    /** Replace or add a reply after the stub was created. */
    set: (key: string, handler: MockHandler): void => {
      handlers[key] = handler;
    },
    /** Requests seen for 'METHOD /path'. */
    callsTo: (key: string): MockCall[] =>
      calls.filter((call) => `${call.method} ${call.path}` === key),
    /** The first request seen for 'METHOD /path'; the test fails when there was none. */
    firstCallTo: (key: string): MockCall => {
      const call = calls.find((c) => `${c.method} ${c.path}` === key);
      if (!call) throw new Error(`no request was made to ${key}`);
      return call;
    },
  };
};

/** A request body that must be FormData; the test fails when it is something else. */
export const asFormData = (body: unknown): FormData => {
  if (!(body instanceof FormData)) throw new Error('the request body is not FormData');
  return body;
};
