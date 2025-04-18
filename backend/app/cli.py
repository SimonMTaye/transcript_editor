#!/usr/bin/env python3
import asyncio
import click
import os
import sys
from typing import Optional
from pathlib import Path

# Add the parent directory to sys.path to allow imports from the app package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.transcript_service import transcript_service


class AsyncCliRunner:
    """Helper class to run async functions in Click commands"""

    def __init__(self, async_func, *args, **kwargs):
        self.async_func = async_func
        self.args = args
        self.kwargs = kwargs
        self.result = None

    def run(self):
        self.result = asyncio.run(self.async_func(*self.args, **self.kwargs))
        return self.result


class MockUploadFile:
    """Mock class to simulate FastAPI's UploadFile for local file uploads"""

    def __init__(self, filepath):
        self.filename = os.path.basename(filepath)
        self.content_type = self._guess_content_type(filepath)
        self.file = open(filepath, "rb")

    def _guess_content_type(self, filepath):
        # Simple content type guessing
        ext = os.path.splitext(filepath)[1].lower()
        if ext in [".mp3", ".m4a", ".wav"]:
            return f"audio/{ext[1:]}"
        return "application/octet-stream"


@click.group()
def cli():
    """Transcript Editor CLI - Interface for managing audio transcriptions"""


@cli.command()
def list_transcripts():
    """List all recent transcripts"""
    runner = AsyncCliRunner(transcript_service.get_recent_transcripts)
    transcripts = runner.run()

    if not transcripts:
        click.echo("No transcripts found.")
        return

    click.echo("\nRECENT TRANSCRIPTS:")
    click.echo("-" * 80)
    for t in transcripts:
        click.echo(f"ID: {t.id}")
        click.echo(f"Title: {t.title}")
        click.echo(f"Updated: {t.updated_at}")
        click.echo("-" * 80)


@cli.command()
@click.option(
    "--file", "-f", required=True, type=click.Path(exists=True), help="Audio file path"
)
@click.option("--title", "-t", required=True, help="Title for the transcript")
def upload(file: str, title: str):
    """Upload and transcribe an audio file"""
    click.echo(f"Uploading and transcribing: {file} with title: {title}")

    # Check if it's an audio file
    file_path = Path(file)
    if file_path.suffix.lower() not in [".mp3", ".m4a", ".wav"]:
        click.echo("Error: Only audio files (mp3, m4a, wav) are supported")
        return

    # Create mock UploadFile
    upload_file = MockUploadFile(file)

    try:
        # Run the transcription process
        runner = AsyncCliRunner(
            transcript_service.create_transcript_from_upload, title, upload_file
        )
        transcript = runner.run()

        click.echo("Transcription complete!")
        click.echo(f"Transcript ID: {transcript.id}")
        click.echo(f"Title: {transcript.title}")
        click.echo(f"Created at: {transcript.created_at}")

        # Display preview of the transcript
        if transcript.segments:
            click.echo("\nPreview:")
            for segment in transcript.segments[:3]:
                click.echo(
                    f"[{segment.start:.2f}s - {segment.end:.2f}s] {segment.text}"
                )
            if len(transcript.segments) > 3:
                click.echo("... (more segments available)")
    except ValueError as e:
        click.echo(f"Error: {str(e)}")
    except IOError as e:
        click.echo(f"File error: {str(e)}")
    finally:
        # Make sure to close the file
        upload_file.file.close()


@cli.command()
@click.argument("transcript_id")
def fetch(transcript_id: str):
    """Fetch a transcript by ID"""
    runner = AsyncCliRunner(transcript_service.get_transcript, transcript_id)
    transcript = runner.run()

    if not transcript:
        click.echo(f"No transcript found with ID: {transcript_id}")
        return

    click.echo(f"\nTranscript: {transcript.title}")
    click.echo(f"ID: {transcript.id}")
    click.echo(f"Created: {transcript.created_at}")
    click.echo(f"Updated: {transcript.updated_at}")

    if transcript.segments:
        click.echo("\nContent:")
        for segment in transcript.segments:
            click.echo(f"[{segment.start:.2f}s - {segment.end:.2f}s] {segment.text}")
    else:
        click.echo("\nNo content available.")


@cli.command()
@click.argument("transcript_id")
def refine(transcript_id: str):
    """Refine a transcript using LLM service"""
    click.echo(f"Refining transcript with ID: {transcript_id}...")

    runner = AsyncCliRunner(
        transcript_service.perform_llm_action, transcript_id, "refine"
    )
    transcript = runner.run()

    if not transcript:
        click.echo(f"No transcript found with ID: {transcript_id}")
        return

    click.echo(f"\nRefinement complete for: {transcript.title}")
    click.echo(f"Updated transcript ID: {transcript.id}")

    if transcript.segments:
        click.echo("\nRefined content preview:")
        for segment in transcript.segments[:3]:
            click.echo(f"[{segment.start:.2f}s - {segment.end:.2f}s] {segment.text}")
        if len(transcript.segments) > 3:
            click.echo("... (more segments available)")


@cli.command()
@click.argument("transcript_id")
@click.option(
    "--output",
    "-o",
    type=click.Path(),
    help="Output file path (default: transcript_[title].docx)",
)
def export(transcript_id: str, output: Optional[str] = None):
    """Export a transcript to Word document"""
    try:
        # First get the transcript to have access to the title if no output path specified
        if not output:
            get_runner = AsyncCliRunner(
                transcript_service.get_transcript, transcript_id
            )
            transcript = get_runner.run()

            if not transcript:
                click.echo(f"No transcript found with ID: {transcript_id}")
                return

            output = f"transcript_{transcript.title.replace(' ', '_')}.docx"

        click.echo(f"Exporting transcript {transcript_id} to {output}...")

        runner = AsyncCliRunner(transcript_service.export_to_word, transcript_id)
        file_stream = runner.run()

        # Save the file stream to disk
        with open(output, "wb") as f:
            f.write(file_stream.getvalue())

        click.echo(f"Exported successfully to {output}")
    except NotImplementedError:
        click.echo("Export functionality is not implemented in the backend yet.")
    except IOError as e:
        click.echo(f"File error: {str(e)}")
    except ValueError as e:
        click.echo(f"Value error: {str(e)}")


if __name__ == "__main__":
    cli()
