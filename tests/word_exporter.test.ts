import { describe, it, expect } from "vitest";
import { wordExport } from "@src/services/word_exporter";
import {
  TranscriptMeta,
  TranscriptData,
  TranscriptSegment,
  file_type,
} from "@shared/transcript";

describe("wordExport", () => {
  it("should export a transcript to a Word document and save it", async () => {
    // 1. Create mock data
    const mockMeta: TranscriptMeta = {
      id: "test-meta-id",
      title: "Test Document Title",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file_id: "test-file-id",
      file_url: "test-file-url",
      file_type: "audio" as file_type, // Cast to file_type
      data_id: "test-data-id",
      status: "ready",
    };

    const mockSegments: TranscriptSegment[] = [
      {
        speaker: "ETRM",
        start: 0,
        end: 5,
        text: "Hello world, this is the first segment.",
      },
      {
        speaker: "ETRM",
        start: 5,
        end: 10,
        text: "Hello world, this is the second first segment.",
      },
      {
        speaker: "Oyebola",
        start: 10,
        end: 15,
        text: "This is the second segment from a different speaker.",
      },
      {
        speaker: "ETRM",
        start: 15,
        end: 20,
        text: "And a final segment to round things off.",
      },
    ];

    const mockData: TranscriptData = {
      id: "test-data-id",
      previous_did: "prev-data-id",
      meta_id: "test-meta-id",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      segments: mockSegments,
    };

    // 2. Call the exportTranscript function
    const blob = await wordExport.exportTranscript(mockMeta, mockData);

    // 3. Assert the MIME type
    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  });
});
