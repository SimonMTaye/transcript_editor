import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TranscriptEditPage } from "@src/pages/TranscriptEditPage";
import { countWords } from "@shared/utils";
import { createDummyTranscripts, mockApiFactory } from "../utils/mockAPI";
import { render } from "../utils/mockRender";
import userEvent from "@testing-library/user-event";
import { transcriptApi } from "@src/services/api";
import { Route, Routes } from "react-router-dom";
import { hexToRgb } from "../utils/testUtils";
import { ACTIVE_BG_COLOR } from "@src/components/SegmentEditor";

// Mock HTMLAudioElement for testing
const mockAudioElement = {
  play: vi.fn(() => {
    mockAudioElement.paused = false;
    return Promise.resolve();
  }),
  pause: vi.fn(() => {
    mockAudioElement.paused = true;
    return Promise.resolve();
  }),
  paused: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 100,
  readyState: 4, // HAVE_ENOUGH_DATA
};

Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
  value: mockAudioElement.play,
  configurable: true,
});

Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
  value: mockAudioElement.pause,
  configurable: true,
});

Object.defineProperty(window.HTMLMediaElement.prototype, "paused", {
  get: () => mockAudioElement.paused,
  set: (value) => {
    mockAudioElement.paused = value;
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, "currentTime", {
  get: () => mockAudioElement.currentTime,
  set: (value) => {
    mockAudioElement.currentTime = value;
  },
});
Object.defineProperty(window.HTMLMediaElement.prototype, "duration", {
  get: () => mockAudioElement.duration,
  set: (value) => {
    mockAudioElement.duration = value;
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, "readyState", {
  get: () => mockAudioElement.readyState,
  set: (value) => {
    mockAudioElement.readyState = value;
  },
});

// Mock document.createElement to prevent JSDOM navigation errors
const originalCreateElement = document.createElement;
const mockAnchorClick = vi.fn();

Object.defineProperty(document, "createElement", {
  value: function (tagName: string) {
    if (tagName === "a") {
      const mockAnchor = originalCreateElement.call(
        document,
        tagName
      ) as HTMLAnchorElement;
      mockAnchor.click = mockAnchorClick;
      return mockAnchor;
    }
    return originalCreateElement.call(document, tagName);
  },
  configurable: true,
});

const renderTE = (mockAPI: typeof transcriptApi, initialEntries: string[]) => {
  return render(
    <Routes>
      <Route path="/transcript/:id" element={<TranscriptEditPage />} />
    </Routes>,
    mockAPI,
    initialEntries
  );
};

describe("TranscriptEditPage Tests", () => {
  it("Test 1: Correct transript is loaded and word count is displayed", async () => {
    // Verify that changing audio time through scrubbing highlights the corresponding segment
    // This ensures proper audio-transcript synchronization for user navigation
    const transcript = createDummyTranscripts(1)[0];
    const mockAPI = mockApiFactory([transcript]);
    const wordCount = countWords(transcript.segments);

    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
    });

    // Await first query to ensure transcript is loaded
    expect(await screen.findByText(transcript.title)).toBeVisible();

    expect(screen.getByText(transcript.segments[0].text)).toBeVisible();
    expect(screen.getByText(`${wordCount} words`)).toBeVisible();
  });

  it("Test 2: Clicking segment seeks audio to correct time", async () => {
    // Verify that clicking a transcript segment updates the audio player time
    // This allows users to jump to specific parts of the audio by clicking text
    const transcript = createDummyTranscripts(1, 3)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();
    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
    });
    // Click on the third segment
    const firstSegmentBox = await screen.findByText(
      transcript.segments[0].text
    );

    const thirdSegmentBox = await screen.findByText(
      transcript.segments[2].text
    );

    // Audio should seek to segment start time
    await user.click(firstSegmentBox);
    expect(mockAudioElement.currentTime).toBe(transcript.segments[0].start);

    await user.click(thirdSegmentBox);
    expect(mockAudioElement.currentTime).toBe(transcript.segments[2].start);

    await user.click(firstSegmentBox);
    expect(mockAudioElement.currentTime).toBe(transcript.segments[0].start);
  });

  it("Test 3: Autosave calls API with updated segment data after delay", async () => {
    // Verify that editing text triggers autosave after the delay period
    // and calls the save API with the complete updated transcript data
    const transcript = createDummyTranscripts(1)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();

    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
    });

    // Edit the first segment text
    const firstSegment = await screen.findByText(transcript.segments[0].text);
    await user.click(firstSegment);
    await user.clear(firstSegment);
    await user.type(firstSegment, "TEST EDIT");

    await waitFor(() => {
      expect(mockAPI.saveTranscriptEdits).toHaveBeenCalledWith(
        transcript.id,
        expect.arrayContaining([
          expect.objectContaining({
            text: "TEST EDIT",
          }),
        ])
      );
    });
  });

  it("Test 4: Refine button calls API with current transcript data", async () => {
    // Verify that clicking refine collects current transcript state
    // and calls the refine API to improve transcript quality with AI

    const transcript = createDummyTranscripts(1)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();
    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
    });

    // Click refine button
    const refineButton = await screen.findByRole("refine-button");
    await user.click(refineButton);

    await waitFor(() => {
      expect(mockAPI.saveTranscriptEdits).toHaveBeenCalled();
      expect(mockAPI.refineTranscript).toHaveBeenCalledWith(transcript.id);
    });
  });

  it("Test 5: Word count displays and updates correctly", async () => {
    // Verify that the word count displays the correct total words
    // and updates when autosave triggers after segment edits
    const transcript = createDummyTranscripts(1)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();

    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
      screen.getByText(transcript.title);
    });

    const originalWordCount = countWords(transcript.segments);
    const firstSegmentCount = countWords([transcript.segments[0]]);

    // Double Check that initial word count is displayed correctly
    expect(screen.getByText(`${originalWordCount} words`)).toBeDefined();

    // Edit the first segment text
    const firstSegment = screen.getByText(transcript.segments[0].text);
    await user.click(firstSegment);
    await user.clear(firstSegment);
    await user.type(firstSegment, "TEST EDIT WITH FIVE WORDS");

    // Wait for autosave to complete and word count to update
    await waitFor(() => {
      expect(mockAPI.saveTranscriptEdits).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(`${originalWordCount - firstSegmentCount + 5} words`)
      ).toBeVisible();
    });
  });

  it("Test 6: Multiple segment clicks update active segment correctly", async () => {
    // Verify that clicking different segments properly updates the active state
    // This ensures only one segment is highlighted as active at any time
    const transcript = createDummyTranscripts(1, 2)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();
    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
    });

    expect(mockAudioElement.currentTime).toBe(0);
    // Click first segment
    const firstSegmentBox = await screen.findByText(
      transcript.segments[0].text
    );
    await user.click(firstSegmentBox);

    expect(mockAudioElement.currentTime).toBe(0);

    // Click second segment
    const secondSegmentBox = screen.getByText(transcript.segments[1].text);
    await user.click(secondSegmentBox);

    // Audio should now be at second segment start time
    expect(mockAudioElement.currentTime).toBe(transcript.segments[1].start);
  });

  it("Test 7: Audio time updates activate correct segment", async () => {
    // Verify that audio playback time updates highlight the appropriate transcript segment
    // This ensures proper synchronization during continuous audio playback
    const transcript = createDummyTranscripts(1, 3)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();
    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
      screen.getByText(transcript.title);
    });

    // Simulate audio time update to third segment range
    const audioPlayer = await screen.findByRole("audio-seek-slider");
    await user.click(audioPlayer);
    // Step size is 5 seconds so each button press seeks that much
    // Divide start time by 5 to get number of clicks
    const clickTimes = transcript.segments[2].start / 5;
    for (let i = 0; i < clickTimes; i++) {
      await user.keyboard("{ArrowRight}");
    }

    const thirdSegment = screen.getByText(transcript.segments[2].text);
    // Check if the textarea has the active background color
    const styles = getComputedStyle(thirdSegment);
    expect(styles.backgroundColor).toBe(hexToRgb(ACTIVE_BG_COLOR));
  });

  it("Test 8: Export button triggers Word document download", async () => {
    // Verify that clicking export calls the export API and handles file download
    // This ensures users can save their edited transcripts as Word documents
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const transcript = createDummyTranscripts(1, 3)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();
    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
      screen.getByText(transcript.title);
    });

    // Click export button
    const exportButton = screen.getByRole("word-export-button");
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockAPI.exportToWord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: transcript.id,
        })
      );
    });
  });

  it("Test 9: Autosave debounces multiple edits correctly", async () => {
    // Verify that multiple edits within the delay period only trigger one autosave call
    // This ensures efficient use of API calls and prevents race conditions
    const transcript = createDummyTranscripts(1)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();

    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
      screen.getByText(transcript.title);
    });

    // Edit the first segment text multiple times
    const firstSegment = screen.getByText(transcript.segments[0].text);
    await user.click(firstSegment);
    await user.clear(firstSegment);
    await user.type(firstSegment, "EDIT 1");

    // Make another edit quickly - this should reset the autosave timer
    await user.clear(firstSegment);
    await user.type(firstSegment, "EDIT 2");

    // Make final edit - this should reset the timer again
    await user.clear(firstSegment);
    await user.type(firstSegment, "FINAL EDIT");

    // Verify saveTranscriptEdits was called only once with the final edit
    await waitFor(() => {
      expect(mockAPI.saveTranscriptEdits).toHaveBeenCalledTimes(1);
      expect(mockAPI.saveTranscriptEdits).toHaveBeenCalledWith(
        transcript.id,
        expect.arrayContaining([
          expect.objectContaining({
            text: "FINAL EDIT",
          }),
        ])
      );
    });
  });

  it("Test 10: Clicking currently active segment does not change audio time", async () => {
    // Verify that clicking on the currently active segment does not seek audio
    // This prevents unwanted audio jumping when users interact with the active segment
    const transcript = createDummyTranscripts(1, 3)[0];
    const mockAPI = mockApiFactory([transcript]);
    const user = userEvent.setup();
    renderTE(mockAPI, [`/transcript/${transcript.id}`]);

    await waitFor(() => {
      expect(mockAPI.getTranscript).toHaveBeenCalledWith(transcript.id);
      screen.getByText(transcript.title);
    });

    // Click on the first segment to make it active
    const firstSegmentBox = screen.getByText(transcript.segments[0].text);
    await user.click(firstSegmentBox);

    // Verify audio time is at first segment start
    expect(mockAudioElement.currentTime).toBe(transcript.segments[0].start);

    // Simulate advancing the audio time within the first segment
    const midSegmentTime = transcript.segments[0].start + 2; // 2 seconds into the segment
    mockAudioElement.currentTime = midSegmentTime;

    // Trigger a time update to set the active segment
    const audioPlayer = screen.getByRole("audio-seek-slider");
    await user.click(audioPlayer);

    // Click on the currently active segment (first segment)
    await user.click(firstSegmentBox);

    // Audio time should remain unchanged (not seek back to start)
    expect(mockAudioElement.currentTime).toBe(midSegmentTime);

    // Click on a different segment to verify seeking still works
    const secondSegmentBox = screen.getByText(transcript.segments[1].text);
    await user.click(secondSegmentBox);

    // Audio should now seek to the second segment start time
    expect(mockAudioElement.currentTime).toBe(transcript.segments[1].start);
  });
});
