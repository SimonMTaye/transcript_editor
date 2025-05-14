import { TranscriptSegment } from "@shared/transcript";
import { whisperTranscriber } from "@src/services/transcribe/whisper_transcriber"; // Import the actual implementation

export interface Transcriber {
  transcribeAudio(file: File): Promise<TranscriptSegment[]>;
}

// Export the actual Whisper transcriber instance
export { whisperTranscriber as transcriber };
