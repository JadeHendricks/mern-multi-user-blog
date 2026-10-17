const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

// True only when every host in a mongodb:// URI is this machine. mongodb+srv:// always means a DNS
// lookup of a remote cluster, so it is never local. Whatever sits before the last "@" is
// credentials and is ignored, so "mongodb://localhost@evil.test/" is judged by evil.test.
export function isLocalMongoUri(uri: unknown): boolean {
  if (typeof uri !== 'string') return false;
  const authority = /^mongodb:\/\/([^/?#]+)/i.exec(uri.trim())?.[1];
  if (authority === undefined) return false;
  const hostList = authority.slice(authority.lastIndexOf('@') + 1);
  return hostList.split(',').every((hostPort) => {
    const host = hostPort.startsWith('[')
      ? hostPort.slice(1, hostPort.indexOf(']'))
      : hostPort.replace(/:\d*$/, '');
    return LOCAL_HOSTS.has(host.toLowerCase());
  });
}
