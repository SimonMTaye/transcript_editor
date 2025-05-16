import OpenAI from "openai";
import { TranscriptSegment } from "@shared/transcript";

export const whisperFactory = (apiKey: string) => {
  const openai = new OpenAI({
    apiKey: apiKey,
  });
  return {
    async transcribeAudio(file: File): Promise<TranscriptSegment[]> {
      try {
        console.log("Starting transcription for file:", file.name);
        const response = await openai.audio.transcriptions.create({
          model: "whisper-1",
          file: file,
          response_format: "verbose_json", // Request segments
          timestamp_granularities: ["segment"], // Request segment-level timestamps
        });
        console.log("Transcription response received:", response);

        // Check if segments exist in the response
        if (!response.segments) {
          console.error("No segments found in the Whisper response.");
          // Return empty array or throw an error based on desired behavior
          return [];
        }

        // Map the response segments to the TranscriptSegment format
        const segments: TranscriptSegment[] = response.segments.map(
          (seg, index) => ({
            s_id: seg.id !== undefined ? seg.id : index + 1, // Use API ID or generate one
            start: seg.start,
            end: seg.end,
            text: seg.text.trim(),
          })
        );

        console.log("Mapped segments:", segments);
        return segments;
      } catch (error) {
        console.error("Error transcribing audio with OpenAI Whisper:", error);
        throw new Error(
          `Whisper transcription failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
  };
};
