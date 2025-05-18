import { file_type } from "@shared/transcript";
import { FileStore } from "@src/services/interfaces";
import { pb } from "."; // Assuming pb instance is exported from here
import { RecordModel } from "pocketbase";

interface FileRecord extends RecordModel {
  file_type: file_type; // Type of the file
  file: string;
}

const FILE_COLLECTION = "file_db"; // Replace with your actual collection name

export const pbFileStore: FileStore = {
  /**
   * Uploads a (audio only for now) file to the PocketBase 'file' collection.
   * @param file The audio file to upload.
   * @returns A promise resolving to the identifier of the uploaded file.
   */
  async uploadFile(
    file: File,
    type: file_type
  ): Promise<{ file_id: string; file_url: string }> {
    const data = {
      file_type: type,
      file: file,
    };

    try {
      const record = await pb
        .collection(FILE_COLLECTION)
        .create<FileRecord>(data);
      // FIX: The record returns the file name, not a file object;
      const file_url = pb.files.getURL(record, record.file);
      return { file_id: record.id, file_url: file_url };
    } catch (error) {
      console.error("Error uploading file to PocketBase:", error);
      // Consider more specific error handling or re-throwing
      throw new Error(
        `Failed to upload file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },

  /**
   * Retrieves a file from a PocketBase file URL.
   * Note: This implementation fetches the file content as a Blob and reconstructs a File object.
   * Depending on usage, directly using the blob or URL might be more efficient.
   * @param url The URL of the file obtained from PocketBase (e.g., from uploadFile).
   * @returns A promise resolving to the File object.
   */
  async getFile(id: string): Promise<File> {
    // Fetch the file record from PocketBase using the ID
    const record = await pb.collection(FILE_COLLECTION).getOne<FileRecord>(id);
    // Use fetch api to get the file blob
    const response = await fetch(pb.files.getURL(record, record.file));
    const blob = await response.blob();
    // Create a new File object from the blob
    const file = new File([blob], record.file);
    return file;
  },

  async getFileURL(id: string): Promise<string> {
    // Fetch the file record from PocketBase using the ID
    const record = await pb.collection(FILE_COLLECTION).getOne<FileRecord>(id);
    return pb.files.getURL(record, record.file);
  },
};
