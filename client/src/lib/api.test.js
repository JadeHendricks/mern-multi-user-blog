import { api, ApiError } from './api';

const jsonResponse = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const stubFetch = (impl) => {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  it('sends credentials and returns the parsed JSON body', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, { posts: [] }));
    await expect(api.get('/api/post')).resolves.toEqual({ posts: [] });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/post');
    expect(init).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(init.body).toBeUndefined();
    expect(init.headers).toBeUndefined();
  });

  it('sends a plain object as JSON with a JSON Content-Type', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, { ok: true }));
    await api.post('/api/auth/login', { body: { email: 'a@b.co', password: 'x' } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.body).toBe(JSON.stringify({ email: 'a@b.co', password: 'x' }));
  });

  it('sends FormData untouched and without a Content-Type header', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(201, { ok: true }));
    const body = new FormData();
    body.append('title', 'Hello');
    await api.put('/api/post/p1', { body });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(body);
    // The browser has to add multipart/form-data with the boundary itself.
    expect(init.headers).toBeUndefined();
  });

  it('throws ApiError with the status and the server message', async () => {
    stubFetch(async () => jsonResponse(401, { message: 'Incorrect email or password' }));
    const error = await api.post('/api/auth/login', { body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: 'Incorrect email or password' });
  });

  it('reads `msg` when a route answers with that instead of `message`', async () => {
    stubFetch(async () => jsonResponse(404, { msg: 'Comment does not exist' }));
    await expect(api.delete('/api/post/comment/p/c')).rejects.toMatchObject({
      status: 404,
      message: 'Comment does not exist',
    });
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    stubFetch(async () => new Response('<html>Bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }));
    await expect(api.get('/api/post')).rejects.toMatchObject({ status: 502, message: 'Bad Gateway' });
  });

  it('turns a network failure into ApiError with status 0', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(api.get('/api/post')).rejects.toMatchObject({ status: 0, message: 'Network error' });
  });

  it('accepts an empty 204 body', async () => {
    stubFetch(async () => new Response(null, { status: 204 }));
    await expect(api.delete('/api/post/p1')).resolves.toBeNull();
  });

  it('passes the AbortSignal to fetch and lets the AbortError through', async () => {
    const controller = new AbortController();
    const fetchMock = stubFetch(
      (_path, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          );
        }),
    );
    const pending = api.get('/api/post', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
