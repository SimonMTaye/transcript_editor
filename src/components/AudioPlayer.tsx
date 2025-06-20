import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Box, Slider, Group, ActionIcon, Text } from "@mantine/core";
import { IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react";

interface AudioPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void; // Callback for time changes during playback or seek
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

// Expose a seek function to parent component
export interface AudioPlayerRef {
  seek: (time: number) => void;
}
// Component is now a standard function component
export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ src, onTimeUpdate }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [paused, setPaused] = useState(true);

    // Expose the seek function using useImperativeHandle
    useImperativeHandle(ref, () => ({
      seek(time: number) {
        if (audioRef.current) {
          // Ensure time is within bounds
          const newTime = Math.max(
            0,
            Math.min(time, audioRef.current.duration || 0)
          );
          audioRef.current.currentTime = newTime;
          // Manually update state and notify parent after imperative seek
          setCurrentTime(newTime);
          onTimeUpdate(newTime);
        }
      },
    }));

    // Effect to handle audio events
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();
      setPaused(true); // Reset paused state when src changes

      const handleLoadedMetadata = () => {
        const newDuration = audio.duration;
        setDuration(newDuration);
      };
      const handleTimeUpdate = () => {
        const time = audio.currentTime;
        setCurrentTime(time); // Update local state
        onTimeUpdate(time); // Notify parent
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);

      // Set initial duration if already loaded
      if (audio.readyState >= 1) {
        handleLoadedMetadata();
        audio.currentTime = currentTime; // Set initial time to the segment time
      }

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
      };
      // Re-run if src changes, but not on other prop changes like currentTime
    }, [src]);

    const togglePlayPause = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (!paused) {
        audio.pause();
        setPaused(true); // Update paused state
      } else {
        // Ensure audio is ready before playing
        if (audio.readyState >= 1) {
          audio
            .play()
            .catch((error) => console.error("Error playing audio:", error));
          setPaused(false); // Update paused state
        } else {
          console.warn("Audio not ready, cannot play yet.");
          // Optionally load the audio if not already loading
          // audio.load();
        }
      }
    };

    // When user starts dragging slider
    const handleSeekStart = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause(); // Pause during seek for smoother experience
        setPaused(true); // Update paused state
      }
    };

    // While user is dragging slider
    const handleSeekChange = (value: number) => {
      // Update the displayed time immediately, but don't seek audio yet
      // or notify parent until seek ends.
      // We could optionally update parent here if live preview during seek is desired:
      onTimeUpdate(value);
      setCurrentTime(value);
    };

    // When user releases slider
    const handleSeekEnd = (value: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = value;
        onTimeUpdate(value); // Notify parent of the final seeked time
        if (audioRef.current.paused) {
          audioRef.current
            .play()
            .catch((error) => console.error("Error resuming audio:", error)); // Resume playing if it was playing
        }
      }
    };

    return (
      <Box
        p="md"
        style={{
          border: "1px solid var(--mantine-color-gray-3)",
          borderRadius: "0",
          position: "sticky",
          bottom: "0rem",
          zIndex: 100,
          backgroundColor: "var(--mantine-color-white)",
        }}
      >
        {/* Use a key derived from src to force re-render and reset state if src changes */}
        <audio ref={audioRef} src={src} preload="metadata" key={src} />
        <Group>
          <ActionIcon
            onClick={togglePlayPause}
            role="play-pause-button"
            size="lg"
            variant="default"
          >
            {paused ? (
              <IconPlayerPlay role="play-button" size={18} />
            ) : (
              <IconPlayerPause role="pause-button" size={18} />
            )}
          </ActionIcon>
          <Text size="sm" style={{ minWidth: "80px", textAlign: "center" }}>
            {/* Display the currentTime prop for immediate feedback */}
            {formatTime(currentTime)}
          </Text>
          <Slider
            value={currentTime} // Slider position controlled by currentTime prop
            onChange={handleSeekChange} // Handle visual change during drag
            onChangeEnd={handleSeekEnd} // Finalize seek on release
            onMouseDown={handleSeekStart} // Mark as seeking on press
            role="audio-seek-slider"
            max={duration || 0}
            step={5}
            label={null}
            style={{ flexGrow: 1 }}
            styles={{ thumb: { transition: "left 0s" } }}
          />
          <Text size="sm" style={{ minWidth: "80px", textAlign: "center" }}>
            {formatTime(duration)}
          </Text>
        </Group>
      </Box>
    );
  }
);
