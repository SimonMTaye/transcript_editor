import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { APIContext } from "@src/App";
import { mockTranscriptApi } from "./mockAPI";

const queryClient = new QueryClient();

export function render(ui: React.ReactNode, mockAPI = mockTranscriptApi) {
  return testingLibraryRender(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <APIContext.Provider value={mockAPI}>
          <MantineProvider>{ui}</MantineProvider>
        </APIContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
