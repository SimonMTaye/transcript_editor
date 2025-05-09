import {
  Transcript,
  TranscriptMeta,
  TranscriptSegment,
  file_type,
} from "../../models/transcript";

/**
 * Interface representing a database for managing transcripts.
 */
export interface TranscriptDB {
  /**
   * Retrieves a transcript by its unique identifier.
   * @param id - The unique identifier of the transcript to retrieve.
   * @returns A promise that resolves to the requested Transcript.
   */
  getTranscript: (id: string) => Promise<Transcript>;

  /**
   * Retrieves a paginated list of recent transcript summaries.
   * @param limit - The maximum number of transcript summaries to return.
   * @param offset - The number of transcript summaries to skip for pagination.
   * @returns A promise that resolves to an array of TranscriptSummary objects.
   */
  getRecentTranscriptMeta: (
    limit: number,
    offset: number
  ) => Promise<TranscriptMeta[]>;

  /**
   * Creates a new transcript record in the database and associates it with the meta id.
   * @param transcript - The Transcript object to be stored.
   * @returns A promise that resolves to the created Transcript with any server-generated fields.
   */
  createTranscriptData: (
    meta_id: string,
    segments: TranscriptSegment[]
  ) => Promise<Transcript>;

  /**
   * Creates a new transcript meta record in the database.
   * @param title - The title of the transcript.
   * @param file_id - The file identifier associated with the transcript.
   * @param file_url - The URL of the file associated with the transcript.
   * @param file_type - The type of the transcript file.
   * @returns A promise that resolves to the created TranscriptSummary with any server-generated fields.
   */
  createTranscriptMeta: (
    title: string,
    file_id: string,
    file_url: string,
    file_type: file_type
  ) => Promise<TranscriptMeta>;

  /**
   * Deletes a transcript meta entry and all its associated data by its unique identifier.
   * @param meta_id - The unique identifier of the transcript meta to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  wipeTranscript: (meta_id: string) => Promise<void>;
}
