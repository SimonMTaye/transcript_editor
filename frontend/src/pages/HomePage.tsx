import { Container, Title, Group, Box, Space } from '@mantine/core';
import { RecentTranscripts } from '../components/RecentTranscripts';
import { AudioUpload } from '../components/AudioUpload';

export function HomePage() {
  return (
    <Container size="lg">
      <Group gap="xl" align="flex-start" justify='center'>
        <Box style={{ flex: 1 }}>
          <Title order={3} mb="md">Upload Audio</Title>
          <AudioUpload />
        </Box>
      </Group>
    </Container>
  );
}