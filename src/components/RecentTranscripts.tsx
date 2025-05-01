import { useQuery } from "@tanstack/react-query";
import { List, ThemeIcon, Text, Loader, Alert } from "@mantine/core";
import { Link } from "react-router-dom";
import { TranscriptMeta } from "../models/transcript";
import { APIContext } from "../App";
import { useContext } from "react";

export function RecentTranscripts() {
  const transcriptApi = useContext(APIContext);
  const {
    data: transcripts,
    isLoading,
    error,
  } = useQuery<TranscriptMeta[], Error>({
    queryKey: ["recentTranscripts"], // Unique key for this query
    queryFn: transcriptApi.getRecentTranscripts, // Function to fetch data
  });

  if (isLoading) {
    return <Loader size="sm" />;
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        Failed to load recent transcripts: {error.message}
      </Alert>
    );
  }

  if (!transcripts || transcripts.length === 0) {
    return <Text size="sm">No recent transcripts found.</Text>;
  }

  return (
    <List spacing="xs" size="sm" center>
      {transcripts.map((transcript) => (
        <List.Item
          key={transcript.id}
          icon={<ThemeIcon color="blue" size={24} radius="xl" />}
        >
          <Link
            to={`/transcript/${transcript.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Text size="sm">{transcript.title}</Text>
            <Text size="xs" c="dimmed">
              Updated: {new Date(transcript.updated_at).toLocaleString()}
            </Text>
          </Link>
        </List.Item>
      ))}
    </List>
  );
}
