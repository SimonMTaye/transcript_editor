import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RecentTranscripts from '../src/components/RecentTranscripts';
import { APIContext } from '../src/App';
import { TranscriptMeta, TranscriptDB } from '../src/services/interfaces';
import { TRANSCRIPTS_SUMMARIES_LIMIT } from '../src/services/api';

// Adjusted mockTranscripts: 18 ready, 2 deleted
const mockTranscripts: TranscriptMeta[] = Array.from({ length: 20 }, (_, i) => ({
  id: `id-${i}`,
  title: `Transcript Title ${i}`,
  updated_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // Ensure different dates for sorting if any
  created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
  file_id: `file-id-${i}`,
  file_url: `https://example.com/file-${i}.mp3`,
  file_type: 'audio/mpeg',
  data_id: `data-id-${i}`,
  status: i < 18 ? "ready" : "deleted", // First 18 are ready, last 2 are deleted
  user_id: `user-id-${i}`,
  custom_id: `custom-id-${i}`,
  data_url: `https://example.com/data-${i}.json`,
  duration: (i + 1) * 10,
  thumbnail_url: `https://example.com/thumbnail-${i}.jpg`,
  language: 'en',
  has_segments: true,
  has_text: true,
  has_words: true,
  is_summary_available: i % 2 === 0,
  summary_id: `summary-id-${i}`,
  processed_at: new Date().toISOString(),
  summary_title: `Summary Title ${i}`,
  summary_text: `Summary text for transcript ${i}...`,
  tags: ['test', `tag-${i}`],
}));

const getReadyTranscripts = () => mockTranscripts.filter(t => t.status === "ready");

// Create mockApiContextValue
let mockApiContextValue = {
  getRecentTranscripts: async (page: number): Promise<TranscriptMeta[]> => {
    const readyTranscripts = getReadyTranscripts();
    const startIndex = (page - 1) * TRANSCRIPTS_SUMMARIES_LIMIT;
    const endIndex = startIndex + TRANSCRIPTS_SUMMARIES_LIMIT;
    return readyTranscripts.slice(startIndex, endIndex);
  },
  getTranscript: async (id: string) => mockTranscripts.find(t => t.id === id) || null,
  createTranscript: async (file: File, language?: string, title?: string, customId?: string) => ({ ...mockTranscripts[0], id: 'new-id', title: title || 'New Transcript' } as TranscriptMeta),
  deleteTranscript: async (id: string) => {
    const transcript = mockTranscripts.find(t => t.id === id);
    if (transcript) transcript.status = "deleted";
    return true;
  },
  updateTranscript: async (id: string, data: Partial<TranscriptDB>) => {
    const transcriptIndex = mockTranscripts.findIndex(t => t.id === id);
    if (transcriptIndex > -1) {
        mockTranscripts[transcriptIndex] = { ...mockTranscripts[transcriptIndex], ...data } as TranscriptMeta;
        return mockTranscripts[transcriptIndex];
    }
    return null;
  },
  getUploadUrl: async (fileName: string, fileType: string) => `https://example.com/upload/${fileName}`,
  getWaveform: async (dataId: string) => ({ peaks: [0.1, 0.2, 0.3] }),
  getTranscriptData: async (dataId: string) => ({ segments: [], words: [], text: '' }),
  getSummary: async (summaryId: string) => ({ id: summaryId, title: 'Mock Summary', text: 'This is a mock summary.'}),
  createSummary: async (transcriptId: string, instruction?: string) => ({ id: 'new-summary-id', title: 'New Summary', text: 'Generated summary based on instruction.' }),
  getSettings: async () => ({ model_id: "default_model" }),
  updateSettings: async (settings: any) => true,
};

// Helper to render with provider
const renderComponent = () => {
  return render(
    <APIContext.Provider value={mockApiContextValue as any}>
      <RecentTranscripts />
    </APIContext.Provider>
  );
};

