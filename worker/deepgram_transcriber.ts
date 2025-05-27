// Imports
import { TranscriptSegment } from "@shared/transcript";
import {
  createClient,
  DeepgramClient,
  DeepgramResponse,
  SyncPrerecordedResponse,
} from "@deepgram/sdk";
import { Buffer } from "buffer";

// Define the factory function for creating a Deepgram transcriber
export const deepgramFactory = (apiKey: string) => {
  // Initialize the Deepgram client
  const client: DeepgramClient = createClient(apiKey);

  // Return an object with the transcribeAudio method
  return {
    /**
     * Transcribes an audio file using the Deepgram API.
     * @param audioFile The audio file to transcribe.
     * @returns A promise that resolves to an array of TranscriptSegment objects.
     * @throws An error if transcription fails.
     */
    transcribeAudio: async (audioFile: File): Promise<TranscriptSegment[]> => {
      try {
        // Convert the File object to a Buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Call the Deepgram API to transcribe the audio
        const response: DeepgramResponse<SyncPrerecordedResponse> =
          await client.listen.prerecorded.transcribeFile(buffer, {
            model: "nova-2",
            smart_format: true,
            diarize: true,
            utterances: true,
          });

        // Process the Deepgram API response
        // The response structure for diarized results with utterances is nested.
        // We need to iterate through response.results.utterances.
        const segments: TranscriptSegment[] =
          response.result?.results.utterances?.map((utterance) => {
            return {
              start: utterance.start, // in seconds
              end: utterance.end, // in seconds
              text: utterance.transcript,
              speaker: `Speaker ${utterance.speaker}`, // e.g., "Speaker 0", "Speaker 1"
            };
          }) || [];

        return segments;
      } catch (error) {
        console.error("Error transcribing audio with Deepgram:", error);
        // Throw a descriptive error
        if (error instanceof Error) {
          throw new Error(`Deepgram transcription failed: ${error.message}`);
        }
        throw new Error("Deepgram transcription failed with an unknown error.");
      }
    },
  };
};
