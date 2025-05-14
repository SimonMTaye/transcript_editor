import { TranscriptMeta, TranscriptData } from "@shared/transcript";

export interface Exporter {
  exportTranscript(meta: TranscriptMeta, data: TranscriptData): Promise<Blob>;
}
