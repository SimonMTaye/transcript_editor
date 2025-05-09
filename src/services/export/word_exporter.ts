import {
  TranscriptData,
  TranscriptMeta,
  TranscriptSegment,
} from "../../models/transcript";
import { Exporter } from ".";
import { Document, Packer, Paragraph, TextRun } from "docx";

function flattenSegements(segments: TranscriptSegment[]) {
  return segments.reduce((acc, segment) => {
    // If the last segment is from the same speaker, append the text
    if (acc.length > 0 && acc[acc.length - 1].speaker === segment.speaker) {
      acc[acc.length - 1].text += ` ${segment.text}`;
    } else {
      // Otherwise, push a new segment
      acc.push({
        speaker: segment.speaker,
        text: segment.text,
      });
    }
    return acc;
  }, [] as { speaker?: string; text: string }[]);
}

function segmentToParagraph(segment: { speaker?: string; text: string }) {
  // Set font to Aptos
  return new Paragraph({
    children: [
      new TextRun({
        text: `${segment.speaker}: ${segment.text}`,
        bold: segment.speaker === "ETRM",
      }),
    ],
  });
}

// Convert the transcript to a Word document format using the docx library
// Each segment should be a paragraph in the format
// [Speaker]: [text]

export const wordExport: Exporter = {
  async exportTranscript(meta: TranscriptMeta, data: TranscriptData) {
    // Before creating document, flatten the segments to join consecutive segments by the same speaker
    const flatSegments = flattenSegements(data.segments);
    // Create a new document
    // Set document font to aptos

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Aptos",
              size: 22, // Note: desired size is 11 but sizes are halved in output for some reason
            },
            paragraph: {},
          },
        },
      },
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `ETRM Interview Series - ${meta.title}`,
                  bold: true,
                }),
              ],
            }),
            // Add empty paragraph after title
            new Paragraph({}),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Insert subtitle and speaker description here",
                  italics: true,
                }),
              ],
            }),
            // Add additional empty paragraph for spacing
            new Paragraph({}),
            // Flatten the array by using flatMap to insert empty paragraphs between segments
            ...flatSegments.flatMap((segment, index) => [
              segmentToParagraph(segment),
              // Add empty paragraph after each segment except the last one
              ...(index < flatSegments.length - 1 ? [new Paragraph({})] : []),
            ]),
          ],
        },
      ],
    });

    // Create a buffer and save the document
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    // Make sure to set the correct MIME type for Word documents
    return blob;
  },
};
