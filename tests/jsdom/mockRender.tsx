import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { APIContext } from "@src/App";
import { transcriptApi } from "@src/services/api";

export function render(ui: React.ReactNode) {
  const queryClient = new QueryClient();
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </BrowserRouter>
      </MantineProvider>
    ),
  });
}

export function renderWithAPI (mockApi: typeof transcriptApi, ui: React.ReactNode) {
  const queryClient = new QueryClient();
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <APIContext.Provider value={mockApi}>
              {children}
            </APIContext.Provider>
          </QueryClientProvider>
        </BrowserRouter>
      </MantineProvider>
    ),
  });
};