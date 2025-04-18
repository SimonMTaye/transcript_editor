import os
from typing import Optional, List, Tuple
from fastapi import HTTPException
from openai import OpenAI, OpenAIError
from ..core.config import settings
from ..models.transcript import TranscriptSegment


class WhisperService:
    def __init__(self):
        """Initialize the WhisperService with OpenAI client."""
        if settings.OPENAI_API_KEY:
            try:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                print("OpenAI client initialized successfully in WhisperService.")
            except OpenAIError as e:
                print(f"Warning: Failed to initialize OpenAI client: {e}")
        else:
            print("Warning: OPENAI_API_KEY not found in environment")

    async def transcribe(
        self, audio_file_path: str
    ) -> Tuple[Optional[str], Optional[List[TranscriptSegment]]]:
        """
        Transcribe audio using OpenAI Whisper API, returning text and segments.

        Args:
            audio_file_path (str): Path to the audio file to transcribe

        Returns:
            tuple: (transcribed_text, segments) where segments is a list of dicts with start, end, text data
        """
        if not self.openai_client:
            print("OpenAI client not available. Skipping transcription.")
            return None, None  # Return None for both text and segments

        try:
            print(
                f"Sending audio {os.path.basename(audio_file_path)} to OpenAI Whisper API (requesting timestamps)..."
            )
            with open(audio_file_path, "rb") as audio_file:
                # Use the transcription endpoint with verbose_json for timestamps
                transcript_response = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",  # Request segments and timestamps
                )
            print("Transcription received from OpenAI.")

            # Extract full text and segments
            full_text = transcript_response.text
            # Convert the segments from the response in transcript_response.segments to a list of TranscriptSegment objects
            print(transcript_response.segments)
            segments = [
                TranscriptSegment(
                    start=segment["start"],
                    end=segment["end"],
                    text=segment["text"],
                    id=i,
                )
                for i, segment in enumerate(transcript_response.segments)
            ]

            return full_text, segments

        except OpenAIError as e:
            print(f"OpenAI API error during transcription: {e}")
            raise HTTPException(status_code=500, detail=f"OpenAI API Error: {e}") from e
        except Exception as e:
            print(f"Error during OpenAI Whisper transcription: {e}")
            raise HTTPException(
                status_code=500, detail=f"Transcription Error: {e}"
            ) from e


# Create a singleton instance
whisper_service = WhisperService()
