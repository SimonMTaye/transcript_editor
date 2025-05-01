import { Transcript, TranscriptMeta } from "../models/transcript";
import { FileStore } from "./store/file_store";
import { pbDatabase, pbFileStore } from "./store/pocketbase";
import { TranscriptDB } from "./store/transcript_db";

export type Action = "refine" 

export interface TranscriptApi {
  // Get recent transcripts
  getRecentTranscripts(): Promise<TranscriptMeta[]>;

  // Get a specific transcript
  getTranscript(id: string): Promise<Transcript>;

  // Upload a new audio file
  uploadAudio(title: string, file: File): Promise<Transcript>;

  // Refine transcript with LLM
  llmAction(id: string, action: Action): Promise<Transcript>;

  // Export transcript to Word
  exportToWord(id: string): Promise<Blob>;
} 

const apiFactory = (file_store: FileStore, database: TranscriptDB): TranscriptApi => {
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
      const { file_id, file_url} = await file_store.uploadFile(file, "audio");
      console.log("File uploaded successfully:", file_id, file_url);
      const transcriptMeta = await database.createTranscriptMeta(
        title,
        file_id,
        file_url,
        "audio"
      );
      return await database.createTranscriptData(
        transcriptMeta.id,
        []
      );
    },
    llmAction: async (id: string, action: Action) => {
      // TODO: Implement using LLM call
      return await database.getTranscript(id);
    },
    exportToWord: async (id: string) => {
      throw new Error("Not implemented");
    },
  };
}

export const transcriptApi = apiFactory(pbFileStore, pbDatabase);