import { TranscriptSegment } from "../models/transcript";
import { FileStore } from "./store/file_store";
import { pbDatabase, pbFileStore } from "./store/pocketbase";
import { TranscriptDB } from "./store/transcript_db";
import { Transcriber } from "./transcribe/transcribe";
import { whisperTranscriber } from "./transcribe/whisper_transcriber";
import { transformer, Transformer } from "./transform";

const apiFactory = (
  file_store: FileStore,
  database: TranscriptDB,
  transcriber: Transcriber,
  transformer: Transformer
) => {
  return {
    getRecentTranscripts: async () => {
      const transcripts = await database.getRecentTranscriptMeta(10, 0);
      return transcripts;
    },
    getTranscript: async (id: string) => {
      const transcript = await database.getTranscript(id);
      return transcript;
    },
    uploadAudio: async (title: string, file: File) => {
      const { file_id, file_url } = await file_store.uploadFile(file, "audio");
      console.log("File uploaded successfully:", file_id, file_url);
      const transcriptMeta = await database.createTranscriptMeta(
        title,
        file_id,
        file_url,
        "audio"
      );
      const audioTranscript = await transcriber.transcribeAudio(file);
      return await database.createTranscriptData(
        transcriptMeta.id,
        audioTranscript
      );
    },
    refineTranscript: async (id: string) => {
      const transcript = await database.getTranscript(id);
      const refinedSegments = await transformer.refine(transcript.segments);
      // Create a new transcript data entry in the database
      const refinedTranscript = await database.createTranscriptData(
        transcript.id,
        refinedSegments
      );
      return refinedTranscript;
    },
    saveTranscriptEdits(id: string, segments: TranscriptSegment[]) {
      return database.createTranscriptData(id, segments);
    },
    exportToWord: async (id: string) => {
      throw new Error(`Not implemented for ${id}`);
    },
  };
};

export const transcriptApi = apiFactory(
  pbFileStore,
  pbDatabase,
  whisperTranscriber,
  transformer
);
