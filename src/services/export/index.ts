import { TranscriptMeta, TranscriptData } from "../../models/transcript";

export interface Exporter {
  exportTranscript(meta: TranscriptMeta, data: TranscriptData): Promise<Blob>;
}
