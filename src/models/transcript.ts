
/**
 * Represents single segment of a transcript.
 * 
 * @interface TranscriptSegment
 * @property {string} s_id - Unique identifier for the transcript (s_id to avoid conflicts).
 * @property {number} start - Start time of the segment in seconds.
 * @property {number} end - End time of the segment in seconds.
 * @property {string} text - Text content of the segment.
 * @property {string} speaker - Speaker identifier (optional).
 */

export interface TranscriptSegment  {
  s_id: number;
  speaker?: string;
  start: number;
  end: number;
  text: string;
}

/**
 * Represents a transcript object for use with the transcript editor
 * 
 * @interface Transcript
 * @property {string} id - Unique identifier for the transcript.
 * @property {string} title - Title of the transcript.
 * @property {string} data_id - Identifier for this transcript data.
 * @property {string} previous_did - Identifier for previous transcript data.
 * @property {string} file_id - Path to the audio file or null if no audio available.
 * @property {TranscriptSegment[]} segments - Array of transcript segments.
 * @property {string} updated_at - ISO timestamp of when the transcript was last updated.
 * @property {string} created_at - ISO timestamp of when the transcript was created.
 */
export interface Transcript {
  id: string;
  title: string;
  data_id: string;
  previous_did: string;
  file_id: string;
  file_url: string;
  created_at: string;
  updated_at: string;
  segments: TranscriptSegment[];
}


/**
 * Represents a transcript metadata for use with the sidebar
 * 
 * @interface TranscriptMeta
 * @property {string} id - Unique identifier for the transcript.
 * @property {string} title - Title of the transcript.
 * @property {string} updated_at - ISO timestamp of when the transcript was last updated.
 * @property {string} created_at - ISO timestamp of when the transcript was created.
 * @property {string} file_id - Path to the audio file or null if no audio available.
 * @property {data_type} file_type - Type of the transcript file.
 * @property {string} data_id - Identifier for this transcript data.
 */

export interface TranscriptMeta {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  file_id: string;
  file_url: string;
  file_type: file_type;
  data_id: string;
}

export type file_type = "audio" | "none"
export const NO_FILE = "no_file"

