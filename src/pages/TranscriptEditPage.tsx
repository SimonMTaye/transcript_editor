import { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Group,
  Button,
  Loader,
  Alert,
  Paper,
  Stack,
  Box,
  Text,
} from "@mantine/core";
import { AudioPlayer, AudioPlayerRef } from "@src/components/AudioPlayer";
import { SegmentEditor } from "@src/components/SegmentEditor";
import { Transcript } from "@shared/transcript";
import { APIContext } from "@src/App";
import { IconAutomation, IconFileWord } from "@tabler/icons-react";
import { countWords } from "@shared/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Autosave delay in milliseconds (5 seconds)
const AUTOSAVE_DELAY = 1000;

export function TranscriptEditPage() {
  const transcriptApi = useContext(APIContext);
  // URL param using which we can get the transcript ID
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  // Segment tracking to allow scrolling to the active segment based on audio time
  const [activeStart, setActiveSegmentStart] = useState<number>(0);
  const segmentRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map());
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const queryClient = useQueryClient();
  const [wordCount, setWordCount] = useState(0);

  // Autosave state management
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    data: transcript,
    isLoading: loading,
    error,
  } = useQuery<Transcript, Error>({
    queryKey: ["transcript", id],
    queryFn: async () => {
      const result = await transcriptApi.getTranscript(id!);
      setWordCount(countWords(result.segments));
      return result;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!transcript) {
        throw new Error("Transcript not loaded");
      }
      const editedSegments = getActiveText(transcript);

      setWordCount(countWords(editedSegments));
      return transcriptApi.saveTranscriptEdits(transcript.id, editedSegments);
    },
    onSuccess: (data) => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({
        queryKey: ["transcript", data.id],
      });
    },
  });

  // Return text stored in segments that user might have editted
  const getActiveText = (transcript: Transcript) => {
    return transcript.segments.map((segment) => {
      const ref = segmentRefs.current.get(segment.start);
      return ref ? { ...segment, text: ref.value } : segment;
    });
  };

  // Cancel any pending autosave timer
  const cancelAutosaveTimer = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  };

  // Schedule autosave with debouncing
  const scheduleAutosave = () => {
    cancelAutosaveTimer();
    autosaveTimerRef.current = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveMutation.mutate();
      }
    }, AUTOSAVE_DELAY);
  };

  // Trigger autosave when segments are modified
  const handleSegmentChange = () => {
    setHasUnsavedChanges(true);
    scheduleAutosave();
  };

  const refineMutation = useMutation({
    // Define the mutation
    mutationFn: async () => {
      if (!transcript) {
        throw new Error("Transcript not loaded");
      }
      // Cancel autosave since we're explicitly saving
      cancelAutosaveTimer();

      const editedSegments = getActiveText(transcript);

      setWordCount(countWords(editedSegments));
      await transcriptApi.saveTranscriptEdits(transcript.id, editedSegments);
      return transcriptApi.refineTranscript(transcript!.id);
    },
    onSuccess: (data: Transcript) => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["transcript", data.id] });
    },
  });

  // Effect to scroll to the active segment
  useEffect(() => {
    if (activeStart !== null) {
      const node = segmentRefs.current.get(activeStart);
      node?.scrollIntoView({
        behavior: "smooth",
        block: "center", // Or 'start', 'end', 'nearest'
      });
    }
  }, [activeStart]); // Run when activeSegmentId changes

  // Update the transcript state with the edited segments
  // Callback for AudioPlayer time updates
  const handleTimeUpdate = (time: number) => {
    if (!transcript) return;

    // Find the segment that contains the current time
    const currentSegment = transcript.segments.find(
      (segment) => time >= segment.start && time < segment.end
    );

    const currentActiveStart = currentSegment
      ? currentSegment.start
      : activeStart;

    // Update active segment ID only if it changed
    if (currentActiveStart !== activeStart) {
      setActiveSegmentStart(currentActiveStart);
    }
  };

  const handleSegmentClick = (time: number) => {
    if (!audioPlayerRef.current) return;
    
    // Don't seek if clicking on the currently active segment
    if (time === activeStart) return;
    
    audioPlayerRef.current.seek(time);
  };

  const handleExport = async () => {
    if (!id || !transcript) return;

    try {
      setExporting(true);
      // Cancel autosave since we're explicitly saving
      cancelAutosaveTimer();
      await saveMutation.mutate();
      const blob = await transcriptApi.exportToWord(transcript);
      // Trigger a download of the Word document
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${transcript.title}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export transcript:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Container size="lg">
        <Group justify="center" mt="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    );
  }

  if (error || !transcript) {
    return (
      <Container size="lg">
        <Alert color="red" title="Error" mt="md">
          {`${error}\n\n`}
          <Button
            variant="outline"
            color="red"
            mt="md"
            onClick={() => navigate("/")}
          >
            Go back to home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid style={{ minHeight: "100vh", padding: "0rem" }}>
      <Group p="sm" justify="space-between">
        <Stack align="flex-start" gap={0} justify="flex-start" ml="xl">
          <Title order={2}>{transcript.title}</Title>
          <Text
            size="sm"
            c="dimmed"
            onClick={() => setWordCount(countWords(getActiveText(transcript)))}
          >
            {`${wordCount} words`}
          </Text>
        </Stack>
        <Group>
          <Button
            leftSection={<IconAutomation size={16} />}
            onClick={async () => await refineMutation.mutate()}
            loading={refineMutation.isPending || saveMutation.isPending}
            disabled={refineMutation.isPending || saveMutation.isPending}
            variant="outline"
            role="refine-button"
          >
            Refine
          </Button>
          <Button
            leftSection={<IconFileWord size={16} />}
            onClick={handleExport}
            loading={exporting}
            disabled={exporting}
            role="word-export-button"
          >
            Export
          </Button>
        </Group>
      </Group>
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100vh",
        }}
      >
        <Paper p="sm">
          <Stack>
            {transcript.segments.map((segment) => (
              <SegmentEditor
                key={segment.start}
                segment={segment}
                isActive={segment.start === activeStart}
                refCallback={(el) => segmentRefs.current.set(segment.start, el)} // Pass ref callback to store element reference
                onClick={handleSegmentClick} // Pass click handler to set active segment
                onChange={handleSegmentChange} // Pass change handler for autosave
              />
            ))}
          </Stack>
        </Paper>
        {/* Add the Audio Player */}
        {transcript.file_url && (
          <AudioPlayer
            src={transcript.file_url}
            onTimeUpdate={handleTimeUpdate}
            ref={audioPlayerRef}
          />
        )}
      </Box>
    </Container>
  );
}
