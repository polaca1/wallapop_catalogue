import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fetchCatalog } from '../api/catalog.js';

const root = new URL('../', import.meta.url).pathname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/catalog') {
    try {
      const catalog = await fetchCatalog();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(catalog));
    } catch (error) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  try {
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!/^(index\.html|styles\.css|app\.js|snapshot\.json|favicon\.svg)$/.test(file)) throw new Error('Invalid path');
    const data = await readFile(join(root, file));
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
server.listen(3000, () => console.log('http://localhost:3000'));
