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

export interface TranscriptSegment {
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
  file_type: file_type;
  created_at: string;
  updated_at: string;
  segments: TranscriptSegment[];
  status: "deleted" | "ready";
}

export type TranscriptData = {
  id: string;
  previous_did: string;
  meta_id: string;
  created_at: string;
  updated_at: string;
  segments: TranscriptSegment[];
};

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
  status: "deleted" | "ready";
}

/**
 * Joins transcript metadata and data into a single object.
 *
 * @param data - The transcript data to join.
 * @param meta - The transcript metadata to join.
 * @returns An object containing combined transcript data and metadata.
 */
export function joinMetaAndData(
  meta: TranscriptMeta,
  data: TranscriptData
): Transcript {
  return {
    id: meta.id,
    title: meta.title,
    data_id: data.id,
    previous_did: data.previous_did,
    file_id: meta.file_id,
    file_url: meta.file_url,
    file_type: meta.file_type,
    created_at: data.updated_at,
    updated_at: meta.created_at,
    segments: data.segments,
    status: meta.status,
  };
}

/**
 *
 * @param transcript - The transcript object to split.
 * @returns
 */
export function splitTranscriptIntoMetaAndData(transcript: Transcript): {
  meta: TranscriptMeta;
  data: TranscriptData;
} {
  return {
    meta: {
      id: transcript.id,
      title: transcript.title,
      created_at: transcript.created_at,
      updated_at: transcript.updated_at,
      file_id: transcript.file_id,
      file_url: transcript.file_url,
      file_type: transcript.file_type,
      data_id: transcript.data_id,
      status: transcript.status,
    },
    data: {
      id: transcript.data_id,
      previous_did: transcript.previous_did,
      meta_id: transcript.id,
      created_at: transcript.created_at,
      updated_at: transcript.updated_at,
      segments: transcript.segments,
    },
  };
}

export type file_type = "audio" | "none";
export const NO_FILE = "no_file";
