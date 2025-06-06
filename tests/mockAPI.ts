import { vi } from 'vitest';
import { TRANSCRIPTS_SUMMARIES_LIMIT, type transcriptApi } from '@src/services/api';
import { splitTranscriptIntoMetaAndData, type Transcript, type TranscriptMeta, type TranscriptSegment } from '@shared/transcript';

// Define a type for TranscriptMeta, which is Transcript without segments

const dummyDate = new Date().toISOString();

const dummyTranscriptSegment: TranscriptSegment = {
  start: 0,
  end: 0,
  text: 'This is a dummy transcript segment.',
  speaker: 'SPEAKER_00',
};

const baseDummyTranscript: Transcript = {
    id: 'default-dummy-id',
    title: 'Default Dummy Transcript',
    segments: [dummyTranscriptSegment],
    created_at: dummyDate,
    updated_at: dummyDate,
    file_url: 'https://example.com/dummy_audio.mp3',
    file_id: 'dummy-file-id',
    file_type: 'audio',
    data_id: 'default-data-id',
    previous_did: '',
    status: 'deleted'
};

// Creates a mockAPI based on provided in-memory transcripts
// Uses vite mocking funcitons for spying
export const mockApiFactory = (transcripts: Transcript[] = []) => ({
  getRecentTranscripts: vi.fn(async (page: number = 1) => {
    const metas = transcripts.map<TranscriptMeta>((t) => splitTranscriptIntoMetaAndData(t).meta);
    return metas.filter((t) => t.status === 'ready').slice((page - 1) * TRANSCRIPTS_SUMMARIES_LIMIT, page * TRANSCRIPTS_SUMMARIES_LIMIT);
  }),

  getTranscript: vi.fn(async (id: string) => {
    const transcript = transcripts.find(t => t.id === id);
    if (!transcript) {
      throw new Error(`Transcript with ID ${id} not found`);
    }
    return transcript;
  }),

  uploadAudio: vi.fn(async (title: string, file: File) => {
    const newTranscript: Transcript = {
      ...baseDummyTranscript,
      id: `uploaded-${transcripts.length + 1}`,
      title,
      file_url: `https://example.com/uploaded/${file.name}`,
      status: 'ready',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    transcripts.push(newTranscript);
    return newTranscript;
  }),

  refineTranscript: vi.fn(async (id: string) => {
    const transcript = transcripts.find(t => t.id === id);
    if (!transcript) {
      throw new Error(`Transcript with ID ${id} not found`);
    }
    transcript.segments = transcript.segments.map(s => ({
      ...s,
      text: `Refined: ${s.text}`
    }));
    transcript.updated_at = new Date().toISOString();
    return transcript;
  }),

  saveTranscriptEdits: vi.fn(async (id: string, segments: TranscriptSegment[]) => {
    const transcript = transcripts.find(t => t.id === id);
    if (!transcript) {
      throw new Error(`Transcript with ID ${id} not found`);
    }
    transcript.segments = segments;
    transcript.updated_at = new Date().toISOString();
    return transcript;
  }),

  exportToWord: vi.fn(async (transcript: Transcript) => {
    const content = transcript.segments.map(s => s.text).join('\n');
    return new Blob([content], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  }),
});

// Create 20 dummy transcripts for testing, the first 4 should be "deleted" and the rest "ready"
export const createDummyTranscripts = (count: number = 20): Transcript[] => {
  const transcripts: Transcript[] = [];
  for (let i = 0; i < count; i++) {
    const isDeleted = i < 4; // First 4 transcripts are "deleted"
    const status = isDeleted ? 'deleted' : 'ready';
    const dummyTranscript: Transcript = {
      ...baseDummyTranscript,
      id: `dummy-${i + 1}`,
      title: `Dummy Transcript ${i + 1}`,
      segments: [dummyTranscriptSegment],
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    transcripts.push(dummyTranscript);
  }
  return transcripts;
}

export const mockTranscriptApi: typeof transcriptApi = mockApiFactory(createDummyTranscripts());