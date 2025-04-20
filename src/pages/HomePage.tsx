import { Container, Title, Group, Box } from '@mantine/core';
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