// @vitest-environment jsdom
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecentTranscripts } from "@src/components/RecentTranscripts";
import { transcriptApi, TRANSCRIPTS_SUMMARIES_LIMIT } from "@src/services/api";
import { mockTranscriptApi } from "./mockAPI";
import { render } from "./setup";
import { createContext } from "react";

const APIContext = createContext(mockTranscriptApi);
// Helper to render with provider
const renderComponent = (mockApi: typeof transcriptApi = mockTranscriptApi) => {
  return render(
        <APIContext.Provider value={mockApi}>
          <RecentTranscripts />
        </APIContext.Provider>
  );
};

function getReadyTranscripts() {
  return mockTranscriptApi
    .getRecentTranscripts()
    .then((transcripts) => transcripts.filter((t) => t.status === "ready"));
}

describe("RecentTranscripts Component", () => {
  beforeEach(() => {
    // Reset mocks if they are stateful between tests, e.g., spies
    vi.restoreAllMocks();
  });

  it('Test 1: Only "ready" transcripts are displayed', async () => {
    renderComponent();
    const readyTranscripts = (
      await mockTranscriptApi.getRecentTranscripts()
    ).filter((t) => t.status === "ready");

    // Check for the first page of "ready" transcripts
    for (let i = 0; i < TRANSCRIPTS_SUMMARIES_LIMIT; i++) {
      expect(await screen.findByText(readyTranscripts[i].title)).toBeDefined();
    }

    // Ensure "deleted" transcripts are not present
    const deletedTranscripts = (
      await mockTranscriptApi.getRecentTranscripts()
    ).filter((t) => t.status === "deleted");
    for (const transcript of deletedTranscripts) {
      expect(screen.queryByText(transcript.title)).not.toBeDefined();
    }

    // Verify the correct number of items on the first page
    const transcriptLinks = await screen.findAllByTestId(/transcript-link-id-/);
    expect(transcriptLinks.length).toBe(TRANSCRIPTS_SUMMARIES_LIMIT);
  });

  it("Test 2: Pagination visibility", async () => {
    renderComponent();
    // Wait for initial transcripts to load
    await screen.findByText(
      (
        await mockTranscriptApi.getRecentTranscripts()
      )[0].title
    );

    const nextButton = screen.getByTestId("next-page-button");
    const prevButton = screen.getByTestId("prev-page-button");

    expect(nextButton).toBeDefined();
    expect(nextButton).toBeEnabled();
    expect(prevButton).toBeDefined();
    expect(prevButton).toBeDisabled();
  });

  it("Test 3: Pagination functionality (Next Page)", async () => {
    const getRecentTranscriptsSpy = vi.spyOn(
      mockTranscriptApi,
      "getRecentTranscripts"
    );
    renderComponent();

    // Wait for initial page to load
    const readyTranscripts = await getReadyTranscripts();
    await screen.findByText(readyTranscripts[0].title);

    const nextButton = screen.getByTestId("next-page-button");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(getRecentTranscriptsSpy).toHaveBeenCalledWith(2);
    });

    // Check for the second page of "ready" transcripts
    for (
      let i = TRANSCRIPTS_SUMMARIES_LIMIT;
      i < readyTranscripts.length;
      i++
    ) {
      expect(await screen.findByText(readyTranscripts[i].title)).toBeDefined();
    }
    // Ensure first page items are gone
    expect(screen.queryByText(readyTranscripts[0].title)).not.toBeDefined();

    const prevButton = screen.getByTestId("prev-page-button");
    expect(prevButton).toBeEnabled();

    // Next button should be disabled as there are only 18 ready items (15 on page 1, 3 on page 2)
    expect(nextButton).toBeDisabled();
  });

  it("Test 4: Pagination functionality (Previous Page)", async () => {
    const getRecentTranscriptsSpy = vi.spyOn(
      mockTranscriptApi,
      "getRecentTranscripts"
    );
    renderComponent();

    // Wait for initial page
    const readyTranscripts = await getReadyTranscripts();
    await screen.findByText(readyTranscripts[0].title);

    const nextButton = screen.getByTestId("next-page-button");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(getRecentTranscriptsSpy).toHaveBeenCalledWith(2);
      // Wait for page 2 content to render
      return screen.findByText(
        readyTranscripts[TRANSCRIPTS_SUMMARIES_LIMIT].title
      );
    });

    const prevButton = screen.getByTestId("prev-page-button");
    fireEvent.click(prevButton);

    await waitFor(() => {
      // It's called 3 times: initial load (page 1), next (page 2), prev (page 1)
      expect(getRecentTranscriptsSpy).toHaveBeenCalledTimes(3);
      expect(getRecentTranscriptsSpy).toHaveBeenNthCalledWith(3, 1);
    });

    // Check for the first page of "ready" transcripts again
    for (let i = 0; i < TRANSCRIPTS_SUMMARIES_LIMIT; i++) {
      expect(await screen.findByText(readyTranscripts[i].title)).toBeDefined();
    }
    expect(prevButton).toBeDisabled();
  });

  it("Test 5: Transcript link navigation", async () => {
    renderComponent();
    const readyTranscripts = await getReadyTranscripts();
    const readyTranscriptsPage1 = readyTranscripts.slice(
      0,
      TRANSCRIPTS_SUMMARIES_LIMIT
    );

    for (const transcript of readyTranscriptsPage1) {
      const link = await screen.findByTestId(
        `transcript-link-${transcript.id}`
      );
      expect(link).toBeDefined();
      expect(link).toHaveAttribute("href", `/transcript/${transcript.id}`);
    }
  });
});
