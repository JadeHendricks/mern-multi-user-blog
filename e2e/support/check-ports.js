// Fails fast when something already listens on a port the e2e run needs. Playwright starts its own
// servers with reuseExistingServer: false, so a leftover dev server would only show up minutes later
// as "port already used". This script does not kill anything: it is not safe to guess which
// process may be stopped, so it names the port and how to find the owner.
const net = require('node:net');

const PORTS = [
  { port: 3000, what: 'the Vite dev server' },
  { port: 5000, what: 'the API' },
  { port: 5001, what: 'the API instance that serves the built client' },
];
// A leftover server can listen on IPv4 or IPv6 (localhost resolves to either), so ask both.
const HOSTS = ['127.0.0.1', '::1'];

// Resolves true when something accepts a connection on host:port.
const isListening = (host, port) =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });

async function main() {
  const busy = [];
  for (const { port, what } of PORTS) {
    const results = await Promise.all(HOSTS.map((host) => isListening(host, port)));
    if (results.some(Boolean)) busy.push({ port, what });
  }
  if (busy.length === 0) return;
  for (const { port, what } of busy) {
    console.error(`Port ${port} is already in use, but the e2e run needs it for ${what}.`);
    console.error(
      `  Find the process:  Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object OwningProcess`,
    );
    console.error('  Then stop it (Stop-Process -Id <pid>) if it is a leftover of yours.');
  }
  process.exit(1);
}

main();
