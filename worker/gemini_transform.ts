import { OpenAI } from "openai";
import { TranscriptSegment } from "@shared/transcript";

const segmentResponseSchema = {
  type: "object",
  required: ["segments"],
  properties: {
    segments: {
      type: "array",
      items: {
        type: "object",
        required: ["start", "end", "speaker", "text"],
        properties: {
          start: {
            type: "number",
          },
          end: {
            type: "number",
          },
          speaker: {
            type: "string",
          },
          text: {
            type: "string",
          },
        },
      },
    },
  },
} as const;

// Convert the segments to string [start - end ?speaker]: text \n
const flatten = (segments: TranscriptSegment[]) => {
  return segments
    .map((segment) => {
      return `${segment.start} - ${segment.end} ${segment.speaker ? `?${segment.speaker}` : ""
        }: ${segment.text}\n`;
    })
    .join("");
};

const systemInstruction = `You are an expert content editor specializing in refining interview transcripts for written publication. Your task is to edit the following transcript, improving its readability while preserving the speaker's original voice and intention.

Please follow these guidelines to refine the transcript:

1. Speaker Identification:
   - If speaker names are present in the transcript, preserve them.
   - If speaker names are not present, assign generic labels (Speaker 1, Speaker 2, etc.) based on context clues.

2. Content Editing:
   - Remove all speech artifacts (e.g., "um," "ah," repeated words).
   - Fix obvious grammatical errors.
   - Delete pleasantries that contain no substantial content.
   - Remove redundant content and unnecessary connective words.
   - Ensure a natural flow of conversation.
   - Shorten content where appropriate without losing important information.

3. Preservation of Intent:
   - Maintain all important information from the original transcript.
   - Preserve the speaker's original voice and intention.
   - If rewording is necessary, ensure it doesn't alter the original meaning.
   - Focus on reorganizing original words to improve readability rather than replacing them with new vocabulary.

4. Length:
   - Aim to reduce the transcript to between 1500 and 2500 words.

Your final output should follow this structure:

<refined_transcript>
[Speaker 1]: [Refined statement]

[Speaker 2]: [Refined response]

[Speaker 1]: [Next refined statement]

...
</refined_transcript>

Please proceed with editing the transcript, focusing on maintaining the speaker's voice while improving readability and removing speech artifacts.`;

export const refineFactory = async (key: string, model: string) => {
  const openai = new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
  return async (segments: TranscriptSegment[]) => {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: `Here is the raw transcript: 
                      <transcript>
                      ${flatten(segments)}
                      </transcript>`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "transcript_segments",
          schema: segmentResponseSchema,
        },
      },
    });

    // Parse the response
    const parsedResponse = JSON.parse(response.choices[0].message.content!);
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
export const defaultModel = "gemini-2.5-flash-preview-04-17";
