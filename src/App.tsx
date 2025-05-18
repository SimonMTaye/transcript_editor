import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Layout } from "@src/components/Layout";
import { HomePage } from "@src/pages/HomePage";
import { TranscriptEditPage } from "@src/pages/TranscriptEditPage";
import { transcriptApi } from "@src/services/api";
import { createContext } from "react";

export const APIContext = createContext(transcriptApi);
function App() {
  return (
    <MantineProvider>
      <BrowserRouter>
        <APIContext.Provider value={transcriptApi}>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/transcript/:id" element={<TranscriptEditPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </APIContext.Provider>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
