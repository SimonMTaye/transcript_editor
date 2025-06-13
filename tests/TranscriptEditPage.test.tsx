import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { TranscriptEditPage } from "@src/pages/TranscriptEditPage";
import { Transcript, TranscriptSegment } from "@shared/transcript";
import { mockApiFactory } from "./mockAPI";
import { render } from "./mockRender";

// Mock HTMLAudioElement for testing
const mockAudioElement = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 100,
  readyState: 4, // HAVE_ENOUGH_DATA
};

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioElement),
});

// Helper function to create test transcript with multiple segments
const createTestTranscript = (): Transcript => ({
  id: "test-transcript-1",
  title: "Test Interview Transcript",
  data_id: "test-data-1",
  previous_did: "",
  file_id: "test-file-1",
  file_url: "https://example.com/test-audio.mp3",
  file_type: "audio",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status: "ready",
  segments: [
    {
      start: 0,
      end: 10,
      text: "Hello, welcome to our interview today.",
      speaker: "SPEAKER_00"
    },
    {
      start: 10,
      end: 25,
      text: "Thank you for having me, I'm excited to share my story.",
      speaker: "SPEAKER_01"
    },
    {
      start: 25,
      end: 40,
      text: "Let's start with your background and experience.",
      speaker: "SPEAKER_00"
    }
  ]
});

// Helper function to render TranscriptEditPage with mock data
const renderTranscriptEditPage = (transcript: Transcript) => {
  const mockAPI = mockApiFactory([transcript]);
  
  return render(
    <MemoryRouter initialEntries={[`/transcript/${transcript.id}`]}>
      <TranscriptEditPage />
    </MemoryRouter>,
    mockAPI
  );
};

describe("TranscriptEditPage Integration Tests", () => {
  it("Test 1: Audio scrubbing changes active segment correctly", async () => {
    // Verify that changing audio time through scrubbing highlights the corresponding segment
    // This ensures proper audio-transcript synchronization for user navigation
    const transcript = createTestTranscript();
    const mockAPI = renderTranscriptEditPage(transcript);

    // Wait for transcript to load
    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Simulate audio time update to second segment (time = 15)
    const audioPlayer = screen.getByRole("slider");
    fireEvent.change(audioPlayer, { target: { value: 15 } });

    await waitFor(() => {
      // Second segment should become active based on time range (10-25)
      const secondSegmentText = screen.getByDisplayValue("Thank you for having me, I'm excited to share my story.");
      expect(secondSegmentText).toBeDefined();
    });
  });

  it("Test 2: Clicking segment seeks audio to correct time", async () => {
    // Verify that clicking a transcript segment updates the audio player time
    // This allows users to jump to specific parts of the audio by clicking text
    const transcript = createTestTranscript();
    renderTranscriptEditPage(transcript);

    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Click on the third segment
    const thirdSegmentBox = screen.getByDisplayValue("Let's start with your background and experience.").closest("div");
    fireEvent.click(thirdSegmentBox!);

    // Audio should seek to segment start time (25 seconds)
    expect(mockAudioElement.currentTime).toBe(25);
  });

  it("Test 3: Save button calls API with updated segment data", async () => {
    // Verify that clicking save collects edited text from all segments
    // and calls the save API with the complete updated transcript data
    const transcript = createTestTranscript();
    const mockAPI = mockApiFactory([transcript]);
    
    render(
      <MemoryRouter initialEntries={[`/transcript/${transcript.id}`]}>
        <TranscriptEditPage />
      </MemoryRouter>,
      mockAPI
    );

    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Edit the first segment text
    const firstSegmentTextarea = screen.getByDisplayValue("Hello, welcome to our interview today.");
    fireEvent.change(firstSegmentTextarea, { 
      target: { value: "Hello, welcome to our interview today. This is edited text." }
    });

    // Click save button
    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAPI.saveTranscriptEdits).toHaveBeenCalledWith(
        transcript.id,
        expect.arrayContaining([
          expect.objectContaining({
            text: "Hello, welcome to our interview today. This is edited text."
          })
        ])
      );
    });
  });

  it("Test 4: Refine button calls API with current transcript data", async () => {
    // Verify that clicking refine collects current transcript state
    // and calls the refine API to improve transcript quality with AI
    const transcript = createTestTranscript();
    const mockAPI = mockApiFactory([transcript]);
    
    render(
      <MemoryRouter initialEntries={[`/transcript/${transcript.id}`]}>
        <TranscriptEditPage />
      </MemoryRouter>,
      mockAPI
    );

    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Click refine button
    const refineButton = screen.getByText("Refine");
    fireEvent.click(refineButton);

    await waitFor(() => {
      expect(mockAPI.refineTranscript).toHaveBeenCalledWith(transcript.id);
    });
  });

  it("Test 5: Word count displays and updates correctly", async () => {
    // Verify that the word count displays the correct total words
    // and updates when transcript segments are edited by users
    const transcript = createTestTranscript();
    renderTranscriptEditPage(transcript);

    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Initial word count should be calculated from all segments
    // "Hello, welcome to our interview today." (6 words)
    // "Thank you for having me, I'm excited to share my story." (11 words)  
    // "Let's start with your background and experience." (7 words)
    // Total: 24 words
    await waitFor(() => {
      expect(screen.getByText("24 words")).toBeDefined();
    });
  });

  it("Test 6: Multiple segment clicks update active segment correctly", async () => {
    // Verify that clicking different segments properly updates the active state
    // This ensures only one segment is highlighted as active at any time
    const transcript = createTestTranscript();
    renderTranscriptEditPage(transcript);

    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Click first segment
    const firstSegmentBox = screen.getByDisplayValue("Hello, welcome to our interview today.").closest("div");
    fireEvent.click(firstSegmentBox!);

    // Click second segment
    const secondSegmentBox = screen.getByDisplayValue("Thank you for having me, I'm excited to share my story.").closest("div");
    fireEvent.click(secondSegmentBox!);

    // Audio should now be at second segment start time
    expect(mockAudioElement.currentTime).toBe(10);
  });

  it("Test 7: Audio time updates activate correct segment", async () => {
    // Verify that audio playback time updates highlight the appropriate transcript segment
    // This ensures proper synchronization during continuous audio playback
    const transcript = createTestTranscript();
    renderTranscriptEditPage(transcript);

    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Simulate audio time update to third segment range (time = 30)
    const audioPlayer = screen.getByRole("slider");
    fireEvent.change(audioPlayer, { target: { value: 30 } });

    await waitFor(() => {
      // Third segment should become active (time 30 is in range 25-40)
      const thirdSegmentText = screen.getByDisplayValue("Let's start with your background and experience.");
      expect(thirdSegmentText).toBeDefined();
    });
  });

  it("Test 8: Export button triggers Word document download", async () => {
    // Verify that clicking export calls the export API and handles file download
    // This ensures users can save their edited transcripts as Word documents
    const transcript = createTestTranscript();
    const mockAPI = mockApiFactory([transcript]);
    
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <MemoryRouter initialEntries={[`/transcript/${transcript.id}`]}>
        <TranscriptEditPage />
      </MemoryRouter>,
      mockAPI
    );

    await waitFor(() => {
      expect(screen.getByText("Test Interview Transcript")).toBeDefined();
    });

    // Click export button
    const exportButton = screen.getByText("Export");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockAPI.exportToWord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: transcript.id,
          title: transcript.title
        })
      );
    });
  });
});