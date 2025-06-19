import { useCallback, useEffect, useRef } from "react";
import { Group, Textarea, Text, Box } from "@mantine/core";
import { TranscriptSegment } from "@shared/transcript";

interface SegmentEditorProps {
  segment: TranscriptSegment;
  isActive: boolean;
  refCallback: (el: HTMLTextAreaElement) => void;
  onClick: (time: number) => void;
  onChange: () => void;
}

export const ACTIVE_BG_COLOR = "#e7f5ff"; // shade of blue
export const DEFAULT_BG_COLOR = "#ffffff"; // white (using hex for easier testing)

export function SegmentEditor({
  segment,
  isActive,
  refCallback,
  onClick,
  onChange,
}: SegmentEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  }, []);

  useEffect(() => {
    if (ref.current) {
      refCallback(ref.current);
    }
  }, [ref]);

  return (
    <Box onClick={() => onClick(segment.start)}>
      <Group
        preventGrowOverflow={false}
        gap="xs"
        wrap="nowrap"
        justify="flex-start"
      >
        <Text size="xs" c="dimmed">
          {formatTime(segment.start)}
        </Text>
        <Textarea
          ref={ref}
          defaultValue={segment.text}
          autosize
          minLength={100}
          onChange={onChange}
          styles={{
            input: {
              fontFamily: "monospace",
              backgroundColor: isActive ? ACTIVE_BG_COLOR : DEFAULT_BG_COLOR,
            },
          }}
          style={{
            flexGrow: 1,
            width: "100%",
          }}
        />
      </Group>
    </Box>
  );
}
