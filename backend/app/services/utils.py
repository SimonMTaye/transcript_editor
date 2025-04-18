import re
import hashlib
from typing import List
from ..models.transcript import TranscriptSegment


def generate_hash(content: str) -> str:
    """Generate a unique hash based on transcript content and timestamps"""
    hash_base = content
    # Generate SHA-256 hash and return first 16 characters as hex string
    hash_obj = hashlib.sha256(hash_base.encode("utf-8"))
    return hash_obj.hexdigest()[:16]


# Write a function that takes in a string transcript and outputs a list of segments
def transcript_to_segments(transcript: str) -> List[TranscriptSegment]:
    """
    Parse a transcript string with embedded timestamps into a list of TimestampSegment objects.

    Expected format: "[00:00:00.000 --> 00:00:05.123] Text segment"

    Args:
        transcript (str): The transcript text with embedded timestamps

    Returns:
        List[TimestampSegment]: List of parsed timestamp segments
    """
    # Regular expression to match timestamp format [HH:MM:SS.ms --> HH:MM:SS.ms]
    timestamp_pattern = re.compile(
        r"^\s*\[((?:\d{1,2}:)?(?:\d{1,2}:)?\d{1,2}(?:\.\d+)?)\s*-->\s*((?:\d{1,2}:)?(?:\d{1,2}:)?\d{1,2}(?:\.\d+)?)\]\s*(.*)",
        re.MULTILINE,
    )

    segments = []
    segment_id = 0

    for line in transcript.splitlines():
        match = timestamp_pattern.match(line)
        if match:
            start_str, end_str, text = match.groups()

            # Convert time string to seconds
            start_seconds = time_str_to_seconds(start_str)
            end_seconds = time_str_to_seconds(end_str)

            # Skip invalid segments (where end time is before start time)
            if end_seconds < start_seconds:
                continue

            # Create segment object
            segment = TranscriptSegment(
                id=segment_id,
                start=start_seconds,
                end=end_seconds,
                text=text.strip(),
            )

            segments.append(segment)
            segment_id += 1

    return segments


# Similarly write a function that takes in a list of segments and outputs a string transcript
def segments_to_transcript(segments: List[TranscriptSegment]) -> str:
    """
    Convert a list of TimestampSegment objects into a formatted transcript string with timestamps.

    Args:
        segments (List[TimestampSegment]): List of timestamp segments

    Returns:
        str: Formatted transcript with timestamps
    """
    if not segments:
        return ""

    transcript_lines = []

    for segment in segments:
        # Format start and end times
        start_formatted = format_seconds_to_time(segment.start)
        end_formatted = format_seconds_to_time(segment.end)

        # Create the timestamp line
        timestamp_line = f"[{start_formatted} --> {end_formatted}] {segment.text}"
        transcript_lines.append(timestamp_line)

    return "\n".join(transcript_lines)


def time_str_to_seconds(time_str: str) -> float:
    """
    Convert a time string (HH:MM:SS.ms, MM:SS.ms, or SS.ms) to seconds.

    Args:
        time_str (str): Time string in any of the accepted formats

    Returns:
        float: Time in seconds
    """
    parts = time_str.strip().split(":")
    seconds = 0.0

    if len(parts) == 3:  # HH:MM:SS.ms
        seconds += float(parts[0]) * 3600  # Hours
        seconds += float(parts[1]) * 60  # Minutes
        seconds += float(parts[2])  # Seconds
    elif len(parts) == 2:  # MM:SS.ms
        seconds += float(parts[0]) * 60  # Minutes
        seconds += float(parts[1])  # Seconds
    elif len(parts) == 1:  # SS.ms
        seconds += float(parts[0])  # Seconds

    return seconds


def format_seconds_to_time(seconds: float) -> str:
    """
    Format seconds as HH:MM:SS.mmm

    Args:
        seconds (float): Time in seconds

    Returns:
        str: Formatted time string
    """
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    # Format with milliseconds (3 decimal places)
    if hours > 0:
        return f"{int(hours):02d}:{int(minutes):02d}:{seconds:06.3f}"
    else:
        return f"{int(minutes):02d}:{seconds:06.3f}"
