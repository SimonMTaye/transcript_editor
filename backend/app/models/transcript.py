from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# Define a Pydantic model for the segment structure
class TranscriptSegment(BaseModel):
    """
    TimestampSegment model representing a segment of audio with its metadata.
    Attributes:
        id (int): Unique identifier for the segment.
        start (float): Start time of the segment in seconds.
        end (float): End time of the segment in seconds.
        text (str): Transcribed text for the segment.
    """

    id: int
    start: float
    end: float
    text: str


class Transcript(BaseModel):
    """
    Transcript model representing a transcript with its metadata and content.

    Attributes:
        id (str): Unique identifier for the transcript.
        title (str): Title of the transcript.
        audio_path (Optional[str]): Path to the associated audio file.
        timestamps (List[TimestampSegment]): List of timestamp segments.
        unedited_id (str): ID of the initial transcript.
        previous_id (str): ID of the previous version.
        created_at (datetime): Timestamp when the transcript was created.
        updated_at (datetime): Timestamp when the transcript was last updated.
    """

    id: str  # Changed from int to string for content-based hash
    title: str
    audio_path: Optional[str] = None
    segments: List[TranscriptSegment] = []
    unedited_id: str  # ID of the initial transcript
    previous_id: str  # ID of the previous version
    created_at: datetime
    updated_at: datetime


class Config:
    from_attributes = True
