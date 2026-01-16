// app/api/highlights/route.ts
import { segmentsToSentences, type WhisperSegment } from "@/app/lib/transcript";
import { buildClipCandidates } from "@/app/lib/clips";
import { pickTopClips } from "@/app/lib/scoring";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const segments = (body?.segments ?? []) as WhisperSegment[];
    if (!Array.isArray(segments) || segments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Envie { segments: [...] }" }),
        { status: 400 }
      );
    }

    const sentences = segmentsToSentences(segments);
    const candidates = buildClipCandidates(sentences, 15, 60);
    const top = pickTopClips(candidates, 8);

    return Response.json({
      sentencesCount: sentences.length,
      candidatesCount: candidates.length,
      clips: top.map(c => ({
        start: c.start,
        end: c.end,
        duration: c.duration,
        score: c.score,
        text: c.text,
      })),
    });
  } catch (e: any) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e?.message ?? "Erro interno" }),
      { status: 500 }
    );
  }
}
