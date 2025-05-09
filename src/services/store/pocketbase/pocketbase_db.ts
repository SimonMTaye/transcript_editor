import {
  Transcript,
  TranscriptData,
  TranscriptMeta,
  TranscriptSegment,
  file_type,
  joinMetaAndData,
} from "../../../models/transcript";
import { TranscriptDB } from "../transcript_db";
import { pb } from ".";

const META_COLLECTION = "transcript_meta"; // Replace with your actual collection name
const DATA_COLLECTION = "transcript_data"; // Replace with your actual collection name

type TranscriptMetaPB = TranscriptMeta & {
  deleted: boolean;
};
type TranscriptDataPB = TranscriptData & {
  deleted: boolean;
};
/**
 * Interface representing a database for managing transcripts.
 */

export const pbDB: TranscriptDB = {
  async getTranscript(id: string): Promise<Transcript> {
    const metadata = await pb
      .collection(META_COLLECTION)
      .getOne<TranscriptMetaPB>(id);
    const transcriptData = await pb
      .collection(DATA_COLLECTION)
      .getOne<TranscriptDataPB>(metadata.data_id);
    return joinMetaAndData(metadata, transcriptData);
  },

  async getRecentTranscriptMeta(
    limit: number,
    offset: number
  ): Promise<TranscriptMeta[]> {
    const meta = await pb
      .collection(META_COLLECTION)
      .getList<TranscriptMetaPB>(offset, limit, {
        filter: "deleted = false",
        sort: "-updated_at", // Sort by updated_at in descending order
      });
    return meta.items;
  },

  async createTranscriptData(
    meta_id: string,
    segments: TranscriptSegment[]
  ): Promise<Transcript> {
    const metadata = await pb
      .collection(META_COLLECTION)
      .getOne<TranscriptMetaPB>(meta_id);
    const store_data = {
      segments: segments,
      deleted: false,
      previous_did: metadata.data_id,
      meta_id: metadata.id,
    };
    const createdTranscript = await pb
      .collection(DATA_COLLECTION)
      .create<TranscriptDataPB>(store_data);
    await pb.collection(META_COLLECTION).update<TranscriptMetaPB>(meta_id, {
      data_id: createdTranscript.id,
    });
    return joinMetaAndData(metadata, createdTranscript);
  },

  async createTranscriptMeta(
    title: string,
    file_id: string,
    file_url: string,
    file_type: file_type
  ): Promise<TranscriptMeta> {
    const createdTranscript = await pb
      .collection(META_COLLECTION)
      .create<TranscriptMetaPB>({
        title,
        file_id,
        file_url,
        file_type,
        deleted: false,
      });
    return createdTranscript;
  },

  async wipeTranscript(meta_id: string): Promise<void> {
    // Set delete boolean to true metadata entry whose id is meta_id
    await pb.collection(META_COLLECTION).update<TranscriptMetaPB>(meta_id, {
      deleted: true,
    });
    // Set delete boolean to true data entry whose meta_id matches the meta_id
    const data = await pb
      .collection(DATA_COLLECTION)
      .getList<TranscriptDataPB>(1, 50, {
        filter: `meta_id = "${meta_id}"`,
      });
    for (const item of data.items) {
      await pb.collection(DATA_COLLECTION).update<TranscriptDataPB>(item.id, {
        deleted: true,
      });
    }
  },
};
