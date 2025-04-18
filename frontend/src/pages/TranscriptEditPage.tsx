import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Group, 
  Button, 
  Loader, 
  Alert, 
  Paper, 
  Textarea,
  Stack,
  Text,
  Box
} from '@mantine/core';
import { transcriptApi, Transcript, TranscriptSegment } from '../services/api';

export function TranscriptEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refining, setRefining] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await transcriptApi.getTranscript(id);
        setTranscript(data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch transcript:', err);
        setError('Failed to load transcript');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [id]);

  const handleSegmentChange = (segmentId: number, newText: string) => {
    if (!transcript) return;

    const updatedSegments = transcript.segments.map(segment => 
      segment.id === segmentId ? { ...segment, text: newText } : segment
    );

    setTranscript({ ...transcript, segments: updatedSegments });
  };

  const handleRefine = async () => {
    if (!id) return;
    
    try {
      setRefining(true);
      const refinedTranscript = await transcriptApi.refineTranscript(id);
      setTranscript(refinedTranscript);
      setError('');
    } catch (err) {
      console.error('Failed to refine transcript:', err);
      setError('Failed to refine transcript');
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
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${transcript.title}.docx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export transcript:', err);
      setError('Failed to export transcript');
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
          <Button variant="outline" color="red" mt="md" onClick={() => navigate('/')}>
            Go back to home
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!transcript) {
    return (
      <Container size="lg">
        <Alert color="yellow" title="Not Found" mt="md">
          Transcript not found
          <Button variant="outline" color="yellow" mt="md" onClick={() => navigate('/')}>
            Go back to home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Group justify="space-between" mb="lg">
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

      <Paper withBorder p="md">
        <Stack gap="md">
          {transcript.segments.map((segment) => (
            <SegmentEditor 
              key={segment.id} 
              segment={segment} 
              onChange={handleSegmentChange}
            />
          ))}
        </Stack>
      </Paper>
    </Container>
  );
}

interface SegmentEditorProps {
  segment: TranscriptSegment;
  onChange: (segmentId: number, newText: string) => void;
}

function SegmentEditor({ segment, onChange }: SegmentEditorProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <Box>
      <Group mb="xs">
        <Text size="sm" c="dimmed">
          [{formatTime(segment.start)} - {formatTime(segment.end)}]
        </Text>
      </Group>
      <Textarea
        value={segment.text}
        onChange={(e) => onChange(segment.id, e.target.value)}
        autosize
        minRows={2}
        styles={{ input: { fontFamily: 'monospace' } }}
      />
    </Box>
  );
}