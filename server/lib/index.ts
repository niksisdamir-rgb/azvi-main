import "dotenv/config";
import { logger } from "./logger";
import pinoHttp from "pino-http";
import * as client from "prom-client";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
});
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
});
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { scheduleOverdueTaskCheck, scheduleDelayedDeliveryCheck, scheduleForecastingJob } from "./notificationJobs";
import { startAnalyticsWorker } from "./workers/analyticsWorker";

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

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Attach pino-http logger middleware
  app.use(pinoHttp({ logger }));

import { corsMiddleware } from "./cors";

  // Prometheus configuration
  client.collectDefaultMetrics();
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (ex) {
      res.status(500).end(String(ex));
    }
  });

  // CORS Middleware
  app.use(corsMiddleware);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "4000");

  // Global error handler middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.message && err.message.startsWith("CORS error")) {
      return res.status(403).send("Forbidden: Cross-Origin Request Blocked");
    }
    logger.error({ err, req }, "Unhandled Application Error");
    res.status(500).send("Internal Server Error");
  });

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
    
    // Start background jobs
    scheduleOverdueTaskCheck();
    scheduleDelayedDeliveryCheck();
    null;
    
    // Only start the analytics worker if Redis is available,
    // otherwise it will spew continuous ETIMEDOUT errors.
    import("./redis").then(({ redis }) => {
      redis.ping().then(() => {
        startAnalyticsWorker();
      }).catch(() => {
        logger.warn("Redis is unavailable, skipping AnalyticsWorker boot. Analytics will fall back to inline computation.");
      });
    });
  });
}

startServer().catch((err) => logger.error({ err }, "Failed to start server"));
