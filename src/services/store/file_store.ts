import { file_type } from "@shared/transcript";

export interface FileStore {
  uploadFile: (
    file: File,
    type: file_type
  ) => Promise<{ file_id: string; file_url: string }>;
  getFile: (id: string) => Promise<File>;
  getFileURL: (id: string) => Promise<string>; // Changed return type to Promise<string>
}
