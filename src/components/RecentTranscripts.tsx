import { useQuery } from "@tanstack/react-query";
import {
  Text,
  Loader,
  Alert,
  Group,
  ActionIcon,
  Container,
  Stack,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { TranscriptMeta } from "@shared/transcript";
import { APIContext } from "@src/App";
import { useContext, useState } from "react";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { TRANSCRIPTS_SUMMARIES_LIMIT } from "@src/services/api";

export function RecentTranscripts() {
  const transcriptApi = useContext(APIContext);
  const [page, setPage] = useState(1);
  const {
    data: transcripts,
    isLoading,
    error,
  } = useQuery<TranscriptMeta[], Error>({
    queryKey: ["recentTranscripts", page],
    queryFn: () => transcriptApi.getRecentTranscripts(page),
  });

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

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

  return (
    <Container style={{ minHeight: "100vh", padding: "0rem" }}>
      {transcripts && transcripts.length > 0 && (
        <Stack gap="xs">
          {transcripts.map((transcript) => (
            <Link
              key={transcript.id}
              to={`/transcript/${transcript.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Group>
                <div>
                  <Text size="sm">{transcript.title}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(transcript.updated_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                    <Text component="span" mx={4}>
                      •
                    </Text>
                    {new Date(transcript.updated_at)
                      .toLocaleTimeString("en-US", {
                        hour: "numeric",
                        hour12: true,
                      })
                      .toLowerCase()}
                  </Text>
                </div>
              </Group>
            </Link>
          ))}
        </Stack>
      )}
      {transcripts &&
        (transcripts.length >= TRANSCRIPTS_SUMMARIES_LIMIT || page > 1) && (
          <Group
            // Used fixed position to center; find better way eventually
            style={{
              position: "fixed",
              left: "6rem",
              bottom: "1rem",
              zIndex: 100,
            }}
            justify="center"
            m="auto"
          >
            <ActionIcon
              onClick={handlePreviousPage}
              disabled={page === 1 || isLoading} // Disable while loading new page too
              variant="light"
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Text size="sm">{page}</Text>
            <ActionIcon
              onClick={handleNextPage}
              disabled={
                isLoading ||
                !transcripts ||
                transcripts.length < TRANSCRIPTS_SUMMARIES_LIMIT
              } // Disable if less than 10 items
              variant="light"
            >
              <IconArrowRight size={18} />
            </ActionIcon>
            {isLoading && <Loader size="xs" />}{" "}
            {/* Show small loader during page change */}
          </Group>
        )}
    </Container>
  );
}
