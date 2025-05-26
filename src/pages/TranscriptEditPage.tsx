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
import {
  IconAutomation,
  IconDeviceFloppy,
  IconFileWord,
} from "@tabler/icons-react";
import { countWords } from "@src/utils/word_count";
import toast from 'react-hot-toast';

export function TranscriptEditPage() {
  const transcriptApi = useContext(APIContext);
  // URL param using which we can get the transcript ID
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Current transcript being worked on
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [error, setError] = useState("");
  // State variables used for UI elements
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Segment tracking to allow scrolling to the active segment based on audio time
  const [activeSegmentId, setActiveSegmentId] = useState<number>(0);
  const segmentRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map());
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [wordCount, setWordCount] = useState(0);

  const checkPocketBaseAutocancellation = (err: any) => {
    if (
      typeof err === "object" &&
      err !== null &&
      "isAbort" in err &&
      err.isAbort
    ) {
      return true; // Ignore abort errors
    }
    return false;
  };

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // INFO: We are assuming the transcript is an audio transcript
        // But this will need to be changed or enforced through a stronger guarantee
        const data = (await transcriptApi.getTranscript(id)) as Transcript;
        setTranscript(data);
        setWordCount(countWords(data.segments));
        setError("");
        setLoading(false);
      } catch (err) {
        if (checkPocketBaseAutocancellation(err)) {
          console.warn("Fetch aborted:", err);
          return; // Ignore abort errors
        }
        console.error("Failed to fetch transcript:", err);
        setError("Failed to load transcript");
      }
    };
    console.log("Fetching transcript with ID:", id);
    fetchTranscript();
  }, [id]);

  // Effect to scroll to the active segment
  useEffect(() => {
    if (activeSegmentId !== null) {
      const node = segmentRefs.current.get(activeSegmentId);
      node?.scrollIntoView({
        behavior: "smooth",
        block: "center", // Or 'start', 'end', 'nearest'
      });
    }
  }, [activeSegmentId]); // Run when activeSegmentId changes

  // Write a function to read through the stored segment refs and get most recent data
  const getEditedSegmentData = () => {
    transcript?.segments.forEach((segment) => {
      const ref = segmentRefs.current.get(segment.s_id);
      if (ref) {
        const updatedText = ref.value;
        // Update the segment text with the new value
        segment.text = updatedText;
      }
    });
    setTranscript(transcript);
    setWordCount(countWords(transcript!.segments));
  };
  // Update the transcript state with the edited segments
  // Callback for AudioPlayer time updates
  const handleTimeUpdate = (time: number) => {
    if (!transcript) return;

    // Find the segment that contains the current time
    const currentSegment = transcript.segments.find(
      (segment) => time >= segment.start && time < segment.end
    );

    const currentActiveId = currentSegment
      ? currentSegment.s_id
      : activeSegmentId;

    // Update active segment ID only if it changed
    if (currentActiveId !== activeSegmentId) {
      setActiveSegmentId(currentActiveId);
    }
  };

  const handleSegmentClick = (time: number) => {
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.seek(time);
  };

  const handleRefine = async () => {
    if (!id) return;

    try {
      setRefining(true);
      getEditedSegmentData();
      // Since original data was audio transcript we can assume the refinement is as well
      const refinedTranscript = await transcriptApi.refineTranscript(id);
      setTranscript(refinedTranscript);
      setError("");
    } catch (err) {
      console.error("Failed to refine transcript:", err);
      setError("Failed to refine transcript");
    } finally {
      setRefining(false);
    }
  };

  const handleExport = async () => {
    if (!id || !transcript) return;

    try {
      setExporting(true);
      getEditedSegmentData();
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
      setError("Failed to export transcript");
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    if (!id || !transcript) return;

    try {
      getEditedSegmentData();
      const savedTranscript = await transcriptApi.saveTranscriptEdits(
        id,
        transcript.segments
      );
      setTranscript(savedTranscript);
      toast.success("Changes Saved");
      setError("");
    } catch (err) {
      console.error("Failed to save transcript:", err);
      toast.error("Error saving changes");
      setError("Failed to save transcript");
    } finally {
    }
  };

  if (loading || !transcript) {
    return (
      <Container size="lg">
        <Group justify="center" mt="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    );
  }

  if (error) {
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
          <Text size="sm" c="dimmed" onClick={() => getEditedSegmentData()}>
            {`${wordCount} words`}
          </Text>
        </Stack>
        <Group>
          <Button
            onClick={handleSave}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Save
          </Button>
          <Button
            leftSection={<IconAutomation size={16} />}
            onClick={handleRefine}
            loading={refining}
            disabled={refining}
            variant="outline"
          >
            Refine
          </Button>
          <Button
            leftSection={<IconFileWord size={16} />}
            onClick={handleExport}
            loading={exporting}
            disabled={exporting}
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
                key={segment.s_id}
                segment={segment}
                isActive={segment.s_id === activeSegmentId}
                refCallback={(el) => segmentRefs.current.set(segment.s_id, el)} // Pass ref callback to store element reference
                onClick={handleSegmentClick} // Pass click handler to set active segment
                // Pass ref callback to store element reference
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
