/**
 * server.js — Servidor personalizado para Next.js.
 *
 * Permite que Next.js y Socket.IO coexistan en el mismo proceso
 * si alguna vez se necesita. Por ahora sirve como punto de entrada
 * estándar que acepta la variable PORT del entorno.
 */

const { createServer } = require('http');
const { parse }        = require('url');
const next             = require('next');

const dev  = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app    = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Frontend listo en http://localhost:${port}`);
    console.log(`  Modo: ${dev ? 'desarrollo' : 'producción'}`);
    console.log(`  API : ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}`);
  });
});
