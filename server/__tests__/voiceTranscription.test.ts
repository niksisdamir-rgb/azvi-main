import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { transcribeAudio } from "../lib/voiceTranscription";
import { ENV } from "../lib/env";

// Mock fetch globally
global.fetch = vi.fn();

describe("Voice Transcription Service", () => {
  const originalForgeApiUrl = ENV.forgeApiUrl;
  const originalForgeApiKey = ENV.forgeApiKey;

  beforeEach(() => {
    vi.clearAllMocks();
    (ENV as any).forgeApiUrl = "https://api.openai.com/v1/";
    (ENV as any).forgeApiKey = "test-key";
  });

  afterEach(() => {
    (ENV as any).forgeApiUrl = originalForgeApiUrl;
    (ENV as any).forgeApiKey = originalForgeApiKey;
  });

  it("should successfully transcribe audio when all parameters are valid", async () => {
    const audioUrl = "https://example.com/audio.mp3";
    const dummyAudioBuffer = Buffer.from("dummy-audio-content");
    const mockWhisperResponse = {
      task: "transcribe",
      language: "english",
      duration: 10.5,
      text: "Hello world",
      segments: [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: 10.5,
          text: "Hello world",
          tokens: [50364, 2425, 2159, 50890],
          temperature: 0,
          avg_logprob: -0.123,
          compression_ratio: 1.2,
          no_speech_prob: 0.01,
        },
      ],
    };

    // Mock audio download
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => dummyAudioBuffer.buffer,
      headers: new Map([["content-type", "audio/mpeg"]]),
    });

    // Mock Whisper API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWhisperResponse,
    });

    const result = await transcribeAudio({ audioUrl });

    expect(result).toEqual(mockWhisperResponse);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    
    // First call: audio download
    expect(global.fetch).toHaveBeenNthCalledWith(1, audioUrl);
    
    // Second call: Whisper API
    const whisperCall = (global.fetch as any).mock.calls[1];
    expect(whisperCall[0]).toContain("v1/audio/transcriptions");
    expect(whisperCall[1].headers.authorization).toBe(`Bearer ${ENV.forgeApiKey}`);
  });

  it("should return error when audio download fails", async () => {
    const audioUrl = "https://example.com/audio.mp3";

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const result = await transcribeAudio({ audioUrl });
    expect(result).toMatchObject({
      error: "Failed to download audio file",
      code: "INVALID_FORMAT",
      details: "HTTP 404: Not Found",
    });
  });

  it("should return error when Whisper API fails", async () => {
    const audioUrl = "https://example.com/audio.mp3";
    const dummyAudioBuffer = Buffer.from("dummy-audio-content");

    // Mock audio download success
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => dummyAudioBuffer.buffer,
      headers: new Map([["content-type", "audio/mpeg"]]),
    });

    // Mock Whisper API failure
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "API details",
    });

    const result = await transcribeAudio({ audioUrl });
    expect(result).toMatchObject({
      error: "Transcription service request failed",
      code: "TRANSCRIPTION_FAILED",
      details: "500 Internal Server Error: API details",
    });
  });

  it("should return error when forgeApiUrl is missing", async () => {
    (ENV as any).forgeApiUrl = "";
    const audioUrl = "https://example.com/audio.mp3";

    const result = await transcribeAudio({ audioUrl });
    expect(result).toMatchObject({
      error: "Voice transcription service is not configured",
      code: "SERVICE_ERROR",
      details: "BUILT_IN_FORGE_API_URL is not set",
    });
  });

  it("should return error when forgeApiKey is missing", async () => {
    (ENV as any).forgeApiKey = "";
    const audioUrl = "https://example.com/audio.mp3";

    const result = await transcribeAudio({ audioUrl });
    expect(result).toMatchObject({
      error: "Voice transcription service authentication is missing",
      code: "SERVICE_ERROR",
      details: "BUILT_IN_FORGE_API_KEY is not set",
    });
  });

  it("should handle invalid transcription response from API", async () => {
    const audioUrl = "https://example.com/audio.mp3";
    const dummyAudioBuffer = Buffer.from("dummy-audio-content");

    // Mock audio download
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => dummyAudioBuffer.buffer,
      headers: new Map([["content-type", "audio/mpeg"]]),
    });

    // Mock Whisper API response with missing text
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await transcribeAudio({ audioUrl });
    expect(result).toMatchObject({
      error: "Invalid transcription response",
      code: "SERVICE_ERROR",
    });
  });

  it("should handle file size limit (16MB)", async () => {
    const audioUrl = "https://example.com/audio.mp3";
    const largeBuffer = Buffer.alloc(17 * 1024 * 1024); // 17MB

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => largeBuffer.buffer,
      headers: new Map([["content-type", "audio/mpeg"]]),
    });

    const result = await transcribeAudio({ audioUrl });
    expect(result).toMatchObject({
      error: "Audio file exceeds maximum size limit",
      code: "FILE_TOO_LARGE",
    });
  });
});
