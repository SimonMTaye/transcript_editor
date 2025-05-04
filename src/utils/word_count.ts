// Write a function that takes in a segment array and returns a word count
export function countWords(segments: { text: string }[]): number {
  return segments.reduce((total, segment) => {
    const words = segment.text.trim().split(/\s+/);
    return total + (words[0] === "" ? 0 : words.length);
  }, 0);
}
