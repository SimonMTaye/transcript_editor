from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.transcript import Transcript, TranscriptSummary
from ..models.database import TranscriptDB, TranscriptSummaryDB, get_db
from .utils import transcript_to_segments, segments_to_transcript


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
            id=str(db_transcript.id),
            title=str(db_transcript.title),
            audio_path=str(db_transcript.audio_path),
            segments=transcript_to_segments(str(db_transcript.content)),
            unedited_id=str(db_transcript.unedited_id),
            previous_id=str(db_transcript.previous_id),
            created_at=datetime.fromisoformat(str(db_transcript.created_at)),
            updated_at=datetime.fromisoformat(str(db_transcript.updated_at)),
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

    def _transcript_to_transcript_summarydb(
        self, transcript: Transcript
    ) -> TranscriptSummaryDB:
        return TranscriptSummaryDB(
            id=transcript.id,
            title=transcript.title,
            unedited_id=transcript.unedited_id,
            updated_at=transcript.updated_at,
        )

    def _transcriptdb_to_transcript_summary(
        self, transcript: TranscriptDB | TranscriptSummaryDB
    ) -> TranscriptSummary:
        return TranscriptSummary(
            id=str(transcript.id),
            title=str(transcript.title),
            updated_at=datetime.fromisoformat(str(transcript.updated_at)),
        )

    async def save_transcript(self, transcript: Transcript):
        """
        Save a transcript to the database;
        Args:
            transcript (Transcript): The original transcript to update.
            new_content (str): The new content to update the transcript with.
        """
        # Create new transcript with updated content and timestamps

        transcript_model = self._transcript_to_transcriptdb(transcript)
        transcript_summary_model = self._transcript_to_transcript_summarydb(transcript)
        db = self._get_db()
        db.query(TranscriptSummaryDB).filter(
            TranscriptSummaryDB.unedited_id == transcript.unedited_id
        ).delete()
        db.add(transcript_model)
        db.add(transcript_summary_model)
        db.commit()
        db.refresh(transcript_model)
        return self._transcriptdb_to_transcript(transcript_model)

    async def get_recent_transcripts(self) -> List[TranscriptSummary]:
        """
        Retrieve recent transcripts with only id, title and updated_at from the database.
        Returns a list of lightweight TranscriptSummary models.
        """

        db = self._get_db()
        db_transcripts = (
            db.query(TranscriptSummaryDB)
            .order_by(TranscriptSummaryDB.updated_at.desc())
            .limit(10)
            .all()
        )

        return [self._transcriptdb_to_transcript_summary(t) for t in db_transcripts]

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
