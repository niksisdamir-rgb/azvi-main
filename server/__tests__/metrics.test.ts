import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { ENV } from "../lib/env";

describe("Metrics Endpoint Middleware", () => {
  const app = express();
  
  // Use the same logic as in index.ts
  app.get('/metrics', async (req, res) => {
    const token = ENV.metricsAuthToken;
    if (ENV.isProduction || token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${token}`) {
        return res.status(401).send("Unauthorized");
      }
    }
    res.status(200).send("metrics details");
  });

  const originalIsProduction = ENV.isProduction;
  const originalToken = ENV.metricsAuthToken;

  afterEach(() => {
    ENV.isProduction = originalIsProduction;
    ENV.metricsAuthToken = originalToken;
  });

  it("should allow unauthenticated access in development when no token is set", async () => {
    ENV.isProduction = false;
    ENV.metricsAuthToken = "";
    
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
  });

  it("should block unauthenticated access in production", async () => {
    ENV.isProduction = true;
    ENV.metricsAuthToken = "secret-token";
    
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(401);
  });

  it("should allow authenticated access in production", async () => {
    ENV.isProduction = true;
    ENV.metricsAuthToken = "secret-token";
    
    const res = await request(app)
      .get("/metrics")
      .set("Authorization", "Bearer secret-token");
    
    expect(res.status).toBe(200);
  });
  
  it("should block invalid token in production", async () => {
    ENV.isProduction = true;
    ENV.metricsAuthToken = "secret-token";
    
    const res = await request(app)
      .get("/metrics")
      .set("Authorization", "Bearer wrong-token");
    
    expect(res.status).toBe(401);
  });
});
