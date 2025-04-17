import os
import uuid
import shutil
import io
from typing import List, Optional, Literal
from datetime import datetime, timezone
from fastapi import UploadFile
from ..models.transcript import Transcript, TranscriptSummary
from .llm_service import llm_service
from .whisper_service import transcribe_service  # Import the new WhisperService
from .utils import segments_to_transcript, generate_hash
from .db_service import db_service

# Define a directory to store uploads relative to the backend root
UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


class TranscriptService:
    """
    Service class for handling transcript-related operations.

    """

    async def _transcribe(
        self, audio_file_path: str
    ) -> tuple[Optional[str], Optional[List[dict]]]:
        """Helper function to transcribe audio using WhisperService."""
        return await transcribe_service.transcribe(audio_file_path)

    async def _save_file(self, file: UploadFile):
        _, file_extension = os.path.splitext(file.filename)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"DEBUG: File saved to {file_path}")
        except Exception as e:
            raise IOError(f"Could not save uploaded file: {e}") from e
        finally:
            file.file.close()
        return file_path

    async def handle_audio_upload(self, title: str, file: UploadFile) -> Transcript:
        """
        Handle audio file upload and transcription.
        This function is a placeholder and should be replaced with actual implementation.
        """
        print("DEBUG: Handling audio file.")
        path = await self._save_file(file)
        audio_path_for_db = path
        print("DEBUG: Calling _transcribe_audio_openai...")
        _, segments = await self._transcribe(path)
        print(f"DEBUG: Received from OpenAI - Segments type: {type(segments)}")
        t_hash = generate_hash(segments_to_transcript(segments))

        return Transcript(
            id=t_hash,
            title=title,
            audio_path=audio_path_for_db,
            segments=segments,
            unedited_id=hash,
            previous_id=hash,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    async def create_transcript_from_upload(
        self, title: str, file: UploadFile
    ) -> Transcript:
        """
        Handles the creation of a transcript from an uploaded file.
        This function saves the uploaded file, transcribes it, and performs light editing.
        Args:
            title (str): Title for the transcript.
            file (UploadFile): The uploaded audio file.
        Returns:
            Transcript: The created transcript object.
        Raises:
            HTTPException: If there is an error during processing.
        """
        print(f"DEBUG: Processing file type: {file.content_type}")
        if file.content_type.startswith("audio/"):
            transcript = await self.handle_audio_upload(title, file)
        else:
            raise ValueError("Only audio files are supported for transcription.")
        # TEMP
        print("DEBUG: Saving Transcript to DB...")
        db_service.save_new_transcript(transcript)
        return True

    async def perform_llm_action(
        self,
        transcript_id: str,
        action: Literal["refine"],
    ) -> Optional[Transcript]:
        """
        Perform an action on the transcript using LLM service.
        This function retrieves the transcript, processes it with the LLM service,
        and updates the transcript in the database.
        Args:
            transcript_id (str): ID of the transcript to be refined.
        """
        transcript = await db_service.get_transcript(transcript_id)
        if not transcript:
            return None
        if not transcript.content:
            return transcript

        if action == "refine":
            # Pass timestamps to the LLM service if available
            result = await llm_service.refine(transcript.segments)
            content = segments_to_transcript(result)
            return db_service.update_transcript(transcript, content)
        raise ValueError("Unknown action type")

    async def export_to_word(self, transcript_id: str) -> io.BytesIO:
        """
        Export the transcript to a Word document.
        Args:
            transcript_id (str): ID of the transcript to be exported.
        """

        raise NotImplementedError(
            "Export to Word functionality is not implemented yet."
        )

    async def get_recent_transcripts(self) -> List[TranscriptSummary]:
        """
        Retrieve all transcripts from the database.
        """
        return await db_service.get_recent_transcripts()


transcript_service = TranscriptService()
