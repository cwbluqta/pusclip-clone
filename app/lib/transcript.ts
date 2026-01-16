// app/lib/transcript.ts
export type WhisperSegment = {
  start: number;
  end: number;
  text: string;
};

export type Sentence = {
  text: string;
  start: number;
  end: number;
  segmentIndex: number;
};

function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  // quebra por fim de frase (. ! ? …)
  const parts = cleaned.split(/(?<=[.!?…])\s+/g);
  return parts.map(s => s.trim()).filter(Boolean);
}

export function segmentsToSentences(
  segments: WhisperSegment[]
): Sentence[] {
  const sentences: Sentence[] = [];

  segments.forEach((seg, idx) => {
    const segText = (seg.text ?? "").trim();
    if (!segText) return;

    const sents = splitIntoSentences(segText);
    if (sents.length === 0) return;

    const segDuration = Math.max(0, seg.end - seg.start);

    const lengths = sents.map(s => Math.max(1, s.length));
    const totalLen = lengths.reduce((a, b) => a + b, 0);

    let cursor = seg.start;

    for (let i = 0; i < sents.length; i++) {
      const frac = lengths[i] / totalLen;
      const dur = segDuration * frac;

      const start = cursor;
      const end =
        i === sents.length - 1 ? seg.end : cursor + dur;

      cursor = end;

      sentences.push({
        text: sents[i],
        start: Math.round(start * 1000) / 1000,
        end: Math.round(end * 1000) / 1000,
        segmentIndex: idx,
      });
    }
  });

  return mergeTinySentences(sentences);
}

function mergeTinySentences(sentences: Sentence[]): Sentence[] {
  const out: Sentence[] = [];

  for (const s of sentences) {
    const last = out[out.length - 1];
    const tiny = s.text.length <= 12;

    if (last && tiny && s.start - last.end < 0.3) {
      last.text = `${last.text} ${s.text}`.trim();
      last.end = s.end;
    } else {
      out.push({ ...s });
    }
  }

  return out;
}
