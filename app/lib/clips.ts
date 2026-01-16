// app/lib/clips.ts
import type { Sentence } from "./transcript";

export type ClipCandidate = {
  start: number;
  end: number;
  duration: number;
  text: string;
  sentences: Sentence[];
};

export function buildClipCandidates(
  sentences: Sentence[],
  minSec = 15,
  maxSec = 60
): ClipCandidate[] {
  const clips: ClipCandidate[] = [];

  for (let i = 0; i < sentences.length; i++) {
    let start = sentences[i].start;
    let end = sentences[i].end;
    let j = i;

    while (j + 1 < sentences.length) {
      const next = sentences[j + 1];
      const duration = next.end - start;

      if (duration > maxSec) break;

      j++;
      end = next.end;

      if (duration >= minSec) {
        const slice = sentences.slice(i, j + 1);
        const text = slice.map(s => s.text).join(" ");

        clips.push({
          start,
          end,
          duration: Math.round(duration * 100) / 100,
          text,
          sentences: slice,
        });
      }
    }
  }

  return clips;
}
