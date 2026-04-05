import { describe, it, expect } from "vitest";
import { getSessionCookieOptions } from "../lib/cookies";
import { Request } from "express";

describe("Session Cookie Settings", () => {
  it("should enforce a 30-day maxAge on session cookies", () => {
    // Create a mock request object
    const mockReq = {
      protocol: "https",
      headers: {},
    } as unknown as Request;

    const options = getSessionCookieOptions(mockReq);

    // Verify 30 days in milliseconds
    const expectedMaxAge = 30 * 24 * 60 * 60 * 1000;
    
    expect(options.maxAge).toBe(expectedMaxAge);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(true);
  });
});
