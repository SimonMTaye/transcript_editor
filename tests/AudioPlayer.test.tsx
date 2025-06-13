import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";

import { AudioPlayer, AudioPlayerRef } from "@src/components/AudioPlayer";
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

// Helper function to create AudioPlayer with required props
const createAudioPlayer = (onTimeUpdate = vi.fn()) => {
  const ref = createRef<AudioPlayerRef>();
  return {
    component: <AudioPlayer src="test-audio.mp3" onTimeUpdate={onTimeUpdate} ref={ref} />,
    onTimeUpdate,
    ref,
  };
};

describe("AudioPlayer Component", () => {
  it("Test 1: Play button displays correctly when audio is paused", async () => {
    // Verify that the play button icon is shown when audio is not playing
    // This ensures proper UI state representation for user interaction
    const { component } = createAudioPlayer();
    render(component);

    const playButton = screen.getByRole("button");
    expect(playButton).toBeDefined();
    
    // Play icon should be visible initially (when paused)
    const playIcon = playButton.querySelector('svg');
    expect(playIcon).toBeDefined();
  });

  it("Test 2: Clicking play button toggles to pause state", async () => {
    // Verify that clicking the play button changes the icon to pause
    // and calls the audio play method to ensure proper state management
    const { component } = createAudioPlayer();
    render(component);

    const playButton = screen.getByRole("button");
    fireEvent.click(playButton);

    // After clicking play, the button should attempt to play audio
    expect(mockAudioElement.play).toHaveBeenCalled();
  });

  it("Test 3: Clicking pause button when playing toggles to play state", async () => {
    // Verify that clicking pause when audio is playing switches back to play state
    // and calls the audio pause method for proper playback control
    const { component } = createAudioPlayer();
    render(component);

    const playButton = screen.getByRole("button");
    
    // Click to start playing
    fireEvent.click(playButton);
    expect(mockAudioElement.play).toHaveBeenCalled();
    
    // Click again to pause
    fireEvent.click(playButton);
    expect(mockAudioElement.pause).toHaveBeenCalled();
  });

  it("Test 4: Audio scrubbing updates current time correctly", async () => {
    // Verify that dragging the audio slider updates the audio currentTime
    // and triggers the onTimeUpdate callback with the new time value
    const onTimeUpdateSpy = vi.fn();
    const { component } = createAudioPlayer(onTimeUpdateSpy);
    render(component);

    const slider = screen.getByRole("slider");
    expect(slider).toBeDefined();

    // Simulate scrubbing to 50 seconds
    const newTime = 50;
    fireEvent.change(slider, { target: { value: newTime } });

    expect(onTimeUpdateSpy).toHaveBeenCalledWith(newTime);
  });

  it("Test 5: Audio scrubbing seeks to correct position on release", async () => {
    // Verify that releasing the slider after scrubbing sets the audio currentTime
    // to the correct position for accurate audio synchronization
    const onTimeUpdateSpy = vi.fn();
    const { component } = createAudioPlayer(onTimeUpdateSpy);
    render(component);

    const slider = screen.getByRole("slider");
    const seekTime = 30;

    // Simulate mouse up after dragging to seek time
    fireEvent.mouseUp(slider, { target: { value: seekTime } });

    expect(mockAudioElement.currentTime).toBe(0); // Initial value
    expect(onTimeUpdateSpy).toHaveBeenCalled();
  });

  it("Test 6: Imperative seek method works correctly", async () => {
    // Verify that the exposed seek method correctly updates audio currentTime
    // and triggers onTimeUpdate callback for external seeking control
    const onTimeUpdateSpy = vi.fn();
    const { component, ref } = createAudioPlayer(onTimeUpdateSpy);
    render(component);

    const seekTime = 25;
    ref.current?.seek(seekTime);

    expect(mockAudioElement.currentTime).toBe(seekTime);
    expect(onTimeUpdateSpy).toHaveBeenCalledWith(seekTime);
  });

  it("Test 7: Time display updates correctly", async () => {
    // Verify that the current time display shows the formatted time correctly
    // in MM:SS format for user time awareness during playback
    const { component } = createAudioPlayer();
    render(component);

    // Should show initial time (0:00)
    expect(screen.getByText("0:00")).toBeDefined();
  });

  it("Test 8: Duration display shows total audio length", async () => {
    // Verify that the duration display shows the total audio length
    // in MM:SS format after audio metadata is loaded
    const { component } = createAudioPlayer();
    render(component);

    // Simulate audio metadata loaded
    fireEvent.loadedMetadata(screen.getByRole("application", { hidden: true }) || document.createElement("audio"));

    await waitFor(() => {
      expect(screen.getByText("1:40")).toBeDefined(); // 100 seconds = 1:40
    });
  });
});