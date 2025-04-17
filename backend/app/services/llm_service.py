import google.generativeai as genai
from ..core.config import settings
from typing import List
from ..models.transcript import TranscriptSegment
from .utils import transcript_to_segments


class LLMService:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.0-flash-lite")
        self.heavy_model = genai.GenerativeModel("gemini-2.5-pro-exp-03-25")

    async def _call_heavy_model(
        self, action_promot: str, timestamps: List[TranscriptSegment]
    ) -> List[TranscriptSegment]:
        segments_text = []
        for segment in timestamps:
            segments_text.append(
                f"[{segment.start:.2f} --> {segment.end:.2f}] {segment.text}"
            )
        timestamped_transcript = "\n".join(segments_text)
        prompt = f"{action_promot}\n\n {timestamped_transcript}"
        response = await self.heavy_model.generate_content_async(prompt)
        # Parse the response back into TimestampSegment objects
        if response.text:
            return transcript_to_segments(response.text)

    async def refine(
        self,
        timestamps: List[TranscriptSegment] = None,
    ) -> List[TranscriptSegment]:
        action_prompt = """
            Please refine this interview transcript to improve readability. 
            Remove redundant content, ensure natural flow, shorten where appropriate and remove unnecessary connective words.
            Make sure the sentences are clear and concise and have a good flow.
            Remove speech artifacts (ums, ahs, repeated words), fix obvious grammatical errors and delete pleasantries with no other content.
            Maintain all important information and context.
            Try to maintain the speaker's word choices and sequence of responses when possible
            
            IMPORTANT: You must include timestamps in your refined output.
            
            1. Each line of your output must start with a timestamp in the format [start_time --> end_time] followed by text.
            2. If you combine or summarize content from multiple segments, you can use wider timestamp ranges that cover 
               the full range of the original segments being combined (use the earliest start time and the latest end time).
            3. If you remove content, ensure that the remaining content still has appropriate timestamps that maintain 
               the chronological ordering of the audio.
            
            The goal is to ensure each portion of text still corresponds to the correct part of the audio recording,
            even if the text has been refined or summarized.
            
            ---------------------------------
            Transcript:
            """
        return await self._call_heavy_model(action_prompt, timestamps)


llm_service = LLMService()
