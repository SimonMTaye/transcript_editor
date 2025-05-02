import { TranscriptSegment } from "../../models/transcript";
import { whisperTranscriber } from "./whisper_transcriber"; // Import the actual implementation

export interface Transcriber {
    transcribeAudio(file: File): Promise<TranscriptSegment[]>;
}

// Remove or comment out the dummy transcriber
// const dummyTranscriber: Transcriber = {
//     transcribeAudio: async (file: File) => {
//         // Simulate a transcription process
//         return new Promise((resolve) => {
//             setTimeout(() => {
//                 resolve([
//                     { s_id: 1, start: 0, end: 5, text: "Hello world" },
//                     { s_id: 2, start: 6, end: 10, text: "This is a test" },
//                 ]);
//             }, 1000);
//         });
//     }
// };

// Export the actual Whisper transcriber instance
export { whisperTranscriber as transcriber };