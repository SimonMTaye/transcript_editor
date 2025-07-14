import { describe, it, expect, vi, beforeEach } from "vitest";
import { TranscriptSegment } from "@shared/transcript";
import { refineFactory, defaultModel } from "@worker/gemini_transform";

// Default model constant here
const DEFAULT_MODEL = "gemini-2.5-flash-preview-04-17";


// Mock OpenAI SDK
const mockCreate = vi.fn();

vi.mock("openai", () => ({
  OpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

// Import after mocking

describe("gemini_transform", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("refineFactory", () => {
    it("should create OpenAI client with correct configuration", async () => {
      const apiKey = "test-api-key";
      const model = DEFAULT_MODEL;

      const { OpenAI } = await import("openai");

      await refineFactory(apiKey, model);

      expect(OpenAI).toHaveBeenCalledWith({
        apiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });
    });

    it("should process transcript segments and return refined segments", async () => {
      const apiKey = "test-api-key";
      const model = DEFAULT_MODEL;

      const mockSegments: TranscriptSegment[] = [
        {
          start: 0,
          end: 5,
          speaker: "Speaker 1",
          text: "Um, hello there, how are you doing today?",
        },
        {
          start: 5,
          end: 10,
          speaker: "Speaker 2",
          text: "I'm doing well, thanks for asking!",
        },
      ];

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                segments: [
                  {
                    start: 0,
                    end: 5,
                    speaker: "Speaker 1",
                    text: "Hello there, how are you doing today?",
                  },
                  {
                    start: 5,
                    end: 10,
                    speaker: "Speaker 2",
                    text: "I'm doing well, thanks for asking!",
                  },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const refine = await refineFactory(apiKey, model);
      const result = await refine(mockSegments);

      expect(mockCreate).toHaveBeenCalledWith({
        model,
        messages: [
          {
            role: "system",
            content: expect.stringContaining("You are an expert content editor"),
          },
          {
            role: "user",
            content: expect.stringContaining("Here is the raw transcript:"),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transcript_segments",
            schema: expect.objectContaining({
              type: "object",
              required: ["segments"],
              properties: expect.objectContaining({
                segments: expect.objectContaining({
                  type: "array",
                  items: expect.objectContaining({
                    type: "object",
                    required: ["start", "end", "speaker", "text"],
                  }),
                }),
              }),
            }),
          },
        },
      });

      expect(result).toEqual([
        {
          start: 0,
          end: 5,
          speaker: "Speaker 1",
          text: "Hello there, how are you doing today?",
        },
        {
          start: 5,
          end: 10,
          speaker: "Speaker 2",
          text: "I'm doing well, thanks for asking!",
        },
      ]);
    });

    it("should format transcript segments correctly in user message", async () => {
      const apiKey = "test-api-key";
      const model = DEFAULT_MODEL;

      const mockSegments: TranscriptSegment[] = [
        {
          start: 0,
          end: 5,
          speaker: "Speaker 1",
          text: "Hello world",
        },
        {
          start: 5,
          end: 10,
          speaker: null,
          text: "No speaker here",
        },
      ];

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                segments: mockSegments,
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const refine = await refineFactory(apiKey, model);
      await refine(mockSegments);

      // Verify that the user message contains the correctly formatted transcript
      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain("0 - 5 ?Speaker 1: Hello world");
      expect(userMessage).toContain("5 - 10 : No speaker here");
    });

    it("should handle empty segments array", async () => {
      const apiKey = "test-api-key";
      const model = DEFAULT_MODEL;

      const mockSegments: TranscriptSegment[] = [];

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                segments: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const refine = await refineFactory(apiKey, model);
      const result = await refine(mockSegments);

      expect(result).toEqual([]);
    });
  });

  describe("defaultModel", () => {
    it("should export correct default model", () => {
      expect(defaultModel).toBe(DEFAULT_MODEL);
    });
  });
});
