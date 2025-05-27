// filepath: /Users/st2246/Personal/transcript_editor/worker/index.ts
import { defaultModel, refineFactory } from "@worker/gemini_transform";
import { TranscriptSegment } from "@shared/transcript";
import { whisperFactory } from "@worker/whisper_transcriber";
import { deepgramFactory } from "@worker/deepgram_transcriber";
import {
  REFINE_ENDPOINT,
  TRANSCRIBE_ENDPOINT,
  DEEPGRAM_TRANSCRIBE_ENDPOINT,
} from "@shared/endpoints";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request: Request, env: any, _ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === REFINE_ENDPOINT) {
      if (request.method === "POST") {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response("API key not found", {
            status: 500,
            headers: corsHeaders,
          });
        }

        const model = defaultModel;
        const refine = await refineFactory(apiKey, model);
        try {
          const segments = (await request.json()) as TranscriptSegment[];
          const refinedSegments = await refine(segments);
          return new Response(JSON.stringify(refinedSegments), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error processing request:", error);
          return new Response("Error processing request", {
            status: 500,
            headers: corsHeaders,
          });
        }
      } else {
        return new Response("Method not allowed", {
          status: 405,
          headers: corsHeaders,
        });
      }
    }
    if (url.pathname === DEEPGRAM_TRANSCRIBE_ENDPOINT) {
      if (request.method === "POST") {
        const apiKey = env.DEEPGRAM_API_KEY;
        if (!apiKey) {
          return new Response("API key not found", {
            status: 500,
            headers: corsHeaders,
          });
        }
        const deepgramTranscriber = deepgramFactory(apiKey);
        const contentType =
          request.headers.get("Content-Type") || "application/octet-stream";
        const blob = await request.blob();

        if (blob.size === 0) {
          return new Response("File not provided or empty", {
            status: 400,
            headers: corsHeaders,
          });
        }
        const file = new File([blob], "uploaded_audio", {
          type: contentType,
        });

        const segments = await deepgramTranscriber.transcribeAudio(file);
        return new Response(JSON.stringify(segments), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response("Method not allowed", {
          status: 405,
          headers: corsHeaders,
        });
      }
    }
    if (url.pathname === TRANSCRIBE_ENDPOINT) {
      if (request.method === "POST") {
        try {
          const apiKey = env.OPENAI_API_KEY;
          if (!apiKey) {
            return new Response("API key not found", {
              status: 500,
              headers: corsHeaders,
            });
          }
          const whisperTranscriber = whisperFactory(apiKey);
          const contentType =
            request.headers.get("Content-Type") || "application/octet-stream";
          const blob = await request.blob();

          if (blob.size === 0) {
            return new Response("File not provided or empty", {
              status: 400,
              headers: corsHeaders,
            });
          }
          const file = new File([blob], "uploaded_audio", {
            type: contentType,
          });

          const segments = await whisperTranscriber.transcribeAudio(file);
          return new Response(JSON.stringify(segments), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error processing request:", error);
          return new Response("Error processing request", {
            status: 500,
            headers: corsHeaders,
          });
        }
      } else {
        return new Response("Method not allowed", {
          status: 405,
          headers: corsHeaders,
        });
      }
    }
    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
