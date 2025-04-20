import { useEffect, useRef } from "react";
import { Group, Textarea, Text, Box } from "@mantine/core";
import { TranscriptSegment } from "../services/api";

interface SegmentEditorProps {
  segment: TranscriptSegment;
  onChange: (segmentId: number, newText: string) => void;
  isActive: boolean;
  refCallback: (el: HTMLDivElement) => void;
  onClick: (time: number) => void;
}

export function SegmentEditor({
  segment,
  onChange,
  isActive,
  refCallback,
  onClick,
}: SegmentEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  useEffect(() => {
    if (ref.current) {
      refCallback(ref.current);
    }
  }, [ref]);

  return (
    <Box ref={ref} onClick={() => (!isActive ? onClick(segment.start) : null)}>
      <Group
        preventGrowOverflow={false}
        gap="xs"
        wrap="nowrap"
        justify="flex-start"
      >
        <Text size="xs" c="dimmed">
          [{formatTime(segment.start)}]
        </Text>
        <Textarea
          value={segment.text}
          onChange={(e) => onChange(segment.id, e.target.value)}
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
