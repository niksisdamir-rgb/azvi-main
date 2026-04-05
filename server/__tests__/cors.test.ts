import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { corsMiddleware } from "../lib/cors";

describe("CORS Middleware", () => {
  const app = express();
  app.use(corsMiddleware);
  
  // Custom error handler to match what we put in index.ts
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.message && err.message.startsWith("CORS error")) {
      return res.status(403).send("Forbidden: Cross-Origin Request Blocked");
    }
    res.status(500).send("Internal Server Error");
  });

  app.get("/test", (req, res) => {
    res.send("OK");
  });

  it("should allow request with no origin (e.g. server-to-server or curl)", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
  });

  it("should allow request from allowed origin (localhost)", async () => {
    const res = await request(app)
      .get("/test")
      .set("Origin", "http://localhost:3000");
    
    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
  });

  it("should block request from disallowed origin and return 403", async () => {
    const res = await request(app)
      .get("/test")
      .set("Origin", "http://evil-attacker.com");
    
    expect(res.status).toBe(403);
    expect(res.text).toBe("Forbidden: Cross-Origin Request Blocked");
  });
});
