import { ReactNode } from "react";
import { AppShell, Burger, Group, Title, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import { RecentTranscripts } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

const NAVBAR_BREAKPOINT = "sm";

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 0 }}
      navbar={{
        width: { sm: 300, md: 300, lg: 300, xl: 300 },
        breakpoint: NAVBAR_BREAKPOINT,
        collapsed: { mobile: !opened, desktop: !opened },
      }}
    >
      <AppShell.Header>
        <Group h="100%" m="sm">
          <Burger opened={opened} onClick={toggle} size="sm" />
          <UnstyledButton onClick={() => navigate("/")}>
            <Title order={3}>Transcript Editor</Title>
          </UnstyledButton>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <RecentTranscripts />
      </AppShell.Navbar>
      <AppShell.Main style={{ overflow: "hidden", height: "100vh" }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
