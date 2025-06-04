import { describe, it, expect, vi, beforeEach } from "vitest";
import { deepgramFactory } from "@worker/deepgram_transcriber";
import { TranscriptSegment } from "@shared/transcript";
import {
  createClient,
  DeepgramResponse,
  SyncPrerecordedResponse,
} from "@deepgram/sdk"; // Used for type, actual is mocked

// Mock the Deepgram SDK using Vitest
const mockTranscribeFile = vi.fn();
vi.mock("@deepgram/sdk", () => ({
  createClient: vi.fn(() => ({
    listen: {
      prerecorded: {
        transcribeFile: mockTranscribeFile,
      },
    },
  })),
}));

describe("deepgramFactory", () => {
  const apiKey = "test_api_key";
  let transcriber: ReturnType<typeof deepgramFactory>;
  // Create a mock File object. Its content doesn't matter since the API call is mocked.
  // Vitest/Node might not have File by default in this environment, so a simple mock.
  const mockFile = {
    arrayBuffer: async () => new ArrayBuffer(10), // Mock arrayBuffer
    name: "audio.mp3",
    type: "audio/mpeg",
  } as File;

  beforeEach(() => {
    // Reset mocks before each test
    mockTranscribeFile.mockReset();
    (createClient as ReturnType<typeof vi.fn>).mockClear(); // Clear mock usage data
    transcriber = deepgramFactory(apiKey);
  });

  it("should correctly transcribe audio and map to TranscriptSegments with diarization", async () => {
    const mockApiResponse: DeepgramResponse<SyncPrerecordedResponse> = {
      error: null,
      result: {
        metadata: {
          request_id: "mock_metadata_request_id",
          created: "2023-01-01T00:00:00Z",
          duration: 2.5,
          channels: 1,
          models: ["mock_model_id"],
          model_info: {
            mock_model_id: {
              name: "nova-2",
              version: "1.0",
              arch: "mock_arch",
            },
          },
          transaction_key: "",
          sha256: "",
        },
        results: {
          channels: [
            {
              // This structure might differ based on actual Deepgram responses, simplified here
              alternatives: [
                {
                  transcript: "Hello world Hi there",
                  confidence: 0.99,
                  words: [
                    // Simplified word structure for this example
                    {
                      word: "Hello",
                      start: 0.5,
                      end: 0.8,
                      confidence: 0.99,
                      speaker: 0,
                      punctuated_word: "Hello",
                    },
                    {
                      word: "world",
                      start: 0.8,
                      end: 1.5,
                      confidence: 0.99,
                      speaker: 0,
                      punctuated_word: "world.",
                    },
                    {
                      word: "Hi",
                      start: 1.8,
                      end: 2.0,
                      confidence: 0.98,
                      speaker: 1,
                      punctuated_word: "Hi",
                    },
                    {
                      word: "there",
                      start: 2.0,
                      end: 2.5,
                      confidence: 0.98,
                      speaker: 1,
                      punctuated_word: "there.",
                    },
                  ],
                },
              ],
            },
          ],
          utterances: [
            {
              speaker: 0,
              start: 0.5,
              end: 1.5,
              transcript: "Hello world",
              confidence: 0.99,
              id: "utt1",
              words: [] /* simplified for test */,
              channel: 0,
            },
            {
              speaker: 1,
              start: 1.8,
              end: 2.5,
              transcript: "Hi there",
              confidence: 0.98,
              id: "utt2",
              words: [] /* simplified for test */,
              channel: 0,
            },
          ],
        },
      },
    };
    mockTranscribeFile.mockResolvedValueOnce(mockApiResponse);

    const segments: TranscriptSegment[] = await transcriber.transcribeAudio(
      mockFile
    );

    expect(createClient).toHaveBeenCalledWith(apiKey);
    expect(mockTranscribeFile).toHaveBeenCalledWith(
      expect.any(Buffer), // Check that a Buffer is passed
      {
        model: "nova-2",
        smart_format: true,
        diarize: true,
        utterances: true,
      }
    );
    expect(segments).toEqual([
      { start: 0.5, end: 1.5, text: "Hello world", speaker: "Speaker 0" },
      { start: 1.8, end: 2.5, text: "Hi there", speaker: "Speaker 1" },
    ]);
  });

  it("should handle Deepgram API errors", async () => {
    const errorMessage = "API Error: Failed to transcribe";
    mockTranscribeFile.mockRejectedValueOnce(new Error(errorMessage));

    await expect(transcriber.transcribeAudio(mockFile)).rejects.toThrow(
      `Deepgram transcription failed: ${errorMessage}`
    );

    expect(createClient).toHaveBeenCalledWith(apiKey);
    expect(mockTranscribeFile).toHaveBeenCalledWith(expect.any(Buffer), {
      model: "nova-2",
      smart_format: true,
      diarize: true,
      utterances: true,
    });
  });

  it("should handle empty utterances array from Deepgram API", async () => {
    const mockApiResponseEmptyUtterances: DeepgramResponse<SyncPrerecordedResponse> =
      {
        error: null,
        result: {
          metadata: {
            request_id: "mock_metadata_request_id_empty",
            created: "2023-01-01T00:00:00Z",
            duration: 0,
            channels: 1,
            models: ["mock_model_id"],
            model_info: {
              mock_model_id: {
                name: "nova-2",
                version: "1.0",
                arch: "mock_arch",
              },
            },
            transaction_key: "",
            sha256: "",
          },
          results: {
            channels: [],
            utterances: [],
          },
        },
      };
    mockTranscribeFile.mockResolvedValueOnce(mockApiResponseEmptyUtterances);

    const segments: TranscriptSegment[] = await transcriber.transcribeAudio(
      mockFile
    );
    expect(segments).toEqual([]);
  });

  it("should handle missing utterances from Deepgram API (results.utterances is undefined)", async () => {
    const mockApiResponseNoUtterances: DeepgramResponse<SyncPrerecordedResponse> =
      {
        error: null,
        result: {
          metadata: {
            request_id: "m",
            created: "c",
            duration: 0,
            channels: 0,
            models: [],
            model_info: {},
          } as any,
          results: {
            channels: [],
            // utterances field is undefined
          } as any,
        },
      };
    mockTranscribeFile.mockResolvedValueOnce(mockApiResponseNoUtterances);

    const segments: TranscriptSegment[] = await transcriber.transcribeAudio(
      mockFile
    );
    expect(segments).toEqual([]);
  });

  it("should handle missing results from Deepgram API (response.results is undefined)", async () => {
    const mockApiResponseNoResults: DeepgramResponse<SyncPrerecordedResponse> =
      {
        request_id: "mock_request_id_no_results",
        metadata: {
          request_id: "m",
          created: "c",
          duration: 0,
          channels: 0,
          models: [],
          model_info: {},
        } as any,
        // results field is undefined
      } as any;
    mockTranscribeFile.mockResolvedValueOnce(mockApiResponseNoResults);

    const segments: TranscriptSegment[] = await transcriber.transcribeAudio(
      mockFile
    );
    expect(segments).toEqual([]);
  });
});
