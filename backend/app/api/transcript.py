from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List
import logging
from ..models.transcript import Transcript, TranscriptSummary
from ..services.transcript_service import transcript_service

router = APIRouter()
logger = logging.getLogger(__name__)


# Endpoint to list all transcripts (summaries would be better, but returning full for now)
@router.get("/recent", response_model=List[TranscriptSummary])
async def list_transcripts():
    # In a real app, you might want pagination and summary models here
    logger.info("Fetching recent transcripts")
    return await transcript_service.get_recent_transcripts()


# Endpoint to handle file uploads
@router.post("/upload", response_model=Transcript)
async def upload_transcript_file(title: str = Form(...), file: UploadFile = File(...)):
    # Here, the service needs a method to handle the uploaded file
    # This might involve saving the file, queuing transcription, etc.
    # For now, assume service handles it and returns a Transcript object
    try:
        logger.info("Uploading file: %s  with title: %s", file.filename, title)
        # You'll need to implement `create_transcript_from_upload` in your service
        transcript = await transcript_service.create_transcript_from_upload(
            title=title, file=file
        )
        logger.info("Successfully processed upload: %s", transcript.id)
        return transcript
    except Exception as e:
        # Log the exception e
        logger.error("Error processing upload: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to process uploaded file: {e}"
        ) from e


@router.get("/fetch/{transcript_id}", response_model=Transcript)
async def get_transcript(transcript_id: str):  # Changed from int to str
    transcript = await transcript_service.get_transcript(transcript_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return transcript


@router.put("/{transcript_id}", response_model=Transcript)
async def update_transcript():
    raise NotImplementedError("Update endpoint not implemented yet")


@router.post("/refine/{transcript_id}", response_model=Transcript)
async def refine_transcript(transcript_id: str):  # Changed from int to str
    """
    Refine the transcript using LLM service.
    """
    transcript = await transcript_service.perform_llm_action(transcript_id, "refine")
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return transcript


# Endpoint to export transcript to Word document
@router.get("/export/{transcript_id}", response_class=StreamingResponse)
async def export_transcript_to_word(transcript_id: str):  # Changed from int to str
    try:
        file_stream = await transcript_service.export_to_word(transcript_id)

        # Use transcript title or ID for filename
        transcript_data = await transcript_service.get_transcript(transcript_id)
        if transcript_data:
            filename = f"transcript_{transcript_data.title.replace(' ', '_')}.docx"
        else:
            filename = f"transcript_{transcript_id}.docx"

        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail="Transcript not found") from e
    except Exception as e:
        # Log the error e
        raise HTTPException(
            status_code=500, detail=f"Failed to export transcript: {e}"
        ) from e
