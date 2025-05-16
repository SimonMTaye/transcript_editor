// filepath: /Users/st2246/Personal/transcript_editor/worker/index.ts
import { refine } from "@worker/gemini_transform";
import { TranscriptSegment } from "@shared/transcript";
import { whisperTranscriber } from "@worker/whisper_transcriber";
import { REFINE_ENDPOINT, TRANSCRIBE_ENDPOINT } from "@shared/endpoints";

export default {
  async fetch(request: Request, _env: any, _ctx: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === REFINE_ENDPOINT) {
      if (request.method === "POST") {
        try {
          const segments = (await request.json()) as TranscriptSegment[];
          const refinedSegments = await refine(segments);
          return new Response(JSON.stringify(refinedSegments), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error processing request:", error);
          return new Response("Error processing request", { status: 500 });
        }
      } else {
        return new Response("Method not allowed", { status: 405 });
      }
    }
    if (url.pathname === TRANSCRIBE_ENDPOINT) {
      if (request.method === "POST") {
        try {
          const contentType =
            request.headers.get("Content-Type") || "application/octet-stream";
          const blob = await request.blob();

          if (blob.size === 0) {
            return new Response("File not provided or empty", { status: 400 });
          }
          const file = new File([blob], "uploaded_audio", {
            type: contentType,
          });

          const segments = await whisperTranscriber.transcribeAudio(file);
          return new Response(JSON.stringify(segments), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error processing request:", error);
          return new Response("Error processing request", { status: 500 });
        }
      } else {
        return new Response("Method not allowed", { status: 405 });
      }
    }
    return new Response("Not found", { status: 404 });
  },
};
