import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecentTranscripts } from "@src/components/RecentTranscripts";
import { TRANSCRIPTS_SUMMARIES_LIMIT } from "@src/services/api";
import { createDummyTranscripts, mockApiFactory } from "../utils/mockAPI";
import { render } from "../utils/mockRender";
import { min } from "@shared/utils";

describe("RecentTranscripts Component", () => {
  it('Test 1: Only "ready" transcripts are displayed', async () => {
    const transcripts = createDummyTranscripts(20);
    const mockAPI = mockApiFactory(transcripts);
    render(<RecentTranscripts />, mockAPI);
    const readyTranscripts = transcripts.filter((t) => t.status === "ready");

    // Check for the first page of "ready" transcripts
    for (let i = 0; i < TRANSCRIPTS_SUMMARIES_LIMIT; i++) {
      expect(await screen.findByText(readyTranscripts[i].title)).toBeVisible();
    }

    // Ensure "deleted" transcripts are not present
    const deletedTranscripts = transcripts.filter(
      (t) => t.status === "deleted"
    );
    for (const transcript of deletedTranscripts) {
      expect(screen.queryByText(transcript.title)).toBeNull();
    }

    // Verify the correct number of items on the first page
    const transcriptLinks = await screen.findAllByTestId(/transcript-link-/);
    expect(transcriptLinks.length).toEqual(
      min(readyTranscripts.length, TRANSCRIPTS_SUMMARIES_LIMIT)
    );
  });

  it("Test 2: Pagination visibility", async () => {
    // Wait for initial transcripts to load
    const transcripts = createDummyTranscripts(20);
    const mockAPI = mockApiFactory(transcripts);
    render(<RecentTranscripts />, mockAPI);
    const readyTranscripts = transcripts.filter((t) => t.status === "ready");

    expect(await screen.findByText(readyTranscripts[0].title)).toBeVisible();

    const nextButton = screen.getByTestId("next-page-button");
    const prevButton = screen.getByTestId("prev-page-button");

    expect(nextButton).toBeDefined();
    expect(nextButton).toBeEnabled();
    expect(prevButton).toBeDefined();
    expect(prevButton).toBeDisabled();
  });

  it("Test 3: Pagination functionality (Next Page)", async () => {
    const transcripts = createDummyTranscripts(TRANSCRIPTS_SUMMARIES_LIMIT + 5);
    const mockAPI = mockApiFactory(transcripts);
    render(<RecentTranscripts />, mockAPI);

    // Wait for initial page to load
    const readyTranscripts = transcripts.filter((t) => t.status === "ready");
    await mockAPI.getRecentTranscripts();
    expect(await screen.findByText(readyTranscripts[0].title)).toBeVisible();

    const nextButton = screen.getByTestId("next-page-button");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockAPI.getRecentTranscripts).toHaveBeenCalledWith(2);
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
    expect(screen.queryByText(readyTranscripts[0].title)).toBeNull();

    const prevButton = screen.getByTestId("prev-page-button");
    expect(prevButton).toBeEnabled();

    // Next button should be disabled as there are only 18 ready items (15 on page 1, 3 on page 2)
    const nextButtonSecondPage = screen.getByTestId("next-page-button");
    expect(nextButtonSecondPage).toBeDisabled();
  });

  it("Test 4: Pagination functionality (Previous Page)", async () => {
    const transcripts = createDummyTranscripts(20);
    const mockAPI = mockApiFactory(transcripts);
    render(<RecentTranscripts />, mockAPI);
    const readyTranscripts = transcripts.filter((t) => t.status === "ready");

    // Wait for initial page
    await screen.findByText(readyTranscripts[0].title);

    const nextButton = screen.getByTestId("next-page-button");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockAPI.getRecentTranscripts).toHaveBeenCalledWith(2);
      // Wait for page 2 content to render
      return screen.findByText(
        readyTranscripts[TRANSCRIPTS_SUMMARIES_LIMIT].title
      );
    });

    const prevButton = screen.getByTestId("prev-page-button");
    fireEvent.click(prevButton);

    await waitFor(() => {
      // It's called 3 times: initial load (page 1), next (page 2), prev (page 1)
      expect(mockAPI.getRecentTranscripts).toHaveBeenCalledTimes(3);
      expect(mockAPI.getRecentTranscripts).toHaveBeenNthCalledWith(3, 1);
    });

    // Check for the first page of "ready" transcripts again
    for (let i = 0; i < TRANSCRIPTS_SUMMARIES_LIMIT; i++) {
      expect(await screen.findByText(readyTranscripts[i].title)).toBeDefined();
    }
    expect(prevButton).toBeDisabled();
  });

  it("Test 5: Transcript link navigation", async () => {
    const transcripts = createDummyTranscripts(20);
    const mockAPI = mockApiFactory(transcripts);
    render(<RecentTranscripts />, mockAPI);
    const readyTranscripts = transcripts.filter((t) => t.status === "ready");
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
