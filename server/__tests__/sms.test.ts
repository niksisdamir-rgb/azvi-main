import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock fetch globally
global.fetch = vi.fn();

describe("SMS Service", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variables before importing the module
    process.env.BUILT_IN_FORGE_API_URL = "https://api.example.com";
    process.env.BUILT_IN_FORGE_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("should validate phone number is required", async () => {
    const { sendSMS } = await import("../lib/sms");
    await expect(
      sendSMS({
        phoneNumber: "",
        message: "Test message",
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should validate message is required", async () => {
    const { sendSMS } = await import("../lib/sms");
    await expect(
      sendSMS({
        phoneNumber: "+1234567890",
        message: "",
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should validate phone number length", async () => {
    const { sendSMS } = await import("../lib/sms");
    const longPhone = "+1".repeat(15);
    await expect(
      sendSMS({
        phoneNumber: longPhone,
        message: "Test message",
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should validate message length", async () => {
    const { sendSMS } = await import("../lib/sms");
    const longMessage = "a".repeat(200);
    await expect(
      sendSMS({
        phoneNumber: "+1234567890",
        message: longMessage,
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should throw error when API URL is not configured", async () => {
    delete process.env.BUILT_IN_FORGE_API_URL;
    vi.resetModules();
    const { sendSMS } = await import("../lib/sms");
    await expect(
      sendSMS({
        phoneNumber: "+1234567890",
        message: "Test message",
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should throw error when API key is not configured", async () => {
    delete process.env.BUILT_IN_FORGE_API_KEY;
    vi.resetModules();
    const { sendSMS } = await import("../lib/sms");
    await expect(
      sendSMS({
        phoneNumber: "+1234567890",
        message: "Test message",
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should successfully send SMS when all parameters are valid", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    const { sendSMS } = await import("../lib/sms");
    const result = await sendSMS({
      phoneNumber: "+1234567890",
      message: "Test message",
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("should return success false when API returns error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Server error",
    });

    const { sendSMS } = await import("../lib/sms");
    const result = await sendSMS({
      phoneNumber: "+1234567890",
      message: "Test message",
    });

    expect(result.success).toBe(false);
  });

  it("should return success false when fetch fails", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { sendSMS } = await import("../lib/sms");
    const result = await sendSMS({
      phoneNumber: "+1234567890",
      message: "Test message",
    });

    expect(result.success).toBe(false);
  });

  it("should trim whitespace from phone number and message", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    const { sendSMS } = await import("../lib/sms");
    const result = await sendSMS({
      phoneNumber: "  +1234567890  ",
      message: "  Test message  ",
    });

    expect(result.success).toBe(true);
    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(callBody.phoneNumber).toBe("+1234567890");
    expect(callBody.message).toBe("Test message");
  });
});
