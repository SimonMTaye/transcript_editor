import { ReactNode } from 'react';
import { AppShell, Burger, Group, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { RecentTranscripts } from './RecentTranscripts';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'lg',
        collapsed: { mobile: !opened },
      }}
      footer={{height: 0}}
    >
      <AppShell.Header>
        <Group h="100%" px="lg">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <UnstyledButton onClick={() => navigate('/')}>
            <Title order={3}>Transcript Editor</Title>
          </UnstyledButton>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Title order={4} mb="md">Recent Transcripts</Title>
        <RecentTranscripts />
      </AppShell.Navbar>

      <AppShell.Main  >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}