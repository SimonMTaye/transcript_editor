import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import QueryClient and Provider
import { Layout } from "@src/components/Layout";
import { HomePage } from "@src/pages/HomePage";
import { TranscriptEditPage } from "@src/pages/TranscriptEditPage";
import { transcriptApi } from "@src/services/api";
import { createContext } from "react";
import { Toaster } from "react-hot-toast";
import { theme } from "./theme";

const queryClient = new QueryClient();

export const APIContext = createContext(transcriptApi);
function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <APIContext.Provider value={transcriptApi}>
            <Layout>
              <Toaster position="top-center" />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/transcript/:id"
                  element={<TranscriptEditPage />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </APIContext.Provider>
        </QueryClientProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
