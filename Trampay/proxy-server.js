const http = require('http');
const httpProxy = require('http-proxy');
const net = require('net');

function checkPort(port, callback) {
  const socket = new net.Socket();
  socket.setTimeout(1000);
  socket.on('connect', () => {
    socket.destroy();
    callback(true);
  });
  socket.on('timeout', () => {
    socket.destroy();
    callback(false);
  });
  socket.on('error', () => {
    callback(false);
  });
  socket.connect(port, '127.0.0.1');
}

function waitForPort(port, maxWait = 60000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      checkPort(port, (isOpen) => {
        if (isOpen) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(interval);
          reject(new Error(`Port ${port} did not open within ${maxWait}ms`));
        }
      });
    }, 500);
  });
}

async function startProxy() {
  console.log('Waiting for Expo dev server on port 8081...');
  await waitForPort(8081);
  console.log('Expo dev server is ready!');

  const proxy = httpProxy.createProxyServer({
    target: 'http://localhost:8081',
    ws: true,
    changeOrigin: true,
  });

  const server = http.createServer((req, res) => {
    req.headers.origin = 'http://localhost:5000';
    req.headers.referer = 'http://localhost:5000/';
    req.headers.host = 'localhost:8081';
    proxy.web(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    proxy.ws(req, socket, head);
  });

  server.listen(5000, '0.0.0.0', () => {
    console.log('Proxy server listening on 0.0.0.0:5000, forwarding to localhost:8081');
  });

  proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (res && res.writeHead) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: Expo server not available');
    }
  });
}

startProxy().catch((err) => {
  console.error('Failed to start proxy:', err);
  process.exit(1);
});
