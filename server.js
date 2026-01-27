/**
 * Next.js Development Server
 * 
 * This is a simple Next.js server for the frontend.
 * All real-time communication (chat, notifications) is handled
 * by the Notification Microservice on port 4005.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Frontend ready at http://${hostname}:${port}`);
      console.log(`> API Gateway at http://localhost:4000`);
      console.log(`> Notification Service (real-time) at http://localhost:4005`);
    });
});
