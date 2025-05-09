import { TranscriptSegment } from "../../models/transcript";
import { whisperTranscriber } from "./whisper_transcriber"; // Import the actual implementation

export interface Transcriber {
  transcribeAudio(file: File): Promise<TranscriptSegment[]>;
}

// Export the actual Whisper transcriber instance
export { whisperTranscriber as transcriber };
