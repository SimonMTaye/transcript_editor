import "@testing-library/jest-dom/vitest";

import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, vitest } from "vitest";

const queryClient = new QueryClient();

// @ts-ignore
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vitest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vitest.fn(), // Deprecated
    removeListener: vitest.fn(), // Deprecated
    addEventListener: vitest.fn(),
    removeEventListener: vitest.fn(),
    dispatchEvent: vitest.fn(),
  })),
});

export function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>{children}</MantineProvider>
      </QueryClientProvider>
    ),
  });
}
