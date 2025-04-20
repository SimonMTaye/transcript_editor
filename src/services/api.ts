import axios from 'axios';

const API_URL = 'http://localhost:8000';  // Adjust this to your backend URL
const API_PREFIX = '/api/v1/transcripts'; // Add API prefix to match backend router configuration

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id: string;
  title: string;
  audio_path: string | null;
  segments: TranscriptSegment[];
  unedited_id: string;
  previous_id: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSummary {
  id: string;
  title: string;
  updated_at: string;
}

// API client
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transcript service
export const transcriptApi = {
  // Get recent transcripts
  getRecentTranscripts: async (): Promise<TranscriptSummary[]> => {
    const response = await apiClient.get(`${API_PREFIX}/recent`);
    return response.data;
  },

  // Get a specific transcript
  getTranscript: async (id: string): Promise<Transcript> => {
    const response = await apiClient.get(`${API_PREFIX}/fetch/${id}`);
    return response.data;
  },

  // Upload a new audio file
  uploadAudio: async (title: string, file: File): Promise<Transcript> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    
    try {
      const response = await apiClient.post(`${API_PREFIX}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading audio file:', error);
      throw error;
    }
  },

  // Refine transcript with LLM
  refineTranscript: async (id: string): Promise<Transcript> => {
    const response = await apiClient.post(`${API_PREFIX}/refine/${id}`);
    return response.data;
  },

  // Export transcript to Word
  exportToWord: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`${API_PREFIX}/export/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};