import { useCallback, useEffect, useRef } from "react";
import { Group, Textarea, Text, Box } from "@mantine/core";
import { TranscriptSegment } from "@shared/transcript";

interface SegmentEditorProps {
  segment: TranscriptSegment;
  isActive: boolean;
  refCallback: (el: HTMLTextAreaElement) => void;
  onClick: (time: number) => void;
}

export function SegmentEditor({
  segment,
  isActive,
  refCallback,
  onClick,
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
    <Box onClick={() => (!isActive ? onClick(segment.start) : null)}>
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
          styles={{
            input: {
              fontFamily: "monospace",
              backgroundColor: isActive ? "#e7f5ff" : "white",
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
