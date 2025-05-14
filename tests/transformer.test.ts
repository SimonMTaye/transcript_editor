import { describe, it, expect } from "vitest";
import { transformer } from "@src/services/transform";
import { TranscriptSegment } from "@shared/transcript";

// Add a timeout of 1 minute for the vitest test
describe("Transformer", { timeout: 60 * 1000 }, () => {
  it("should refine transcript segments", async () => {
    const fakeSegments: TranscriptSegment[] = [
      { s_id: 1, start: 0, end: 5, text: "Hello world" },
      { s_id: 2, start: 6, end: 10, text: "This is a test" },
    ];

    const refinedSegments = await transformer.refine(fakeSegments);

    expect(refinedSegments).toBeDefined();
  });
});
