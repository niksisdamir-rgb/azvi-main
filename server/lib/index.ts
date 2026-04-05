import "dotenv/config";
import { logger } from "./logger";
import pinoHttp from "pino-http";
import * as client from "prom-client";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startAnalyticsWorker } from "./workers/analyticsWorker";
import { startNotificationWorker } from "./workers/notificationWorker";
import type { Worker } from "bullmq";
import { corsMiddleware } from "./cors";
import { ENV } from "./env";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
});
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
});

let analyticsWorker: Worker | null = null;
let notificationWorker: Worker | null = null;

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Attach pino-http logger middleware
  app.use(pinoHttp({ logger }));

  // Prometheus configuration
  client.collectDefaultMetrics();
  app.get('/metrics', async (req, res) => {
    const token = ENV.metricsAuthToken;
    // Require token in production, OR if one is explicitly set in dev
    if (ENV.isProduction || token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${token}`) {
        return res.status(401).send("Unauthorized");
      }
    }
    
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (ex) {
      res.status(500).end(String(ex));
    }
  });

  // CORS Middleware
  app.use(corsMiddleware);

  // Configure body parser with specific limits for different routes
  // Large payloads for file uploads and bulk operations
  const uploadRoutes = [
    "/api/trpc/documents.upload",
    "/api/trpc/qualityTests.uploadPhoto",
    "/api/trpc/qualityTests.syncOfflineTests",
    "/api/trpc/timesheets.bulkUpload",
    // bulkImport procedures
    "/api/trpc/bulkImport.previewFile",
    "/api/trpc/bulkImport.importWorkHours",
    "/api/trpc/bulkImport.importMaterials",
    "/api/trpc/bulkImport.importDocuments"
  ];
  
  app.use(uploadRoutes, express.json({ limit: "50mb" }));
  app.use(uploadRoutes, express.urlencoded({ limit: "50mb", extended: true }));

  // Default global limit for all other routes
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error | any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.message && err.message.startsWith("CORS error")) {
      return res.status(403).send("Forbidden: Cross-Origin Request Blocked");
    }
    logger.error({ err, req }, "Unhandled Application Error");
    res.status(500).send("Internal Server Error");
  });

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
    
    // Only start the workers if Redis is available,
    // otherwise it will spew continuous ETIMEDOUT errors.
    import("./redis").then(({ redis }) => {
      redis.ping().then(async () => {
        analyticsWorker = await startAnalyticsWorker();
        notificationWorker = await startNotificationWorker();
      }).catch(() => {
        logger.warn("Redis is unavailable, skipping Background Workers boot.");
      });
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`[Server] ${signal} received. Closing workers and server...`);
    
    if (analyticsWorker) {
      await analyticsWorker.close();
      logger.info("[Server] Analytics worker closed");
    }
    if (notificationWorker) {
      await notificationWorker.close();
      logger.info("[Server] Notification worker closed");
    }

    server.close(() => {
      logger.info("[Server] HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10s if not closed
    setTimeout(() => {
      logger.error("[Server] Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => logger.error({ err }, "Failed to start server"));
