import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { createStreamingRouter } from "./streamingEndpoint";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

// SSE streaming endpoint
app.use(createStreamingRouter());

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// For Vercel, we only need to export the app with routes registered
// We skip static serving here because vercel.json handles it via rewrites
if (!process.env.VERCEL) {
  if (process.env.NODE_ENV === "development") {
    // Development mode setup is async, so we wrap it
    (async () => {
      const server = createServer(app);
      await setupVite(app, server);
      const port = await findAvailablePort(3000);
      server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}/`);
      });
    })().catch(console.error);
  } else {
    // Production mode
    serveStatic(app);
    const server = createServer(app);
    findAvailablePort(3000).then(port => {
      server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}/`);
      });
    });
  }
}

export default app;
