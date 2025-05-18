import { TranscriptSegment } from "@shared/transcript";
import { Refiner, Transcriber } from "@src/services/interfaces";
import { REFINE_ENDPOINT, TRANSCRIBE_ENDPOINT } from "@shared/endpoints";

const BASE_URL = import.meta.env.VITE_CF_ENDPOINT;
console.log("Cloudflare SDK URL:", BASE_URL);

if (!BASE_URL) {
  throw new Error("VITE_CF_ENDPOINT environment variable is not set.");
}

export const cloudflareSDK: Refiner & Transcriber = {
  async refine(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
    const response = await fetch(`${BASE_URL}${REFINE_ENDPOINT}`, {
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
    const response = await fetch(`${BASE_URL}${TRANSCRIBE_ENDPOINT}`, {
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
};
