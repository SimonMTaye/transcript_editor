import {
  splitTranscriptIntoMetaAndData,
  TranscriptSegment,
  Transcript,
} from "@shared/transcript";
import { Exporter } from "@src/services/interfaces";
import { wordExport } from "@src/services/word_exporter";
import { FileStore } from "@src/services/interfaces";
import { pbDatabase, pbFileStore } from "@src/services/pocketbase";
import { TranscriptDB } from "@src/services/interfaces";
import { Transcriber } from "@src/services/interfaces";
// import { whisperTranscriber } from "@src/services/transcribe/whisper_transcriber";
import { Refiner } from "@src/services/interfaces";
import { cloudflareSDK } from "./cloudflare_sdk";

export const TRANSCRIPTS_SUMMARIES_LIMIT = 15;
const apiFactory = (
  file_store: FileStore,
  database: TranscriptDB,
  transcriber: Transcriber,
  refiner: Refiner,
  exporter: Exporter
) => {
  return {
    getRecentTranscripts: async (page: number = 1) => {
      const transcripts = await database.getRecentTranscriptMeta(
        TRANSCRIPTS_SUMMARIES_LIMIT,
        page
      );
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
      const refinedSegments = await refiner.refine(transcript.segments);
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
    exportToWord: async (transcript: Transcript) => {
      const { meta, data } = splitTranscriptIntoMetaAndData(transcript);
      const wordDocument = await exporter.exportTranscript(meta, data);
      return wordDocument;
    },
  };
};

export const transcriptApi = apiFactory(
  pbFileStore,
  pbDatabase,
  cloudflareSDK,
  cloudflareSDK,
  wordExport
);
