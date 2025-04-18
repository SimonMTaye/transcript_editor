from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.transcript import Transcript, TranscriptSummary
from ..models.database import TranscriptDB, get_db
from .utils import transcript_to_segments, generate_hash, segments_to_transcript


class DBService:
    """
    Database service for managing transcripts.
    This service handles the interaction with the database for creating,
    updating, and retrieving transcripts.
    It uses SQLAlchemy ORM for database operations.
    Attributes:
        db (Session): SQLAlchemy session for database operations.
        db_gen (generator): Generator for creating new database sessions.
    Methods:
        save_new_transcript(transcript: Transcript): Save a new transcript to the database.
        update_transcript(transcript: Transcript, new_content: str): Update an existing transcript.
        get_recent_transcripts() -> List[Transcript]: Retrieve recent transcripts from the database.
        get_transcript(transcript_id: str) -> Optional[Transcript]: Retrieve a transcript by its ID.
    """

    def __init__(self):
        # Consider using Depends(get_db) in endpoint functions instead of storing db instance
        # This ensures session lifecycle is managed per request
        self.db_gen = get_db()
        self.db: Session = next(self.db_gen)

    def _get_db(self) -> Session:
        # Helper to get a fresh session if needed, though Depends is preferred
        try:
            return next(self.db_gen)
        except StopIteration:
            self.db_gen = get_db()
            return next(self.db_gen)

    # Convert DB model to Pydantic model
    def _transcriptdb_to_transcript(self, db_transcript: TranscriptDB) -> Transcript:
        return Transcript(
            id=db_transcript.id,
            title=db_transcript.title,
            audio_path=db_transcript.audio_path,
            segments=transcript_to_segments(db_transcript.content),
            unedited_id=db_transcript.unedited_id,
            previous_id=db_transcript.previous_id,
            created_at=db_transcript.created_at,
            updated_at=db_transcript.updated_at,
        )

    def _transcript_to_transcriptdb(self, transcript: Transcript) -> TranscriptDB:
        return TranscriptDB(
            id=transcript.id,
            title=transcript.title,
            audio_path=transcript.audio_path,
            content=segments_to_transcript(transcript.segments),
            unedited_id=transcript.unedited_id,
            previous_id=transcript.previous_id,
            created_at=transcript.created_at,
            updated_at=transcript.updated_at,
        )

    async def save_new_transcript(self, transcript: Transcript):
        """
        Save a transcript to the database
        Args:
            transcript (Transcript): The original transcript to update.
            new_content (str): The new content to update the transcript with.
        """
        # Create new transcript with updated content and timestamps

        transcript_model = self._transcript_to_transcriptdb(transcript)
        db = self._get_db()
        db.add(transcript_model)
        db.commit()
        db.refresh(transcript_model)

    async def update_transcript(self, transcript: Transcript, new_content: str):
        """
        Update a pre-existing transcript with new content.
        Args:
            transcript (Transcript): The original transcript to update.
            new_content (str): The new content to update the transcript with.
        """
        # Generate a new hash for the updated content
        new_hash = generate_hash(new_content)
        # Create new transcript with updated content and timestamps
        new_transcript = TranscriptDB(
            id=new_hash,
            title=transcript.title,
            content=new_content,
            audio_path=transcript.audio_path,
            unedited_id=transcript.unedited_id,
            previous_id=transcript.id,
            created_at=transcript.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        db = self._get_db()
        db.add(new_transcript)
        db.commit()
        db.refresh(new_transcript)
        return new_transcript

    async def get_recent_transcripts(self) -> List[TranscriptSummary]:
        """
        Retrieve recent transcripts with only id, title and updated_at from the database.
        Returns a list of lightweight TranscriptSummary models.
        """

        db = self._get_db()
        db_transcripts = (
            db.query(TranscriptDB.id, TranscriptDB.title, TranscriptDB.updated_at)
            .order_by(TranscriptDB.updated_at.desc())
            .limit(10)
            .all()
        )

        return [
            TranscriptSummary(id=t.id, title=t.title, updated_at=t.updated_at)
            for t in db_transcripts
        ]

    async def get_transcript(self, transcript_id: str) -> Optional[Transcript]:
        """
        Retrieve a transcript by its ID
        Args:
            transcript_id (str): The ID of the transcript to retrieve.
        """
        db = self._get_db()
        db_transcript = (
            db.query(TranscriptDB).filter(TranscriptDB.id == transcript_id).first()
        )
        if not db_transcript:
            return None
        return self._transcriptdb_to_transcript(db_transcript)


db_service = DBService()
