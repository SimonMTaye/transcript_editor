import { TranscriptSegment } from "@shared/transcript";
import { Refiner, Transcriber } from "@src/services/interfaces";
import {
  REFINE_ENDPOINT,
  DEEPGRAM_TRANSCRIBE_ENDPOINT,
} from "@shared/endpoints";

function getSDKUrl(): string {
  const url = import.meta.env.VITE_CF_ENDPOINT;
  if (!url) {
    console.error("VITE_CF_ENDPOINT environment variable is not set.");
  }
  console.log("SDK URL:", url);
  return url;
}



export const sdkFactory = (base_url: string  = getSDKUrl()) => { 
  return {
    async refine(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
      const response = await fetch(`${base_url}${REFINE_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(segments),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error refining transcript:", errorText);
        throw new Error(
          `Error refining transcript: ${response.status} ${errorText}`
        );
      }
      return response.json();
    },

    async transcribeAudio(file: File): Promise<TranscriptSegment[]> {
      const response = await fetch(`${base_url}${DEEPGRAM_TRANSCRIBE_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error transcribing audio:", errorText);
        throw new Error(
          `Error transcribing audio: ${response.status} ${errorText}`
        );
      }
      return response.json();
    },
  }
};

export const sdk: Refiner & Transcriber = sdkFactory();
