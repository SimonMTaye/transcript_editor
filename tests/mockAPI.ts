import type { transcriptApi } from '@src/services/api';
import type { Transcript, TranscriptMeta, TranscriptSegment } from '@shared/transcript';

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

export const mockTranscriptApi: typeof transcriptApi = {
  getRecentTranscripts: async (page: number = 1) => {
    const mockMetaItems: TranscriptMeta[] = [
      {
          id: `meta-id-${page}-1`,
          title: `Recent Transcript ${page}-1`,
          created_at: dummyDate,
          updated_at: dummyDate,
          file_url: `https://example.com/recent_audio_${page}_1.mp3`,
          file_id: `recent-file-id-${page}-1`,
          file_type: 'audio',
          data_id: '',
          status: 'deleted'
      },
      {
          id: `meta-id-${page}-2`,
          title: `Recent Transcript ${page}-2`,
          created_at: dummyDate,
          updated_at: dummyDate,
          file_url: `https://example.com/recent_audio_${page}_2.mp3`,
          file_id: `recent-file-id-${page}-2`,
          file_type: 'audio',
          data_id: '',
          status: 'deleted'
      },
    ];
    return Promise.resolve(mockMetaItems);
  },

  getTranscript: async (id: string) => {
    return Promise.resolve({
      ...baseDummyTranscript,
      id,
      title: `Dummy Transcript ${id}`,
    });
  },

  uploadAudio: async (title: string, file: File) => {
    // In a real scenario, database.createTranscriptData would return the new transcript data.
    // We'll return a full Transcript object for simplicity.
    return Promise.resolve({
      ...baseDummyTranscript,
      id: 'uploaded-transcript-id', // This would typically be the ID of the transcript meta
      title,
      segments: [
        { ...dummyTranscriptSegment, text: `Content from uploaded file: ${file.name}` },
      ],
      file_url: `https://example.com/uploaded/${file.name}`, // Mock URL
    });
  },

  refineTranscript: async (id: string) => {
    // Assuming refine also returns a full Transcript object representing the refined version.
    return Promise.resolve({
      ...baseDummyTranscript,
      id,
      title: `Refined Transcript ${id}`,
      segments: [
        { ...dummyTranscriptSegment, text: 'This is a refined dummy segment.' },
      ],
    });
  },

  saveTranscriptEdits: async (id: string, segments: TranscriptSegment[]) => {
    // Assuming save also returns a full Transcript object representing the saved version.
    return Promise.resolve({
      ...baseDummyTranscript,
      id,
      title: `Edited Transcript ${id}`,
      segments, // Use the provided segments
    });
  },

  exportToWord: async (transcript: Transcript) => {
    const dummyContent = `Word document for ${transcript.title}\n\n${transcript.segments.map(s => s.text).join('\n')}`;
    return Promise.resolve(new Blob([dummyContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
  },
};