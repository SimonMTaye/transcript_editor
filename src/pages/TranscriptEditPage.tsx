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
} from "@mantine/core";
import { AudioPlayer, AudioPlayerRef } from "../components/AudioPlayer";
import { SegmentEditor } from "../components/SegmentEditor";
import { Transcript } from "../models/transcript";
import { APIContext } from "../App";

export function TranscriptEditPage() {
  const transcriptApi = useContext(APIContext);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refining, setRefining] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Segment tracking to allow scrolling to the active segment based on audio time
  const [activeSegmentId, setActiveSegmentId] = useState<number>(0);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // INFO: We are assuming the transcript is an audio transcript
        // But this will need to be changed or enforced through a stronger guarantee
        const data = (await transcriptApi.getTranscript(id)) as Transcript;
        setTranscript(data);
        setError("");
      } catch (err) {
        console.error("Failed to fetch transcript:", err);
        setError("Failed to load transcript");
      } finally {
        setLoading(false);
      }
    };

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

  const handleSegmentChange = (segmentId: number, newText: string) => {
    if (!transcript) return;

    const updatedSegments = transcript.segments.map((segment) =>
      segment.s_id === segmentId ? { ...segment, text: newText } : segment
    );

    setTranscript({ ...transcript, segments: updatedSegments });
  };

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
      const blob = await transcriptApi.exportToWord(id);

      // Create a download link for the Word document
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${transcript.title}.docx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export transcript:", err);
      setError("Failed to export transcript");
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

  if (error) {
    return (
      <Container size="lg">
        <Alert color="red" title="Error" mt="md">
          {error}
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

  if (!transcript) {
    return (
      <Container fluid>
        <Alert color="yellow" title="Not Found" mt="md">
          Transcript not found
          <Button
            variant="outline"
            color="yellow"
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
      <Group p="md" justify="space-between" mb="lg">
        <Title order={2}>{transcript.title}</Title>
        <Group>
          <Button
            onClick={handleRefine}
            loading={refining}
            disabled={refining}
            variant="outline"
          >
            Refine with LLM
          </Button>
          <Button
            onClick={handleExport}
            loading={exporting}
            disabled={exporting}
          >
            Export to Word
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
        <Paper p="md">
          <Stack>
            {transcript.segments.map((segment) => (
              <SegmentEditor
                key={segment.s_id}
                segment={segment}
                onChange={handleSegmentChange}
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
