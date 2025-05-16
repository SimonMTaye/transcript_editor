import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptSegment } from "@shared/transcript";

const segmentResponseType = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    required: ["segments"],
    properties: {
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["start", "end", "speaker", "text"],
          properties: {
            start: {
              type: Type.NUMBER,
            },
            end: {
              type: Type.NUMBER,
            },
            speaker: {
              type: Type.STRING,
            },
            text: {
              type: Type.STRING,
            },
          },
        },
      },
    },
  },
};

// Convert the segments to string [start - end ?speaker]: text \n
const flatten = (segments: TranscriptSegment[]) => {
  return segments
    .map((segment) => {
      return `${segment.start} - ${segment.end} ${
        segment.speaker ? `?${segment.speaker}` : ""
      }: ${segment.text}\n`;
    })
    .join("");
};

const systemInstruction = `You are an excellent content editor and transcriptor. Please refine this interview transcript to improve readability and make it appropriate for a written post.
Remove speech artifacts (ums, ahs, repeated words), fix obvious grammatical errors and delete pleasantries with no other content.
Remove redundant content, ensure natural flow, shorten where appropriate and remove unnecessary connective words.
Maintain all important information, and if you decide to change wording then make sure to preserve the original intention.
Try to reduce the transcript to 1500-2500 words. 
If speaker names are present, please preserve them; if they are not present, then assign generic Speaker 1, Speaker 2, etc. to the segments using context to know when the speaker changes.`;

export const refineFactory = async (key: string, model: string) => {
  const googleAI = new GoogleGenAI({ apiKey: key });
  return async (segments: TranscriptSegment[]) => {
    const response = await googleAI.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: flatten(segments),
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        ...segmentResponseType,
      },
    });
    // Parse the response
    const parsedResponse = JSON.parse(response.text!);
    return parsedResponse.segments.map((segment: any) => {
      return {
        start: segment.start,
        end: segment.end,
        speaker: segment.speaker,
        text: segment.text,
      };
    }) as TranscriptSegment[];
  };
};

// Configure here:
const apiKey = process.env.GEMINI_API_KEY;
const defaultModel = "gemini-2.5-flash-preview-04-17";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

export const refine = await refineFactory(apiKey, defaultModel);
