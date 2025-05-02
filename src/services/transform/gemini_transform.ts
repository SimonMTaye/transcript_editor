import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptSegment } from "../../models/transcript";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

const genAI = new GoogleGenAI({apiKey: apiKey});
const model = 'gemini-2.5-flash-preview-04-17';
const segmentResponseType= {
  responseMimeType: 'application/json',
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
  return segments.map((segment) => {
    return `${segment.start} - ${segment.end} ${segment.speaker ? `?${segment.speaker}` : ''}: ${segment.text}\n`;
  }).join('');
};

const systemInstruction = `You are an excellent content editor and transcriptor. Please refine this interview transcript to improve readability and make it appropriate for a written post.
Remove speech artifacts (ums, ahs, repeated words), fix obvious grammatical errors and delete pleasantries with no other content.
Remove redundant content, ensure natural flow, shorten where appropriate and remove unnecessary connective words.
Maintain all important information, and if you decide to change wording then make sure to preserve the original intention.
Try to reduce the transcript to 1500-2500 words and make each segment between 10 and 45s where appropriate.`;

export const refine = async (segments: TranscriptSegment[]) => {
  const response = await genAI.models.generateContent({
    model, 
    contents: [
      {
        role: 'user',
        parts: [
        {
          text: flatten(segments)
        }
      ]
      }
    ],
    config: {
      systemInstruction,
      ...segmentResponseType,
    }
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