describe('RecentTranscripts Component', () => {
  beforeEach(() => {
    // Reset mocks if they are stateful between tests, e.g., spies
    vi.restoreAllMocks();
    // Reset mockTranscripts status if changed by tests (e.g. deleteTranscript)
    mockTranscripts.forEach((t, i) => t.status = i < 18 ? "ready" : "deleted");
    // Re-initialize mockApiContextValue to ensure fresh spies for each test if needed
    mockApiContextValue = {
        ...mockApiContextValue, // keep other methods
        getRecentTranscripts: async (page: number): Promise<TranscriptMeta[]> => {
            const readyTranscripts = getReadyTranscripts();
            const startIndex = (page - 1) * TRANSCRIPTS_SUMMARIES_LIMIT;
            const endIndex = startIndex + TRANSCRIPTS_SUMMARIES_LIMIT;
            return readyTranscripts.slice(startIndex, endIndex);
        },
    };
  });

  it('Test 1: Only "ready" transcripts are displayed', async () => {
    renderComponent();
    const readyTranscripts = getReadyTranscripts();

    // Check for the first page of "ready" transcripts
    for (let i = 0; i < TRANSCRIPTS_SUMMARIES_LIMIT; i++) {
      expect(await screen.findByText(readyTranscripts[i].title)).toBeInTheDocument();
    }

    // Ensure "deleted" transcripts are not present
    const deletedTranscripts = mockTranscripts.filter(t => t.status === "deleted");
    for (const transcript of deletedTranscripts) {
      expect(screen.queryByText(transcript.title)).not.toBeInTheDocument();
    }

    // Verify the correct number of items on the first page
    const transcriptLinks = await screen.findAllByTestId(/transcript-link-id-/);
    expect(transcriptLinks.length).toBe(TRANSCRIPTS_SUMMARIES_LIMIT);
  });

  it('Test 2: Pagination visibility', async () => {
    renderComponent();
    // Wait for initial transcripts to load
    await screen.findByText(getReadyTranscripts()[0].title);

    const nextButton = screen.getByTestId('next-page-button');
    const prevButton = screen.getByTestId('prev-page-button');

    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toBeEnabled();
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).toBeDisabled();
  });

  it('Test 3: Pagination functionality (Next Page)', async () => {
    const getRecentTranscriptsSpy = vi.spyOn(mockApiContextValue, 'getRecentTranscripts');
    renderComponent();

    // Wait for initial page to load
    await screen.findByText(getReadyTranscripts()[0].title);

    const nextButton = screen.getByTestId('next-page-button');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(getRecentTranscriptsSpy).toHaveBeenCalledWith(2);
    });

    // Check for the second page of "ready" transcripts
    const readyTranscripts = getReadyTranscripts();
    for (let i = TRANSCRIPTS_SUMMARIES_LIMIT; i < readyTranscripts.length; i++) {
      expect(await screen.findByText(readyTranscripts[i].title)).toBeInTheDocument();
    }
    // Ensure first page items are gone
    expect(screen.queryByText(readyTranscripts[0].title)).not.toBeInTheDocument();


    const prevButton = screen.getByTestId('prev-page-button');
    expect(prevButton).toBeEnabled();

    // Next button should be disabled as there are only 18 ready items (15 on page 1, 3 on page 2)
    expect(nextButton).toBeDisabled();
  });

  it('Test 4: Pagination functionality (Previous Page)', async () => {
    const getRecentTranscriptsSpy = vi.spyOn(mockApiContextValue, 'getRecentTranscripts');
    renderComponent();

    // Wait for initial page
    await screen.findByText(getReadyTranscripts()[0].title);

    const nextButton = screen.getByTestId('next-page-button');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(getRecentTranscriptsSpy).toHaveBeenCalledWith(2);
      // Wait for page 2 content to render
      return screen.findByText(getReadyTranscripts()[TRANSCRIPTS_SUMMARIES_LIMIT].title);
    });

    const prevButton = screen.getByTestId('prev-page-button');
    fireEvent.click(prevButton);

    await waitFor(() => {
      // It's called 3 times: initial load (page 1), next (page 2), prev (page 1)
      expect(getRecentTranscriptsSpy).toHaveBeenCalledTimes(3);
      expect(getRecentTranscriptsSpy).toHaveBeenNthCalledWith(3, 1);
    });

    // Check for the first page of "ready" transcripts again
    for (let i = 0; i < TRANSCRIPTS_SUMMARIES_LIMIT; i++) {
      expect(await screen.findByText(getReadyTranscripts()[i].title)).toBeInTheDocument();
    }
    expect(prevButton).toBeDisabled();
  });

  it('Test 5: Transcript link navigation', async () => {
    renderComponent();
    const readyTranscriptsPage1 = getReadyTranscripts().slice(0, TRANSCRIPTS_SUMMARIES_LIMIT);

    for (const transcript of readyTranscriptsPage1) {
      const link = await screen.findByTestId(`transcript-link-${transcript.id}`);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', `/transcript/${transcript.id}`);
    }
  });
});
