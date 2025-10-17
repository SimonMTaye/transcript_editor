// Write a function that takes in a segment array and returns a word count
export function countWords(segments: { text: string }[]): number {
  return segments.reduce((total, segment) => {
    const words = segment.text.trim().split(/\s+/);
    return total + (words[0] === "" ? 0 : words.length);
  }, 0);
}

export function max(a: number, b: number): number {
  return a > b ? a : b;
}

export function min(a: number, b: number): number {
  return a < b ? a : b;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

export function calculateDurationFromSegments(segments: { start: number; end: number }[]): number {
  if (segments.length === 0) return 0;
  const lastSegment = segments[segments.length - 1];
  return lastSegment.end;
}