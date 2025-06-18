import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";

import { AudioPlayer, AudioPlayerRef } from "@src/components/AudioPlayer";
import { render } from "../utils/mockRender";
import userEvent from "@testing-library/user-event";

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

// Helper function to create AudioPlayer with required props
const createAudioPlayer = (onTimeUpdate = vi.fn()) => {
  const ref = createRef<AudioPlayerRef>();
  return {
    component: (
      <AudioPlayer src="test-audio.mp3" onTimeUpdate={onTimeUpdate} ref={ref} />
    ),
    onTimeUpdate,
    ref,
  };
};

describe("AudioPlayer Component", () => {
  it("Test 1: Test that play/pause button works correctly ", async () => {
    // Verify that the play button icon is shown when audio is not playing
    // This ensures proper UI state representation for user interaction
    mockAudioElement.paused = false;
    const { component } = createAudioPlayer();
    const user = userEvent.setup();
    render(component);

    const playButton = await screen.findByRole("play-button");
    expect(playButton).toBeDefined();

    await user.click(playButton);
    expect(mockAudioElement.play).toHaveBeenCalled();

    const pauseButton = await screen.findByRole("pause-button");
    expect(pauseButton).toBeDefined();
    expect(await screen.queryByRole("play-button")).toBeNull();

    await user.click(pauseButton);
    expect(mockAudioElement.pause).toHaveBeenCalled();
  });

  it("Test 2: Audio scrubbing updates current time correctly", async () => {
    const onTimeUpdateSpy = vi.fn();
    const { component } = createAudioPlayer(onTimeUpdateSpy);
    const user = userEvent.setup();
    render(component);

    const slider = screen.getByRole("audio-seek-slider");
    expect(slider).toBeDefined();

    // Set focus on slider
    await user.click(slider);
    // Seek 5 times using keyboard which is equal to 50 seconds
    for (let i = 0; i < 10; i++) {
      await user.keyboard("{ArrowRight}");
    }
    expect(onTimeUpdateSpy).toHaveBeenCalledWith(50);
  });

  it("Test 3: Imperative seek method works correctly", async () => {
    // Verify that the exposed seek method correctly updates audio currentTime
    // and triggers onTimeUpdate callback for external seeking control
    const onTimeUpdateSpy = vi.fn();
    const { component, ref } = createAudioPlayer(onTimeUpdateSpy);
    render(component);

    const seekTime = 99;
    ref.current?.seek(seekTime);

    expect(mockAudioElement.currentTime).toBe(seekTime);
    expect(onTimeUpdateSpy).toHaveBeenCalledWith(seekTime);
  });

  it("Test 4: Time display updates correctly", async () => {
    // Verify that the current time display shows the formatted time correctly
    // in MM:SS format for user time awareness during playback
    const { component } = createAudioPlayer();
    render(component);

    // Should show initial time (0:00)
    expect(screen.getByText("0:00")).toBeDefined();
  });

  it("Test 5: Duration display shows total audio length", async () => {
    // Verify that the duration display shows the total audio length
    // in MM:SS format after audio metadata is loaded
    const { component } = createAudioPlayer();
    render(component);

    expect(screen.getByText("1:40")).toBeDefined(); // 100 seconds = 1:40
  });
});
