import {
  splitTranscriptIntoMetaAndData,
  TranscriptSegment,
  Transcript,
} from "@shared/transcript";
import { Exporter } from "@src/services/export";
import { wordExport } from "@src/services/export/word_exporter";
import { FileStore } from "@src/services/store/file_store";
import { pbDatabase, pbFileStore } from "@src/services/store/pocketbase";
import { TranscriptDB } from "@src/services/store/transcript_db";
import { Transcriber } from "@src/services/transcribe/transcribe";
import { whisperTranscriber } from "@src/services/transcribe/whisper_transcriber";
import { transformer, Transformer } from "@src/services/transform";

export const TRANSCRIPTS_SUMMARIES_LIMIT = 15;
const apiFactory = (
  file_store: FileStore,
  database: TranscriptDB,
  transcriber: Transcriber,
  transformer: Transformer,
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
  whisperTranscriber,
  transformer,
  wordExport
);
