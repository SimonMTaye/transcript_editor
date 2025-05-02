import { TranscriptSegment } from "../../models/transcript";
import { refine } from "./gemini_transform";


export interface Transformer {
  refine: (segments: TranscriptSegment[]) => Promise<TranscriptSegment[]>;
}

export const transformer: Transformer = {
  refine,
};

/*
export interface Actor {
  act(action: string, segments: TranscriptSegment[]): Promise<TranscriptSegment[]>;
  getActions(): string[];
  addAction(action: string): boolean;
  undo(): Promise<TranscriptSegment[]>;
  redo(): Promise<TranscriptSegment[]>;
}
*/