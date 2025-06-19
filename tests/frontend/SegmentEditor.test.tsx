import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";

import {
  SegmentEditor,
  ACTIVE_BG_COLOR,
  DEFAULT_BG_COLOR,
} from "@src/components/SegmentEditor";
import { TranscriptSegment } from "@shared/transcript";
import { render } from "../utils/mockRender";
import { hexToRgb } from "../utils/testUtils";

// Helper function to create a mock transcript segment
const createMockSegment = (
  overrides: Partial<TranscriptSegment> = {}
): TranscriptSegment => ({
  start: 10.5,
  end: 25.8,
  text: "This is a sample transcript segment for testing purposes.",
  speaker: "SPEAKER_00",
  ...overrides,
});

describe("SegmentEditor Component", () => {
  it("Test 1: Clicking segment triggers onClick with correct start time", async () => {
    // Verify that clicking on a segment calls onClick callback with the segment's start time
    // This ensures proper audio seeking when user selects a transcript segment
    const mockOnClick = vi.fn();
    const mockRefCallback = vi.fn();
    const mockOnChange = vi.fn();
    const segment = createMockSegment({ start: 15.5 });

    render(
      <SegmentEditor
        segment={segment}
        isActive={false}
        refCallback={mockRefCallback}
        onClick={mockOnClick}
        onChange={mockOnChange}
      />
    );

    const segmentBox = screen
      .getByText("This is a sample transcript segment for testing purposes.")
      .closest("div");
    expect(segmentBox).toBeDefined();

    fireEvent.click(segmentBox!);
    expect(mockOnClick).toHaveBeenCalledWith(15.5);
  });

  it("Test 2: Active segment displays with highlighted background", async () => {
    // Verify that active segments are visually distinguished with background highlighting
    // This provides visual feedback to users about the currently selected segment
    const mockOnClick = vi.fn();
    const mockRefCallback = vi.fn();
    const mockOnChange = vi.fn();
    const segment = createMockSegment();

    render(
      <SegmentEditor
        segment={segment}
        isActive={true}
        refCallback={mockRefCallback}
        onClick={mockOnClick}
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByDisplayValue(
      "This is a sample transcript segment for testing purposes."
    );
    expect(textarea).toBeDefined();

    // Check if the textarea has the active background color
    const styles = getComputedStyle(textarea);
    expect(styles.backgroundColor).toBe(hexToRgb(ACTIVE_BG_COLOR));
    // Note: In actual implementation, we'd check for the specific active background color
    expect(textarea).toBeDefined();
  });

  it("Test 3: Inactive segment displays with normal background", async () => {
    // Verify that inactive segments display with normal background styling
    // This ensures proper visual state management for non-selected segments
    const mockOnClick = vi.fn();
    const mockRefCallback = vi.fn();
    const mockOnChange = vi.fn();
    const segment = createMockSegment();

    render(
      <SegmentEditor
        segment={segment}
        isActive={false}
        refCallback={mockRefCallback}
        onClick={mockOnClick}
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByDisplayValue(
      "This is a sample transcript segment for testing purposes."
    );
    expect(textarea).toBeDefined();
    const styles = getComputedStyle(textarea);
    expect(styles.backgroundColor).toBe(hexToRgb(DEFAULT_BG_COLOR));
  });

  it("Test 4: Time display shows formatted segment start time", async () => {
    // Verify that the segment timestamp is displayed in readable MM:SS format
    // This provides users with time reference for each transcript segment
    const mockOnClick = vi.fn();
    const mockRefCallback = vi.fn();
    const mockOnChange = vi.fn();
    const segment = createMockSegment({ start: 125.5 }); // 2:05

    render(
      <SegmentEditor
        segment={segment}
        isActive={false}
        refCallback={mockRefCallback}
        onClick={mockOnClick}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("2:05")).toBeDefined();
  });

  it("Test 5: Textarea contains segment text for editing", async () => {
    // Verify that the textarea displays the segment text and allows editing
    // This ensures users can modify transcript content as needed
    const mockOnClick = vi.fn();
    const mockRefCallback = vi.fn();
    const mockOnChange = vi.fn();
    const segmentText = "Custom segment text for editing test";
    const segment = createMockSegment({ text: segmentText });
    const user = userEvent.setup();

    render(
      <SegmentEditor
        data-testid="segment-editor"
        segment={segment}
        isActive={false}
        refCallback={mockRefCallback}
        onClick={mockOnClick}
        onChange={mockOnChange}
      />
    );

    const textarea = screen.getByDisplayValue(segmentText);
    expect(textarea).toBeDefined();
    // Call a user event to simulate typing in the textarea
    const newText = "Edited segment text";
    await user.click(textarea);
    await user.clear(textarea);
    await user.type(textarea, newText);

    const updated = screen.getByDisplayValue(newText);
    expect(updated).toBeDefined();
  });

  it("Test 6: RefCallback is called with textarea element", async () => {
    // Verify that the refCallback is invoked with the textarea DOM element
    // This enables parent components to manage textarea references for data collection
    const mockOnClick = vi.fn();
    const mockRefCallback = vi.fn();
    const mockOnChange = vi.fn();
    const segment = createMockSegment();

    render(
      <SegmentEditor
        segment={segment}
        isActive={false}
        refCallback={mockRefCallback}
        onClick={mockOnClick}
        onChange={mockOnChange}
      />
    );

    expect(mockRefCallback).toHaveBeenCalled();
    const calledWith = mockRefCallback.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("Test 7: Edge case - Zero start time formats correctly", async () => {
    // Verify that segments starting at time 0 display correct timestamp
    // This ensures proper time formatting for edge cases like transcript beginning
    const mockOnClick = vi.fn();
    const mockRefCallback = vi.fn();
    const mockOnChange = vi.fn();
    const segment = createMockSegment({ start: 0 });

    render(
      <SegmentEditor
        segment={segment}
        isActive={false}
        refCallback={mockRefCallback}
        onClick={mockOnClick}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("0:00")).toBeDefined();
  });
});
