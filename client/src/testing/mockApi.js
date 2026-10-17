import { vi } from 'vitest';

// Stubs global fetch for component tests. `routes` maps 'METHOD /path' to a reply, or to a function
// that returns one: { status = 200, body } (body is sent as JSON). A reply may also be a promise
// that never settles, to keep a request in flight. Unlisted requests answer 404 so a forgotten
// route fails loudly. Remember to call vi.unstubAllGlobals() in afterEach.
/**
 * @param {Record<string, any>} routes
 */
export const mockApi = (routes) => {
  /** @type {Array<{ method: string, path: string, body: any, headers: any }>} */
  const calls = [];
  const handlers = { ...routes };

  const fetchMock = vi.fn(async (path, init = {}) => {
    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
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
    set: (key, handler) => {
      handlers[key] = handler;
    },
    /** Requests seen for 'METHOD /path'. */
    callsTo: (key) => calls.filter((call) => `${call.method} ${call.path}` === key),
  };
};
