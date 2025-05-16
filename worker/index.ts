// filepath: /Users/st2246/Personal/transcript_editor/worker/index.ts
import { refineFactory } from "@worker/gemini_transform";
import { TranscriptSegment } from "@shared/transcript";
import { whisperFactory } from "@worker/whisper_transcriber";
import { REFINE_ENDPOINT, TRANSCRIBE_ENDPOINT } from "@shared/endpoints";

export default {
  async fetch(request: Request, env: any, _ctx: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === REFINE_ENDPOINT) {
      if (request.method === "POST") {
        if (!env.GOOGLE_API_KEY) {
          return new Response("API key not found", { status: 500 });
        }
        const apiKey = env.GOOGLE_API_KEY;
        const model = env.GOOGLE_MODEL || "gemini-2.5-flash-preview-04-17";
        const refine = await refineFactory(apiKey, model);
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
          const apiKey = env.OPENAI_API_KEY;
          if (!apiKey) {
            return new Response("API key not found", { status: 500 });
          }
          const whisperTranscriber = whisperFactory(apiKey);
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
